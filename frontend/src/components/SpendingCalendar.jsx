import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import AnimatedNumber from "./AnimatedNumber";
import { getCategoryMeta } from "../utils/autoCategorizer";

export default function SpendingCalendar({
  transactions = [],
  dailyLimit = 40,
  onExit,
}) {
  const { language, t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === month;

  // Month navigation handlers
  const handlePrevMonth = () => {
    setSelectedDay(null);
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setSelectedDay(null);
    setViewDate(new Date());
  };

  // Aggregate daily expenses and income for active month
  const dailySpendingMap = {};
  const dailyIncomeMap = {};
  const dailyTxMap = {};

  let totalMonthExpense = 0;
  let totalMonthIncome = 0;

  // Also compute previous month expense for comparison
  const prevMonthDate = new Date(year, month - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();
  let prevMonthExpense = 0;

  transactions.forEach((tx) => {
    const d = new Date(tx.dateTime || tx.date);
    const txYear = d.getFullYear();
    const txMonth = d.getMonth();
    const amount = parseFloat(tx.amount || 0);

    if (txYear === year && txMonth === month) {
      const dayNum = d.getDate();
      if (tx.type === "EXPENSE") {
        dailySpendingMap[dayNum] = (dailySpendingMap[dayNum] || 0) + amount;
        totalMonthExpense += amount;
      } else if (tx.type === "INCOME") {
        dailyIncomeMap[dayNum] = (dailyIncomeMap[dayNum] || 0) + amount;
        totalMonthIncome += amount;
      }
      if (!dailyTxMap[dayNum]) dailyTxMap[dayNum] = [];
      dailyTxMap[dayNum].push(tx);
    } else if (txYear === prevYear && txMonth === prevMonth && tx.type === "EXPENSE") {
      prevMonthExpense += amount;
    }
  });

  const locale = { en: "en-GB", es: "es-ES", fr: "fr-FR", pt: "pt-PT" }[language] || "en-GB";
  const monthName = viewDate.toLocaleString(locale, { month: "long" });
  const prevMonthName = prevMonthDate.toLocaleString(locale, { month: "short" });

  const getDayStatus = (day) => {
    const spent = dailySpendingMap[day] || 0;
    if (spent === 0) return "status-none";
    if (spent > dailyLimit) return "status-over";
    if (spent >= dailyLimit * 0.75) return "status-near";
    return "status-under";
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  return (
    <div className="card calendar-card">
      {/* ── Top Bar with Exit & Month Navigation ────────────────────── */}
      <div className="calendar-top-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {onExit && (
            <button
              type="button"
              className="calendar-exit-btn"
              onClick={onExit}
              title={t("exitCalendar") || "Exit Calendar"}
            >
              ← {t("exitCalendar") || "Exit"}
            </button>
          )}
          <div>
            <h3 className="chart-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📅</span>
              <span>{monthName} {year}</span>
              {isCurrentMonth && <span className="today-badge-chip">CURRENT</span>}
            </h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
              {t("spendingCalendarTitle")} · {t("dailyLimit") || "Daily limit"}: €{(Number(dailyLimit) || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Previous / Today / Next Navigation */}
        <div className="calendar-nav-controls">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            title={t("prevMonth") || "Previous Month"}
          >
            ◀ {t("prevMonth") || "Previous"}
          </button>
          {!isCurrentMonth && (
            <button
              type="button"
              className="calendar-nav-btn calendar-nav-btn--today"
              onClick={handleToday}
            >
              {t("today") || "Today"}
            </button>
          )}
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            title={t("nextMonth") || "Next Month"}
          >
            {t("nextMonth") || "Next"} ▶
          </button>
        </div>
      </div>

      {/* ── Month Summary & Comparison Banner ───────────────────────── */}
      <div className="calendar-summary-banner">
        <div className="cal-stat-item">
          <span className="cal-stat-label">{monthName} {t("spent") || "Spent"}</span>
          <span className="cal-stat-val expense">
            <AnimatedNumber value={totalMonthExpense} prefix="€" decimals={2} />
          </span>
        </div>
        <div className="cal-stat-item">
          <span className="cal-stat-label">{monthName} {t("income") || "Income"}</span>
          <span className="cal-stat-val income">
            <AnimatedNumber value={totalMonthIncome} prefix="€" decimals={2} />
          </span>
        </div>
        <div className="cal-stat-item">
          <span className="cal-stat-label">{prevMonthName} {year} ({t("spent") || "Spent"})</span>
          <span className="cal-stat-val muted">
            <AnimatedNumber value={prevMonthExpense} prefix="€" decimals={2} />
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend-bar">
        <div className="calendar-legend">
          <span className="legend-item"><span className="legend-dot status-under"></span> {t("underLimit")}</span>
          <span className="legend-item"><span className="legend-dot status-near"></span> {t("nearLimit")}</span>
          <span className="legend-item"><span className="legend-dot status-over"></span> {t("overLimit")}</span>
          <span className="legend-item"><span className="legend-dot status-none"></span> {t("noSpend")}</span>
        </div>
      </div>

      {/* ── Calendar Grid ─────────────────────────────────────────── */}
      <div className="calendar-grid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="calendar-weekday-header">
            {d}
          </div>
        ))}

        {blankDays.map((b) => (
          <div key={`blank-${b}`} className="calendar-day-cell blank" />
        ))}

        {daysArray.map((day) => {
          const spent = dailySpendingMap[day] || 0;
          const income = dailyIncomeMap[day] || 0;
          const status = getDayStatus(day);
          const isToday = isCurrentMonth && day === now.getDate();
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              type="button"
              className={`calendar-day-cell ${status} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
            >
              <span className="day-number">{day}</span>
              {spent > 0 && <span className="day-spend">€{spent >= 100 ? Math.round(spent) : spent.toFixed(1)}</span>}
              {income > 0 && <span className="day-income-dot" title={`+€${income.toFixed(2)} income`}>+{Math.round(income)}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Selected Day Transaction Breakdown Drawer ─────────────── */}
      {selectedDay && (
        <div className="calendar-day-details">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 15, color: "#f97316", fontWeight: 800 }}>
                📅 {monthName} {selectedDay}, {year}
              </h4>
              <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.7 }}>
                {(dailyTxMap[selectedDay] || []).length} transactions recorded
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: (dailySpendingMap[selectedDay] || 0) > dailyLimit ? "#ef4444" : "#22c55e" }}>
                Spent: €{(dailySpendingMap[selectedDay] || 0).toFixed(2)}
              </span>
              <button
                type="button"
                className="calendar-drawer-close"
                onClick={() => setSelectedDay(null)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {(dailyTxMap[selectedDay] || []).length === 0 ? (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "8px 0" }}>
              {t("noSpend")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dailyTxMap[selectedDay].map((tx) => {
                const txDate = new Date(tx.dateTime || tx.date || now);
                const timeStr = txDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
                const meta = getCategoryMeta(tx.category);

                return (
                  <div
                    key={tx.id}
                    className={`calendar-tx-row ${tx.type === "INCOME" ? "calendar-tx-income" : "calendar-tx-expense"}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      <span className="cal-tx-icon">{tx.type === "INCOME" ? "💵" : "💸"}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {tx.name}
                        </div>
                        <div style={{ fontSize: 10.5, opacity: 0.75, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span style={{ color: meta.color, fontWeight: 700 }}>
                            {meta.icon} {tx.category || "General"}
                          </span>
                          <span>·</span>
                          <span>🕒 {timeStr}</span>
                          {tx.description && <span>· {tx.description}</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`tx-amount ${tx.type === "INCOME" ? "income" : "expense"}`} style={{ fontSize: 14, fontWeight: 800 }}>
                      {tx.type === "INCOME" ? "+" : "-"}€{parseFloat(tx.amount).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import AnimatedNumber from "./AnimatedNumber";
import {
  getYearlyMonthlyAnalytics,
  getBudgetMaintenanceAdvisor,
} from "../utils/monthlyAnalytics";

export default function MonthlyComparison({
  transactions = [],
  budgetAmount = 1000,
  dailyLimit = 35,
  onExit,
  onApplyBudget,
}) {
  const { t } = useLanguage();
  const currentActualYear = new Date().getFullYear();
  const currentActualMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentActualYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const analytics = getYearlyMonthlyAnalytics({
    transactions,
    monthlyBudget: budgetAmount,
    targetYear: selectedYear,
  });

  const advisor = getBudgetMaintenanceAdvisor({
    analytics,
    monthlyBudget: budgetAmount,
    dailyLimit,
  });

  const handleApplyBudgetClick = () => {
    if (onApplyBudget) {
      onApplyBudget(advisor.recommendedBudget, advisor.recommendedDaily);
      setAppliedNotice(true);
      setTimeout(() => setAppliedNotice(false), 4000);
    }
  };

  const selectedMonth =
    selectedMonthIndex !== null ? analytics.monthlyData[selectedMonthIndex] : null;

  return (
    <div className="monthly-comparison-view">
      {/* ── Top Header & Year Selector ────────────────────────────── */}
      <div className="monthly-top-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {onExit && (
            <button
              type="button"
              className="calendar-exit-btn"
              onClick={onExit}
              title={t("exitCalendar") || "Exit to Dashboard"}
            >
              ← {t("exitCalendar") || "Exit"}
            </button>
          )}
          <div>
            <h2 className="monthly-view-title">
              <span>📊</span>
              <span>{t("monthlyComparison") || "Monthly Spending Comparison"}</span>
            </h2>
            <p className="monthly-view-sub">
              {t("compareMonthsSub") || "Track monthly expenses, compare spending across months, and maintain your budget."}
            </p>
          </div>
        </div>

        {/* Year Selector & Health Score */}
        <div className="monthly-header-actions">
          <div className="year-selector-group">
            {analytics.availableYears.map((yr) => (
              <button
                key={yr}
                type="button"
                className={`year-btn ${selectedYear === yr ? "active" : ""}`}
                onClick={() => {
                  setSelectedYear(yr);
                  setSelectedMonthIndex(null);
                }}
              >
                {yr}
              </button>
            ))}
          </div>

          <div
            className="budget-health-pill"
            title="Percentage of months kept under budget limit"
          >
            <span>🛡️ {t("budgetHealth") || "Budget Health"}:</span>
            <strong style={{ color: analytics.budgetHealthScore >= 75 ? "#4ade80" : "#f87171" }}>
              {analytics.budgetHealthScore}%
            </strong>
          </div>
        </div>
      </div>

      {/* ── Notification of Applied Budget ────────────────────────── */}
      {appliedNotice && (
        <div className="budget-applied-banner">
          🎉 {t("budgetAppliedSuccess") || `Successfully updated your monthly budget to €${advisor.recommendedBudget.toFixed(2)} and daily limit to €${advisor.recommendedDaily.toFixed(2)}!`}
        </div>
      )}

      {/* ── Multi-Month Comparison Hero Cards ─────────────────────── */}
      <div className="monthly-hero-grid">
        {/* 1. This Month vs Previous Month */}
        <div className="monthly-hero-card">
          <div className="hero-card-header">
            <span className="hero-card-icon">💸</span>
            <span className="hero-card-label">{t("thisMonth") || "This Month"} ({analytics.currentMonthData.monthShort})</span>
          </div>
          <div className="hero-card-value">
            <AnimatedNumber value={analytics.currentMonthData.totalExpense} prefix="€" decimals={2} />
          </div>
          <div className="hero-rating-row">
            <span className={`hero-tier-chip tier-badge--${(analytics.currentMonthData.tierKey || "").toLowerCase()}`}>
              {analytics.currentMonthData.tierIcon} {t(analytics.currentMonthData.tierKey) || analytics.currentMonthData.tier}
            </span>
            <span className="hero-stars-display" title={`${analytics.currentMonthData.stars}/5 stars`}>
              {analytics.currentMonthData.stars > 0 ? "★".repeat(analytics.currentMonthData.stars) : "—"}
            </span>
          </div>
          <div className="hero-card-footer">
            {analytics.currentMonthData.momChangeDiff !== 0 ? (
              <span
                className={`mom-tag ${
                  analytics.currentMonthData.momChangeDiff > 0 ? "mom-higher" : "mom-lower"
                }`}
              >
                {analytics.currentMonthData.momChangeDiff > 0 ? "↑ +" : "↓ "}
                €{Math.abs(analytics.currentMonthData.momChangeDiff).toFixed(2)} ({analytics.currentMonthData.momChangePct > 0 ? "+" : ""}{analytics.currentMonthData.momChangePct}%) vs {analytics.prevMonthData.monthShort}
              </span>
            ) : (
              <span className="mom-tag mom-neutral">— Same as last month</span>
            )}
          </div>
        </div>

        {/* 2. Highest Spending Month */}
        <div className="monthly-hero-card hero-card--peak">
          <div className="hero-card-header">
            <span className="hero-card-icon">🔥</span>
            <span className="hero-card-label">{t("highestSpendMonth") || "Peak Spending Month"}</span>
          </div>
          <div className="hero-card-value danger">
            {analytics.highestMonth ? (
              <>
                <AnimatedNumber value={analytics.highestMonth.totalExpense} prefix="€" decimals={2} />
                <span className="hero-month-tag">({analytics.highestMonth.monthShort})</span>
              </>
            ) : (
              "€0.00"
            )}
          </div>
          {analytics.highestMonth && analytics.highestMonth.totalExpense > 0 && (
            <div className="hero-rating-row">
              <span className={`hero-tier-chip tier-badge--${(analytics.highestMonth.tierKey || "").toLowerCase()}`}>
                {analytics.highestMonth.tierIcon} {t(analytics.highestMonth.tierKey) || analytics.highestMonth.tier}
              </span>
              <span className="hero-stars-display">
                {"★".repeat(analytics.highestMonth.stars)}
              </span>
            </div>
          )}
          <div className="hero-card-footer">
            {analytics.highestMonth && analytics.highestMonth.topCategory ? (
              <span className="hero-subtext">
                Top: {analytics.highestMonth.topCategory.icon} {analytics.highestMonth.topCategory.name} (€{analytics.highestMonth.topCategory.amount.toFixed(2)})
              </span>
            ) : (
              <span className="hero-subtext">No peak recorded</span>
            )}
          </div>
        </div>

        {/* 3. Lowest / Most Frugal Month */}
        <div className="monthly-hero-card hero-card--frugal">
          <div className="hero-card-header">
            <span className="hero-card-icon">🏆</span>
            <span className="hero-card-label">{t("lowestSpendMonth") || "Most Frugal Month"}</span>
          </div>
          <div className="hero-card-value safe">
            {analytics.lowestMonth ? (
              <>
                <AnimatedNumber value={analytics.lowestMonth.totalExpense} prefix="€" decimals={2} />
                <span className="hero-month-tag">({analytics.lowestMonth.monthShort})</span>
              </>
            ) : (
              "€0.00"
            )}
          </div>
          {analytics.lowestMonth && analytics.lowestMonth.totalExpense > 0 && (
            <div className="hero-rating-row">
              <span className={`hero-tier-chip tier-badge--${(analytics.lowestMonth.tierKey || "").toLowerCase()}`}>
                {analytics.lowestMonth.tierIcon} {t(analytics.lowestMonth.tierKey) || analytics.lowestMonth.tier}
              </span>
              <span className="hero-stars-display">
                {"★".repeat(analytics.lowestMonth.stars)}
              </span>
            </div>
          )}
          <div className="hero-card-footer">
            {analytics.lowestMonth ? (
              <span className="hero-subtext">
                Net Saved: +€{analytics.lowestMonth.netSavings.toFixed(2)}
              </span>
            ) : (
              <span className="hero-subtext">No data</span>
            )}
          </div>
        </div>

        {/* 4. Average Monthly Spend */}
        <div className="monthly-hero-card">
          <div className="hero-card-header">
            <span className="hero-card-icon">📈</span>
            <span className="hero-card-label">{t("avgMonthlySpend") || "Average Monthly Spend"}</span>
          </div>
          <div className="hero-card-value highlight">
            <AnimatedNumber value={analytics.avgMonthlySpend} prefix="€" decimals={2} />
            <span className="hero-unit">/{t("perMonth") || "mo"}</span>
          </div>
          <div className="hero-card-footer">
            <span className="hero-subtext">
              Total {selectedYear}: €{analytics.totalYearlySpend.toFixed(2)} ({analytics.activeMonthsCount} active {t("monthly") || "months"})
            </span>
          </div>
        </div>
      </div>

      {/* ── Smart Budget Maintenance & Advisor Section ─────────────── */}
      <div className="card budget-maintenance-card">
        <div className="advisor-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="advisor-avatar">🛡️</div>
            <div>
              <h3 className="chart-title" style={{ margin: 0 }}>
                {t("budgetMaintenanceTitle") || "Smart Budget Maintenance & Advisor"}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.7 }}>
                {t("budgetMaintenanceSub") || "Historical spending baselines & recommendations to keep your budget balanced."}
              </p>
            </div>
          </div>

          {advisor.isAdjustmentRecommended && onApplyBudget && (
            <button
              type="button"
              className="apply-budget-btn"
              onClick={handleApplyBudgetClick}
            >
              ⚡ {t("applyRecommendedBudget") || "Apply Recommended Budget"} (€{advisor.recommendedBudget})
            </button>
          )}
        </div>

        {/* Advisor Target Comparison Pill */}
        <div className="advisor-target-banner">
          <div className="advisor-target-item">
            <span className="advisor-target-label">{t("currentBudget") || "Current Budget"}</span>
            <span className="advisor-target-val">€{budgetAmount.toFixed(2)}</span>
          </div>
          <span className="advisor-arrow">→</span>
          <div className="advisor-target-item highlight">
            <span className="advisor-target-label">{t("recommendedBudget") || "Recommended Target"}</span>
            <span className="advisor-target-val">€{advisor.recommendedBudget.toFixed(2)}</span>
          </div>
          <div className="advisor-target-item">
            <span className="advisor-target-label">{t("safeDailyPace") || "Safe Daily Pace"}</span>
            <span className="advisor-target-val dynamic">€{advisor.recommendedDaily.toFixed(2)}/day</span>
          </div>
        </div>

        {/* Maintenance Tips */}
        <div className="advisor-tips-list">
          {advisor.tips.map((tip, idx) => (
            <div key={idx} className={`advisor-tip-item advisor-tip--${tip.type}`}>
              <span className="advisor-tip-icon">{tip.icon}</span>
              <div style={{ flex: 1 }}>
                <h4 className="advisor-tip-title">{tip.title}</h4>
                <p className="advisor-tip-desc">{tip.desc}</p>
                <p className="advisor-tip-action">💡 <strong>Action:</strong> {tip.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Interactive 12-Month Comparison Bar Chart Matrix ───────── */}
      <div className="card monthly-chart-card">
        <div className="chart-header" style={{ marginBottom: 16 }}>
          <div>
            <h3 className="chart-title">
              📊 {t("monthByMonthChart") || "Month-by-Month Spending vs Budget"} ({selectedYear})
            </h3>
            <p className="chart-subtitle">
              {t("chartClickHint") || "Tap on any month column to inspect category breakdowns and details."}
            </p>
          </div>
          <div className="monthly-chart-legend">
            <span className="legend-chip under"><span className="legend-dot status-under"></span> Under Budget</span>
            <span className="legend-chip over"><span className="legend-dot status-over"></span> Over Budget</span>
            <span className="legend-chip income"><span className="legend-dot status-income"></span> Income</span>
          </div>
        </div>

        {/* Grid of 12 Bars */}
        <div className="monthly-bars-container">
          <div className="monthly-bars-grid">
            {analytics.monthlyData.map((m, idx) => {
              const maxVal = Math.max(
                budgetAmount * 1.3,
                analytics.highestMonth ? analytics.highestMonth.totalExpense * 1.1 : 1000
              );
              const heightPct = maxVal > 0 ? Math.min(100, Math.max(4, (m.totalExpense / maxVal) * 100)) : 4;
              const isSelected = selectedMonthIndex === idx;
              const isCurrentMonth =
                selectedYear === currentActualYear && idx === new Date().getMonth();

              return (
                <div
                  key={m.monthShort}
                  className={`monthly-bar-col ${isSelected ? "selected" : ""} ${
                    isCurrentMonth ? "current-month" : ""
                  }`}
                  onClick={() =>
                    setSelectedMonthIndex(selectedMonthIndex === idx ? null : idx)
                  }
                  title={`Click to view ${m.monthFull} ${selectedYear} breakdown & report`}
                >
                  {/* MoM % badge above bar */}
                  <div className="bar-mom-tag">
                    {m.totalExpense > 0 && m.momChangeDiff !== 0 ? (
                      <span className={`bar-mom-chip ${m.momChangeDiff > 0 ? "up" : "down"}`}>
                        {m.momChangeDiff > 0 ? "+" : ""}{m.momChangePct}%
                      </span>
                    ) : (
                      <span style={{ visibility: "hidden" }}>—</span>
                    )}
                  </div>

                  {/* Track & Fill */}
                  <div className="monthly-bar-track">
                    <div
                      className={`monthly-bar-fill ${
                        m.isOverBudget
                          ? "fill-over"
                          : m.pctUsed >= 75
                          ? "fill-warn"
                          : m.totalExpense > 0
                          ? "fill-safe"
                          : "fill-empty"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  {/* Month Label */}
                  <span className={`monthly-bar-label ${isCurrentMonth ? "current" : ""}`}>
                    {m.monthShort}
                  </span>

                  {/* Amount Spent */}
                  <span className="monthly-bar-amount">
                    {m.totalExpense > 0 ? `€${Math.round(m.totalExpense)}` : "€0"}
                  </span>

                  {/* Stars Tag & Performance Tier */}
                  <div className="bar-stars-tag" title={`${m.stars} Stars · ${t(m.tierKey) || m.tier}`}>
                    <span className="bar-stars-glyph">
                      {m.stars > 0 ? "★".repeat(m.stars) : "—"}
                    </span>
                    <span
                      className={`monthly-grade-pill tier-badge--${(m.tierKey || "").toLowerCase()}`}
                      style={{ backgroundColor: `${m.gradeColor}22`, color: m.gradeColor, borderColor: `${m.gradeColor}55` }}
                    >
                      {t(m.tierKey) || m.tier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Selected Month Detail Drawer & End of Month Report ─────── */}
      {selectedMonth && (
        <div className="card selected-month-drawer">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#f97316" }}>
                📅 {selectedMonth.monthFull} {selectedYear} {t("breakdown") || "Breakdown"}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.7 }}>
                {selectedMonth.txCount} transactions recorded · {t("performanceRating") || "Performance"}: <strong style={{ color: selectedMonth.gradeColor }}>{t(selectedMonth.tierKey) || selectedMonth.tier} ({selectedMonth.stars}/5 ⭐)</strong>
              </p>
            </div>
            <button
              type="button"
              className="calendar-drawer-close"
              onClick={() => setSelectedMonthIndex(null)}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* 🌟 End of Month Performance Report Card 🌟 */}
          <div className="month-end-report-card">
            <div className="month-end-badge-row">
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className={`tier-badge tier-badge--${(selectedMonth.tierKey || "").toLowerCase()}`}>
                  {selectedMonth.tierIcon} {t(selectedMonth.tierKey) || selectedMonth.tier}
                </span>
                <span className="month-end-grade-tag" style={{ color: selectedMonth.gradeColor }}>
                  Grade {selectedMonth.grade}
                </span>
                {(selectedYear < currentActualYear || (selectedYear === currentActualYear && selectedMonthIndex < currentActualMonth)) && (
                  <span
                    className="period-status-chip period-status-chip--closed"
                    title="This accounting period is closed and locked for check & balance integrity"
                  >
                    🔒 {t("periodClosedBalanced") || "Closed & Balanced Period"}
                  </span>
                )}
                {selectedYear === currentActualYear && selectedMonthIndex === currentActualMonth && (
                  <span
                    className="period-status-chip period-status-chip--active"
                    title="This is the active open period"
                  >
                    🟢 {t("currentActivePeriod") || "Current Active Period"}
                  </span>
                )}
              </div>
              <div className="month-end-score-pill">
                <span>⭐ {selectedMonth.ratingScore > 0 ? selectedMonth.ratingScore.toFixed(1) : "0.0"} / 5.0</span>
              </div>
            </div>

            {/* Glowing 5-Star Visual Row */}
            <div className="monthly-stars-row" title={`${selectedMonth.stars} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`star-glyph ${s <= selectedMonth.stars ? "star-filled" : "star-empty"}`}
                >
                  ★
                </span>
              ))}
              <span className="stars-label">
                ({selectedMonth.stars} {t("starsEarned") || "Stars Earned"})
              </span>
            </div>

            {/* Closing Month-End Review Verdict */}
            <div className="month-end-verdict-box">
              <span className="month-end-verdict-icon">📋</span>
              <p className="month-end-verdict">
                <strong>{t("endOfMonthVerdict") || "End of Month Performance Review"}:</strong> {selectedMonth.feedback}
              </p>
            </div>
          </div>

          <div className="selected-month-stats-grid">
            <div className="sel-stat-item">
              <span className="sel-stat-label">{t("spent") || "Spent"}</span>
              <span className="sel-stat-val expense">€{selectedMonth.totalExpense.toFixed(2)}</span>
            </div>
            <div className="sel-stat-item">
              <span className="sel-stat-label">{t("income") || "Income"}</span>
              <span className="sel-stat-val income">€{selectedMonth.totalIncome.toFixed(2)}</span>
            </div>
            <div className="sel-stat-item">
              <span className="sel-stat-label">{t("net") || "Net Saved"}</span>
              <span className={`sel-stat-val ${selectedMonth.netSavings >= 0 ? "income" : "expense"}`}>
                {selectedMonth.netSavings >= 0 ? "+" : ""}€{selectedMonth.netSavings.toFixed(2)}
              </span>
            </div>
            <div className="sel-stat-item">
              <span className="sel-stat-label">{t("budgetUsed") || "Budget Used"}</span>
              <span className={`sel-stat-val ${selectedMonth.isOverBudget ? "danger" : "safe"}`}>
                {selectedMonth.pctUsed}%
              </span>
            </div>
          </div>

          {/* Categories for this month */}
          {selectedMonth.categories.length > 0 ? (
            <div style={{ marginTop: 14 }}>
              <h5 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.8 }}>
                {t("categoryBreakdown") || "Category Breakdown"}
              </h5>
              <div className="sel-categories-grid">
                {selectedMonth.categories.map((c) => (
                  <div key={c.name} className="sel-cat-card">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{c.icon}</span>
                      <div>
                        <strong style={{ fontSize: 13 }}>{c.name}</strong>
                        <span style={{ display: "block", fontSize: 10.5, opacity: 0.7 }}>{c.pct}% of month</span>
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, color: c.color, fontSize: 13 }}>
                      €{c.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ margin: "10px 0 0", fontSize: 12, opacity: 0.6 }}>No expense transactions recorded in {selectedMonth.monthFull}.</p>
          )}
        </div>
      )}

      {/* ── Full Month-by-Month Comparison Table ───────────────────── */}
      <div className="card monthly-table-card">
        <h3 className="chart-title" style={{ marginBottom: 14 }}>
          📋 {t("monthlyComparisonTable") || "All Months Spending Summary"} ({selectedYear})
        </h3>

        <div className="monthly-table-responsive">
          <table className="monthly-table">
            <thead>
              <tr>
                <th>{t("month") || "Month"}</th>
                <th>{t("spent") || "Spent"}</th>
                <th>{t("income") || "Income"}</th>
                <th>{t("net") || "Net Balance"}</th>
                <th>{t("budgetUsed") || "% of Budget"}</th>
                <th>{t("topCategory") || "Top Category"}</th>
                <th>{t("vsPriorMonth") || "vs Prior Month"}</th>
                <th>{t("starsAndPerformance") || "Rating & Stars"}</th>
              </tr>
            </thead>
            <tbody>
              {analytics.monthlyData.map((m, idx) => (
                <tr
                  key={m.monthShort}
                  className={`table-row-month ${selectedMonthIndex === idx ? "active-row" : ""}`}
                  onClick={() => setSelectedMonthIndex(selectedMonthIndex === idx ? null : idx)}
                >
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <strong>{m.monthFull}</strong>
                      {selectedYear < currentActualYear || (selectedYear === currentActualYear && idx < currentActualMonth) ? (
                        <span
                          title={t("periodClosedBalanced") || "Closed Period (Locked)"}
                          style={{ fontSize: 11, opacity: 0.7 }}
                        >
                          🔒
                        </span>
                      ) : selectedYear === currentActualYear && idx === currentActualMonth ? (
                        <span
                          title={t("currentActivePeriod") || "Active Period"}
                          style={{ fontSize: 10, color: "#4ade80" }}
                        >
                          🟢
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="spent-col">
                    <strong>€{m.totalExpense.toFixed(2)}</strong>
                  </td>
                  <td className="income-col">
                    €{m.totalIncome.toFixed(2)}
                  </td>
                  <td className={m.netSavings >= 0 ? "net-pos" : "net-neg"}>
                    {m.netSavings >= 0 ? "+" : ""}€{m.netSavings.toFixed(2)}
                  </td>
                  <td>
                    <div className="table-budget-bar-wrap">
                      <div
                        className={`table-budget-bar ${m.isOverBudget ? "over" : "safe"}`}
                        style={{ width: `${Math.min(100, m.pctUsed)}%` }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{m.pctUsed}%</span>
                    </div>
                  </td>
                  <td>
                    {m.topCategory ? (
                      <span className="table-top-cat">
                        {m.topCategory.icon} {m.topCategory.name} (€{Math.round(m.topCategory.amount)})
                      </span>
                    ) : (
                      <span style={{ opacity: 0.5 }}>—</span>
                    )}
                  </td>
                  <td>
                    {m.totalExpense > 0 && m.momChangeDiff !== 0 ? (
                      <span className={`table-mom ${m.momChangeDiff > 0 ? "up" : "down"}`}>
                        {m.momChangeDiff > 0 ? "↑ +" : "↓ "}€{Math.abs(m.momChangeDiff).toFixed(0)} ({m.momChangePct > 0 ? "+" : ""}{m.momChangePct}%)
                      </span>
                    ) : (
                      <span style={{ opacity: 0.5 }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="table-stars-cell">
                      <span className="table-stars-icons" title={`${m.stars}/5 stars`}>
                        {m.stars > 0 ? "★".repeat(m.stars) : "—"}
                      </span>
                      <span
                        className={`table-tier-badge tier-badge--${(m.tierKey || "").toLowerCase()}`}
                        style={{ backgroundColor: `${m.gradeColor}22`, color: m.gradeColor, borderColor: `${m.gradeColor}66` }}
                      >
                        {m.tierIcon} {t(m.tierKey) || m.tier}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


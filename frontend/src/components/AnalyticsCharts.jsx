import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../LanguageContext";
import { getCategoryMeta } from "../utils/autoCategorizer";
import { generateSmartInsights } from "../utils/smartInsights";
import { printMonthlyFinancialReport } from "../utils/exportUtils";
import AnimatedNumber from "./AnimatedNumber";
import WheelDatePicker from "./WheelDatePicker";
import "../styles/AnalyticsCharts.css";

/**
 * AnalyticsCharts Component
 * Comprehensive financial analysis & time-series graph suite:
 * - Interactive Timeline & Curve Graph with exact transaction Date & Time tooltips
 * - Time-of-Day 24-Hour clock & 4-Quadrant (Morning/Afternoon/Evening/Night) distribution
 * - Day-of-Week (Mon-Sun) spending pattern comparison
 * - Interactive Category Donut Chart
 * - Day-by-Day bar chart vs Daily Limit reference line
 * - Detailed Date & Time transaction audit log
 */
export default function AnalyticsCharts({
  transactions = [],
  budgetAmount = 1000,
  dailyLimit = 35,
  currencySymbol = "€",
  username = "User",
}) {
  const { t } = useLanguage();

  // Active View & Filters
  const [activeTab, setActiveTab] = useState("timeline"); // 'timeline' | 'timeOfDay' | 'dayOfWeek' | 'category' | 'dailyBars'
  const [datePreset, setDatePreset] = useState("thisMonth"); // 'today' | 'thisWeek' | 'thisMonth' | 'last30Days' | 'ytd' | 'custom'
  const [targetDate, setTargetDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Hover & Selected state for SVG timeline
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const scrollTrackRef = useRef(null);

  // Safe transaction list
  const txList = useMemo(() => (Array.isArray(transactions) ? transactions : []), [transactions]);

  // Target month & year navigation
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();

  const handlePrevMonth = () => {
    setTargetDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setDatePreset("thisMonth");
  };

  const handleNextMonth = () => {
    setTargetDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setDatePreset("thisMonth");
  };

  // Filter transactions based on datePreset & custom range & selectedCategory
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return txList.filter((tx) => {
      if (!tx) return false;
      const rawDate = tx.dateTime || tx.date || tx.createdAt;
      const txDate = new Date(rawDate || Date.now());
      if (isNaN(txDate.getTime())) return false;

      // Category filter
      if (selectedCategory !== "ALL" && (tx.category || "General") !== selectedCategory) {
        return false;
      }

      if (datePreset === "today") {
        return (
          txDate.getDate() === now.getDate() &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      } else if (datePreset === "thisWeek") {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek && txDate <= now;
      } else if (datePreset === "thisMonth") {
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      } else if (datePreset === "last30Days") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return txDate >= thirtyDaysAgo && txDate <= now;
      } else if (datePreset === "ytd") {
        return txDate.getFullYear() === now.getFullYear() && txDate <= now;
      } else if (datePreset === "custom") {
        const start = new Date(customStartDate + "T00:00:00");
        const end = new Date(customEndDate + "T23:59:59");
        return txDate >= start && txDate <= end;
      }
      return true;
    });
  }, [txList, datePreset, currentMonth, currentYear, customStartDate, customEndDate, selectedCategory]);

  // Aggregate Metrics
  const summaryMetrics = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let peakTx = null;

    filteredTransactions.forEach((tx) => {
      const amount = parseFloat(tx.amount || 0);
      if (tx.type === "INCOME") {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        if (!peakTx || amount > parseFloat(peakTx.amount || 0)) {
          peakTx = tx;
        }
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    const budgetUsedPct = budgetAmount > 0 ? (totalExpense / budgetAmount) * 100 : 0;

    // Unique active days in period
    const activeDaysSet = new Set(
      filteredTransactions.map((tx) => {
        const d = new Date(tx.dateTime || tx.date || Date.now());
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    const activeDaysCount = Math.max(1, activeDaysSet.size);
    const avgDailyExpense = totalExpense / activeDaysCount;

    return {
      totalExpense,
      totalIncome,
      netSavings,
      savingsRate,
      budgetUsedPct,
      peakTx,
      txCount: filteredTransactions.length,
      activeDaysCount,
      avgDailyExpense,
    };
  }, [filteredTransactions, budgetAmount]);

  // Smart Insights generator
  const smartInsights = useMemo(() => {
    return generateSmartInsights({
      transactions: txList,
      monthlyBudget: budgetAmount,
      dailyLimit,
      currencySymbol,
      targetDate,
    });
  }, [txList, budgetAmount, dailyLimit, currencySymbol, targetDate]);

  // ── 1. Timeline & Date Series Data Points ───────────────────────────
  const timelineSeries = useMemo(() => {
    // Determine start & end date for the selected preset
    let daysCount = 30;
    let startDay = 1;
    const year = currentYear;
    const month = currentMonth;

    if (datePreset === "thisMonth") {
      daysCount = new Date(year, month + 1, 0).getDate();
    } else if (datePreset === "thisWeek") {
      daysCount = 7;
    } else if (datePreset === "last30Days") {
      daysCount = 30;
    }

    // Group transactions by date
    const dailyMap = {};
    for (let i = 1; i <= daysCount; i++) {
      dailyMap[i] = {
        day: i,
        expense: 0,
        income: 0,
        txList: [],
      };
    }

    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.dateTime || tx.date || Date.now());
      const dayNum = datePreset === "thisMonth" ? d.getDate() : Math.min(daysCount, d.getDate());
      if (dailyMap[dayNum]) {
        const amt = parseFloat(tx.amount || 0);
        if (tx.type === "INCOME") {
          dailyMap[dayNum].income += amt;
        } else {
          dailyMap[dayNum].expense += amt;
        }
        dailyMap[dayNum].txList.push(tx);
      }
    });

    let cumulativeSpend = 0;
    const points = Object.values(dailyMap).map((d) => {
      cumulativeSpend += d.expense;
      return {
        ...d,
        cumulativeSpend,
      };
    });

    const maxVal = Math.max(
      ...points.map((p) => Math.max(p.expense, p.income, dailyLimit * 1.5)),
      100
    );

    return { points, maxVal, daysCount };
  }, [filteredTransactions, datePreset, currentYear, currentMonth, dailyLimit]);

  // ── 2. Time-of-Day (Hourly & 4-Quadrant) Distribution ────────────────
  const timeOfDayData = useMemo(() => {
    const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      expense: 0,
      count: 0,
    }));

    const quadrants = {
      morning: { name: t("morningSpend") || "Morning (06:00 - 12:00)", icon: "🌅", total: 0, count: 0, hours: "06:00 - 12:00" },
      afternoon: { name: t("afternoonSpend") || "Afternoon (12:00 - 18:00)", icon: "☀️", total: 0, count: 0, hours: "12:00 - 18:00" },
      evening: { name: t("eveningSpend") || "Evening (18:00 - 23:00)", icon: "🌙", total: 0, count: 0, hours: "18:00 - 23:00" },
      night: { name: t("nightSpend") || "Late Night (23:00 - 06:00)", icon: "🌌", total: 0, count: 0, hours: "23:00 - 06:00" },
    };

    filteredTransactions
      .filter((tx) => tx.type === "EXPENSE")
      .forEach((tx) => {
        const d = new Date(tx.dateTime || tx.date || Date.now());
        const hour = isNaN(d.getHours()) ? 12 : d.getHours();
        const amt = parseFloat(tx.amount || 0);

        hourlyDistribution[hour].expense += amt;
        hourlyDistribution[hour].count += 1;

        if (hour >= 6 && hour < 12) {
          quadrants.morning.total += amt;
          quadrants.morning.count += 1;
        } else if (hour >= 12 && hour < 18) {
          quadrants.afternoon.total += amt;
          quadrants.afternoon.count += 1;
        } else if (hour >= 18 && hour < 23) {
          quadrants.evening.total += amt;
          quadrants.evening.count += 1;
        } else {
          quadrants.night.total += amt;
          quadrants.night.count += 1;
        }
      });

    const maxHourly = Math.max(...hourlyDistribution.map((h) => h.expense), 10);
    const totalExp = Object.values(quadrants).reduce((acc, q) => acc + q.total, 0) || 1;

    // Peak hour
    let peakHour = hourlyDistribution[0];
    hourlyDistribution.forEach((h) => {
      if (h.expense > peakHour.expense) peakHour = h;
    });

    // Peak quadrant
    let peakQuadKey = "morning";
    let maxQuadVal = -1;
    Object.entries(quadrants).forEach(([k, v]) => {
      if (v.total > maxQuadVal) {
        maxQuadVal = v.total;
        peakQuadKey = k;
      }
    });

    return {
      hourlyDistribution,
      maxHourly,
      quadrants: Object.entries(quadrants).map(([key, data]) => ({
        key,
        ...data,
        pct: Math.round((data.total / totalExp) * 100),
        isPeak: key === peakQuadKey && data.total > 0,
      })),
      peakHour,
    };
  }, [filteredTransactions, t]);

  // ── 3. Day of Week (Mon - Sun) Patterns ──────────────────────────────
  const dayOfWeekData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dowDistribution = dayNames.map((name, idx) => ({
      dayIndex: idx,
      name,
      expense: 0,
      count: 0,
      isWeekend: idx === 0 || idx === 6,
    }));

    let weekendSpend = 0;
    let weekdaySpend = 0;

    filteredTransactions
      .filter((tx) => tx.type === "EXPENSE")
      .forEach((tx) => {
        const d = new Date(tx.dateTime || tx.date || Date.now());
        const dow = isNaN(d.getDay()) ? 0 : d.getDay();
        const amt = parseFloat(tx.amount || 0);

        dowDistribution[dow].expense += amt;
        dowDistribution[dow].count += 1;

        if (dow === 0 || dow === 6) {
          weekendSpend += amt;
        } else {
          weekdaySpend += amt;
        }
      });

    // Reorder starting Monday: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const ordered = [
      dowDistribution[1],
      dowDistribution[2],
      dowDistribution[3],
      dowDistribution[4],
      dowDistribution[5],
      dowDistribution[6],
      dowDistribution[0],
    ];

    const maxDow = Math.max(...ordered.map((d) => d.expense), 10);
    const totalDow = weekdaySpend + weekendSpend || 1;

    return {
      ordered,
      maxDow,
      weekdaySpend,
      weekendSpend,
      weekendPct: Math.round((weekendSpend / totalDow) * 100),
      weekdayPct: Math.round((weekdaySpend / totalDow) * 100),
    };
  }, [filteredTransactions]);

  // ── 4. Category Breakdown & Donut Calculation ────────────────────────
  const categoryData = useMemo(() => {
    const catMap = {};
    let totalCatExpense = 0;

    filteredTransactions
      .filter((tx) => tx.type === "EXPENSE")
      .forEach((tx) => {
        const cat = tx.category || "General";
        const amt = parseFloat(tx.amount || 0);
        catMap[cat] = (catMap[cat] || 0) + amt;
        totalCatExpense += amt;
      });

    const items = Object.entries(catMap)
      .map(([name, amount]) => {
        const meta = getCategoryMeta(name);
        return {
          name,
          amount,
          color: meta.color || "#f97316",
          icon: meta.icon || "🏷️",
          pct: totalCatExpense > 0 ? Math.round((amount / totalCatExpense) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { items, totalCatExpense };
  }, [filteredTransactions]);

  // ── SVG Interactive Pointer & Touch Helpers ─────────────────────────
  const pointsCount = timelineSeries.points.length;
  // Generous width per day (at least 36px per point for crystal-clear readability on mobile)
  const svgWidth = Math.max(820, pointsCount * 36);
  const svgHeight = 260;
  const paddingX = 48;
  const paddingY = 32;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;
  const maxScale = timelineSeries.maxVal || 100;

  // Auto-select initial point (last active point or first)
  useEffect(() => {
    if (timelineSeries.points && timelineSeries.points.length > 0) {
      const activePts = timelineSeries.points.filter((p) => p.expense > 0 || p.income > 0);
      if (activePts.length > 0) {
        setSelectedPoint(activePts[activePts.length - 1]);
      } else {
        setSelectedPoint(timelineSeries.points[0]);
      }
    }
  }, [timelineSeries.points]);

  const getSvgCoordinates = (point, idx, valueKey) => {
    const x = paddingX + (idx / Math.max(1, pointsCount - 1)) * plotWidth;
    const val = point[valueKey] || 0;
    const y = paddingY + plotHeight - (val / maxScale) * plotHeight;
    return { x, y };
  };

  const handleSvgPointerMove = (e) => {
    if (!svgRef.current || pointsCount === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    if (!clientX) return;

    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pointIdx = Math.min(
      pointsCount - 1,
      Math.max(0, Math.round(relX * (pointsCount - 1)))
    );

    const point = timelineSeries.points[pointIdx];
    if (point) {
      setHoveredPoint(point);
      setSelectedPoint(point);
      setTooltipPos({ x: clientX - rect.left, y: clientY - rect.top });
    }
  };

  const handleSvgMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handlePointClick = (pt) => {
    setSelectedPoint(pt);
    setHoveredPoint(pt);
  };

  // Smooth Bezier Curve generator (Catmull-Rom spline)
  const getSmoothCurvePath = (points, valueKey) => {
    if (!points || points.length === 0) return "";
    if (points.length === 1) {
      const p = getSvgCoordinates(points[0], 0, valueKey);
      return `M ${p.x} ${p.y}`;
    }
    const coords = points.map((pt, i) => getSvgCoordinates(pt, i, valueKey));
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const expensePath = useMemo(() => {
    if (pointsCount === 0) return "";
    return getSmoothCurvePath(timelineSeries.points, "expense");
  }, [timelineSeries.points, maxScale, svgWidth]);

  const expenseAreaPath = useMemo(() => {
    if (pointsCount === 0 || !expensePath) return "";
    const first = getSvgCoordinates(timelineSeries.points[0], 0, "expense");
    const last = getSvgCoordinates(timelineSeries.points[pointsCount - 1], pointsCount - 1, "expense");
    const baseLine = paddingY + plotHeight;
    return `${expensePath} L ${last.x} ${baseLine} L ${first.x} ${baseLine} Z`;
  }, [expensePath, timelineSeries.points, svgWidth]);

  const incomePath = useMemo(() => {
    if (pointsCount === 0) return "";
    return getSmoothCurvePath(timelineSeries.points, "income");
  }, [timelineSeries.points, maxScale, svgWidth]);

  const incomeAreaPath = useMemo(() => {
    if (pointsCount === 0 || !incomePath) return "";
    const first = getSvgCoordinates(timelineSeries.points[0], 0, "income");
    const last = getSvgCoordinates(timelineSeries.points[pointsCount - 1], pointsCount - 1, "income");
    const baseLine = paddingY + plotHeight;
    return `${incomePath} L ${last.x} ${baseLine} L ${first.x} ${baseLine} Z`;
  }, [incomePath, timelineSeries.points, svgWidth]);


  const activeInspectPoint = hoveredPoint || selectedPoint || timelineSeries.points[0];

  return (
    <div className="analytics-view-container">
      {/* ── TOP HEADER & FILTER CONTROLS ───────────────────────────────── */}
      <div className="analytics-top-header">
        <div className="analytics-header-main">
          <div className="analytics-title-group">
            <h2>
              <span>📈</span>
              <span className="analytics-title-gradient">
                {t("timeAndDateAnalysis") || "Financial Analysis & Time-Series Graphs"}
              </span>
            </h2>
            <p className="analytics-subtitle">
              Interactive timeline curves, exact transaction timestamps, hourly 24-hour spending distribution, and category breakdowns.
            </p>
          </div>

          <div className="analytics-header-actions">
            <button
              type="button"
              className="export-report-btn"
              onClick={() =>
                printMonthlyFinancialReport({
                  transactions: filteredTransactions,
                  budgetAmount,
                  dailyLimit,
                  currencySymbol,
                  username,
                  targetDate,
                })
              }
              title={t("printReport") || "Print / Save PDF Report"}
            >
              🖨️ <span>{t("printReport") || "Export PDF Report"}</span>
            </button>
          </div>
        </div>

        {/* Date Range & Month Navigators */}
        <div className="analytics-filters-bar">
          <div className="range-pills-group">
            {[
              { id: "thisMonth", label: t("thisMonth") || "This Month" },
              { id: "thisWeek", label: t("thisWeek") || "This Week" },
              { id: "today", label: t("today") || "Today" },
              { id: "last30Days", label: t("last30Days") || "Last 30 Days" },
              { id: "ytd", label: "YTD" },
              { id: "custom", label: t("customRange") || "Custom" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={`range-pill-btn ${datePreset === p.id ? "active" : ""}`}
                onClick={() => setDatePreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {datePreset === "thisMonth" && (
            <div className="month-nav-controls">
              <button type="button" className="month-nav-btn" onClick={handlePrevMonth} title="Previous Month">
                ‹
              </button>
              <span className="month-label-badge">
                📅 {targetDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
              <button type="button" className="month-nav-btn" onClick={handleNextMonth} title="Next Month">
                ›
              </button>
            </div>
          )}
        </div>

        {/* Custom Date Range Picker inputs with WheelDatePicker */}
        {datePreset === "custom" && (
          <div className="custom-date-row" role="region" aria-label="Custom Date Range">
            <div className="custom-date-field">
              <WheelDatePicker
                label={t("startDate") || "Start Date"}
                value={customStartDate}
                onChange={(newDate) => setCustomStartDate(newDate)}
              />
            </div>

            <div className="custom-date-arrow" aria-hidden="true">
              <span>→</span>
            </div>

            <div className="custom-date-field">
              <WheelDatePicker
                label={t("endDate") || "End Date"}
                value={customEndDate}
                onChange={(newDate) => setCustomEndDate(newDate)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── KPI METRIC CARDS ───────────────────────────────────────────── */}
      <div className="analytics-kpi-grid">
        {/* Expenses */}
        <div className="kpi-stat-card">
          <div className="kpi-top-row">
            <span className="kpi-title">{t("spent") || "Total Expenses"}</span>
            <span className="kpi-icon-pill">💳</span>
          </div>
          <div className="kpi-value expense">
            {currencySymbol}
            <AnimatedNumber value={summaryMetrics.totalExpense} />
          </div>
          <div className="kpi-sub-row">
            <span>Avg: {currencySymbol}{summaryMetrics.avgDailyExpense.toFixed(2)}/day</span>
            <span>{summaryMetrics.budgetUsedPct.toFixed(0)}% of limit</span>
          </div>
        </div>

        {/* Income */}
        <div className="kpi-stat-card">
          <div className="kpi-top-row">
            <span className="kpi-title">{t("income") || "Total Income"}</span>
            <span className="kpi-icon-pill">💵</span>
          </div>
          <div className="kpi-value income">
            {currencySymbol}
            <AnimatedNumber value={summaryMetrics.totalIncome} />
          </div>
          <div className="kpi-sub-row">
            <span>Net: {currencySymbol}{summaryMetrics.netSavings.toFixed(2)}</span>
            <span>{summaryMetrics.savingsRate}% saved</span>
          </div>
        </div>

        {/* Peak Spending Window */}
        <div className="kpi-stat-card">
          <div className="kpi-top-row">
            <span className="kpi-title">{t("peakSpendingTime") || "Peak Time"}</span>
            <span className="kpi-icon-pill">⏰</span>
          </div>
          <div className="kpi-value pace">
            {timeOfDayData.peakHour.label}
          </div>
          <div className="kpi-sub-row">
            <span>{currencySymbol}{timeOfDayData.peakHour.expense.toFixed(2)} spent</span>
            <span>{timeOfDayData.peakHour.count} transactions</span>
          </div>
        </div>

        {/* Total Transactions & Active Days */}
        <div className="kpi-stat-card">
          <div className="kpi-top-row">
            <span className="kpi-title">{t("totalTransactions") || "Activity"}</span>
            <span className="kpi-icon-pill">📊</span>
          </div>
          <div className="kpi-value">
            {summaryMetrics.txCount}
          </div>
          <div className="kpi-sub-row">
            <span>Across {summaryMetrics.activeDaysCount} active day(s)</span>
            <span>{currencySymbol}{(summaryMetrics.totalExpense / Math.max(1, summaryMetrics.txCount)).toFixed(2)} avg/tx</span>
          </div>
        </div>
      </div>

      {/* ── GRAPH VIEW SWITCHER TABS ───────────────────────────────────── */}
      <div className="graph-tabs-container">
        {[
          { id: "timeline", icon: "📈", label: t("timelineGraph") || "Date & Time Curve" },
          { id: "timeOfDay", icon: "⏰", label: t("timeOfDayAnalysis") || "Time-of-Day (24h)" },
          { id: "dayOfWeek", icon: "📅", label: t("dayOfWeekAnalysis") || "Day-of-Week" },
          { id: "category", icon: "🍩", label: t("categoryBreakdown") || "Category Donut" },
          { id: "dailyBars", icon: "📊", label: t("dailyBarChartTitle") || "Daily vs Limit" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`graph-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── 1. TIMELINE & DATE-TIME CURVE GRAPH ───────────────────────── */}
      {activeTab === "timeline" && (
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <div className="chart-title-area">
              <h3>
                <span>📈</span>
                <span>{t("timelineGraph") || "Date & Time Spending Curve"}</span>
              </h3>
            </div>
            <div className="chart-legend-row">
              <div className="legend-item">
                <span className="legend-dot expense" />
                <span>{t("expense") || "Expenses"}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot income" />
                <span>{t("incomeType") || "Income"}</span>
              </div>
            </div>
          </div>

          {/* Mobile Swipe Guidance Banner */}
          <div className="timeline-mobile-swipe-hint">
            <span className="swipe-hint-icon">👉</span>
            <span>Swipe horizontally to explore all {pointsCount} days · Tap points to inspect</span>
          </div>

          {/* Horizontally Scrollable SVG Canvas Container */}
          <div className="timeline-scroll-track" ref={scrollTrackRef}>
            <div
              className="svg-chart-wrapper"
              onPointerMove={handleSvgPointerMove}
              onPointerLeave={handleSvgMouseLeave}
              onTouchMove={handleSvgPointerMove}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="timeline-svg"
                style={{ width: svgWidth, minWidth: svgWidth }}
              >
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#f87171" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = paddingY + plotHeight * (1 - pct);
                  const val = (maxScale * pct).toFixed(0);
                  return (
                    <g key={i}>
                      <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} className="grid-line" />
                      <text x={paddingX - 8} y={y + 4} className="axis-text-y">
                        {currencySymbol}{val}
                      </text>
                    </g>
                  );
                })}

                {/* Income Area & Smooth Curve */}
                {incomeAreaPath && <path d={incomeAreaPath} className="curve-area-income" />}
                {incomePath && <path d={incomePath} className="curve-line-income" />}

                {/* Expense Area & Smooth Curve */}
                {expenseAreaPath && <path d={expenseAreaPath} className="curve-area-expense" />}
                {expensePath && <path d={expensePath} className="curve-line-expense" />}

                {/* Crosshair / Active Day Line */}
                {activeInspectPoint && (
                  <line
                    x1={getSvgCoordinates(activeInspectPoint, activeInspectPoint.day - 1, "expense").x}
                    y1={paddingY}
                    x2={getSvgCoordinates(activeInspectPoint, activeInspectPoint.day - 1, "expense").x}
                    y2={paddingY + plotHeight}
                    className="crosshair-line"
                  />
                )}

                {/* Data Points with Touch/Click Groups */}
                {timelineSeries.points.map((pt, idx) => {
                  const { x, y } = getSvgCoordinates(pt, idx, "expense");
                  const isSelected = activeInspectPoint && activeInspectPoint.day === pt.day;
                  const hasExpense = pt.expense > 0;
                  const hasIncome = pt.income > 0;

                  return (
                    <g
                      key={idx}
                      className="chart-point-group"
                      onClick={() => handlePointClick(pt)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Invisible larger touch target for easy mobile tapping */}
                      <circle cx={x} cy={y} r={18} fill="transparent" />

                      {/* Halo ring when selected */}
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r={10}
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="2.5"
                          className="pulse-halo-ring"
                        />
                      )}

                      {/* Visible point dot */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 6 : hasExpense ? 4 : 2.5}
                        fill={hasExpense ? "#f87171" : hasIncome ? "#4ade80" : "rgba(255,255,255,0.3)"}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className={`chart-point-dot ${isSelected ? "active" : ""}`}
                      />
                    </g>
                  );
                })}

                {/* X-Axis Day Labels */}
                {timelineSeries.points.map((pt, i) => {
                  const { x } = getSvgCoordinates(pt, pt.day - 1, "expense");
                  const isSelected = activeInspectPoint && activeInspectPoint.day === pt.day;
                  const shouldShow =
                    pointsCount <= 16 ||
                    i === 0 ||
                    i === pointsCount - 1 ||
                    pt.day % 2 !== 0 ||
                    isSelected;

                  if (!shouldShow) return null;

                  return (
                    <text
                      key={i}
                      x={x}
                      y={svgHeight - 10}
                      className={`axis-text ${isSelected ? "selected-axis-text" : ""}`}
                    >
                      Day {pt.day}
                    </text>
                  );
                })}
              </svg>

              {/* Hover Floating Tooltip */}
              {hoveredPoint && (
                <div
                  className="chart-interactive-tooltip"
                  style={{
                    left: Math.min(Math.max(20, tooltipPos.x - 70), svgWidth - 180),
                    top: Math.max(10, tooltipPos.y - 85),
                  }}
                >
                  <div className="tooltip-date-header">
                    <span>📅 Day {hoveredPoint.day}</span>
                    <span className="tooltip-time-badge">{hoveredPoint.txList.length} tx</span>
                  </div>
                  <div className="tooltip-body-row expense">
                    <span>{t("spent") || "Expense"}:</span>
                    <span>{currencySymbol}{hoveredPoint.expense.toFixed(2)}</span>
                  </div>
                  {hoveredPoint.income > 0 && (
                    <div className="tooltip-body-row income">
                      <span>{t("income") || "Income"}:</span>
                      <span>+{currencySymbol}{hoveredPoint.income.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── ACTIVE DAY SPENDING INSPECTOR CARD ──────────────────── */}
          {activeInspectPoint && (
            <div className="timeline-day-inspector-card">
              <div className="inspector-top-header">
                <div className="inspector-date-badge">
                  <span className="inspector-cal-icon">📅</span>
                  <div>
                    <span className="inspector-day-title">Day {activeInspectPoint.day} Spending Details</span>
                    <span className="inspector-date-sub">
                      {targetDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="inspector-metrics-pill-row">
                  <div className="inspector-pill expense">
                    <span className="pill-label">{t("spent") || "Expenses"}:</span>
                    <span className="pill-val">{currencySymbol}{activeInspectPoint.expense.toFixed(2)}</span>
                  </div>

                  {activeInspectPoint.income > 0 && (
                    <div className="inspector-pill income">
                      <span className="pill-label">{t("income") || "Income"}:</span>
                      <span className="pill-val">+{currencySymbol}{activeInspectPoint.income.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="inspector-pill cumulative">
                    <span className="pill-label">{t("cumulativeCurve") || "Cumulative"}:</span>
                    <span className="pill-val">{currencySymbol}{activeInspectPoint.cumulativeSpend.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Transactions on this day */}
              {activeInspectPoint.txList && activeInspectPoint.txList.length > 0 ? (
                <div className="inspector-tx-list">
                  <span className="inspector-tx-header-title">
                    🧾 {activeInspectPoint.txList.length} Transaction(s) Logged:
                  </span>
                  <div className="inspector-tx-chips-wrap">
                    {activeInspectPoint.txList.map((tx) => {
                      const meta = getCategoryMeta(tx.category || "General");
                      return (
                        <div key={tx.id} className="inspector-tx-chip">
                          <span className="tx-chip-icon">{meta.icon || "🏷️"}</span>
                          <span className="tx-chip-name">{tx.name}</span>
                          <span className="tx-chip-time">
                            {tx.dateTime ? tx.dateTime.slice(11, 16) : ""}
                          </span>
                          <span className={`tx-chip-amount ${tx.type === "INCOME" ? "income" : "expense"}`}>
                            {tx.type === "INCOME" ? "+" : "-"}{currencySymbol}{parseFloat(tx.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="inspector-no-tx-note">
                  ✨ No spending recorded on Day {activeInspectPoint.day} (Zero expense day!)
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 2. TIME-OF-DAY 24-HOUR DISTRIBUTION ───────────────────────── */}
      {activeTab === "timeOfDay" && (
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <div className="chart-title-area">
              <h3>
                <span>⏰</span>
                <span>{t("timeOfDayAnalysis") || "Time-of-Day Spending Distribution"}</span>
              </h3>
            </div>
            <span className="email-hint-chip">
              🔥 {t("peakHour") || "Peak Hour"}: <strong>{timeOfDayData.peakHour.label}</strong>
            </span>
          </div>

          {/* 4 Quadrants */}
          <div className="time-of-day-grid">
            {timeOfDayData.quadrants.map((q) => (
              <div key={q.key} className={`time-zone-card ${q.isPeak ? "peak" : ""}`}>
                {q.isPeak && <span className="peak-tag">🔥 Peak Time</span>}
                <div className="time-zone-header">
                  <span className="time-zone-icon">{q.icon}</span>
                  <div>
                    <div className="time-zone-name">{q.name}</div>
                    <div className="time-zone-hours">{q.hours}</div>
                  </div>
                </div>
                <div className="time-zone-amount">
                  {currencySymbol}{q.total.toFixed(2)}
                </div>
                <div className="time-zone-bar-track">
                  <div className="time-zone-bar-fill" style={{ width: `${q.pct}%` }} />
                </div>
                <div className="kpi-sub-row">
                  <span>{q.pct}% of total</span>
                  <span>{q.count} transactions</span>
                </div>
              </div>
            ))}
          </div>

          {/* 24-Hour Hourly Histogram */}
          <div className="hourly-histogram-card">
            <h4 style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              📊 {t("hourlyDistribution") || "24-Hour Spending Distribution (00:00 - 23:00)"}
            </h4>
            <div className="hourly-bars-flex">
              {timeOfDayData.hourlyDistribution.map((h) => {
                const heightPct = (h.expense / (timeOfDayData.maxHourly || 1)) * 100;
                const isPeak = h.hour === timeOfDayData.peakHour.hour && h.expense > 0;
                return (
                  <div
                    key={h.hour}
                    className={`hourly-col ${isPeak ? "peak" : ""}`}
                    title={`${h.label}: ${currencySymbol}${h.expense.toFixed(2)} (${h.count} tx)`}
                  >
                    <div className="hourly-bar-pillar" style={{ height: `${Math.max(4, heightPct)}%` }} />
                    <span className="hourly-label">{h.hour % 3 === 0 ? h.hour : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. DAY OF WEEK COMPARISON ─────────────────────────────────── */}
      {activeTab === "dayOfWeek" && (
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <div className="chart-title-area">
              <h3>
                <span>📅</span>
                <span>{t("dayOfWeekAnalysis") || "Day-of-Week Spending Patterns"}</span>
              </h3>
            </div>
            <div className="chart-legend-row">
              <span className="email-hint-chip">
                🏢 {t("weekday") || "Weekday"}: {dayOfWeekData.weekdayPct}%
              </span>
              <span className="email-hint-chip" style={{ color: "#fb923c" }}>
                🎉 {t("weekend") || "Weekend"}: {dayOfWeekData.weekendPct}%
              </span>
            </div>
          </div>

          <div className="dow-bars-grid">
            {dayOfWeekData.ordered.map((d) => {
              const heightPct = (d.expense / (dayOfWeekData.maxDow || 1)) * 100;
              return (
                <div key={d.dayIndex} className="dow-col">
                  <span className="dow-amount-tag">
                    {d.expense > 0 ? `${currencySymbol}${d.expense.toFixed(0)}` : "€0"}
                  </span>
                  <div
                    className={`dow-pillar ${d.isWeekend ? "weekend" : ""}`}
                    style={{ height: `${Math.max(6, heightPct)}%` }}
                  />
                  <span className="dow-day-name">{d.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. CATEGORY DONUT & BREAKDOWN ──────────────────────────────── */}
      {activeTab === "category" && (
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <div className="chart-title-area">
              <h3>
                <span>🍩</span>
                <span>{t("categoryBreakdown") || "Category Breakdown & Distribution"}</span>
              </h3>
            </div>
            {selectedCategory !== "ALL" && (
              <button
                type="button"
                className="resend-btn"
                onClick={() => setSelectedCategory("ALL")}
              >
                ✕ {t("allCategories") || "Show All"}
              </button>
            )}
          </div>

          <div className="category-analytics-grid">
            {/* Animated SVG Donut */}
            <div className="donut-center-container">
              <svg viewBox="0 0 100 100" className="donut-svg">
                {(() => {
                  let accumulatedPct = 0;
                  return categoryData.items.map((cat, i) => {
                    const strokeDasharray = `${cat.pct} ${100 - cat.pct}`;
                    const strokeDashoffset = -accumulatedPct;
                    accumulatedPct += cat.pct;
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="14"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength="100"
                        style={{ transition: "stroke-dasharray 0.4s ease" }}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="donut-center-badge">
                <span className="donut-center-label">{t("spent") || "Total"}</span>
                <span className="donut-center-val">
                  {currencySymbol}{categoryData.totalCatExpense.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Category List */}
            <div className="category-items-list">
              {categoryData.items.map((cat) => (
                <div
                  key={cat.name}
                  className={`cat-row-pill ${selectedCategory === cat.name ? "active" : ""}`}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.name ? "ALL" : cat.name)
                  }
                  title="Click to filter graphs by this category"
                >
                  <div className="cat-row-left">
                    <span className="cat-dot-icon">{cat.icon}</span>
                    <span className="cat-row-name">{cat.name}</span>
                    <span className="cat-row-pct">({cat.pct}%)</span>
                  </div>
                  <div className="cat-row-amount">
                    {currencySymbol}{cat.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. DAILY BARS VS DAILY BUDGET LIMIT ─────────────────────────── */}
      {activeTab === "dailyBars" && (
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <div className="chart-title-area">
              <h3>
                <span>📊</span>
                <span>{t("dailyBarChartTitle") || "Daily Spending vs Limit Guide"}</span>
              </h3>
            </div>
            <div className="chart-legend-row">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: "#4ade80" }} />
                <span>Under Limit</span>
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: "#f87171" }} />
                <span>Over Limit</span>
              </span>
            </div>
          </div>

          <div className="daily-bars-container">
            {/* Daily limit reference line */}
            {dailyLimit > 0 && (
              <div
                className="daily-limit-line"
                style={{
                  bottom: `${Math.min(90, (dailyLimit / (timelineSeries.maxVal || 100)) * 100)}%`,
                }}
              >
                <span className="daily-limit-tag">
                  Limit: {currencySymbol}{dailyLimit.toFixed(0)}/day
                </span>
              </div>
            )}

            {timelineSeries.points.map((pt) => {
              const heightPct = Math.min(100, (pt.expense / (timelineSeries.maxVal || 100)) * 100);
              const isOver = pt.expense > dailyLimit && dailyLimit > 0;
              const isNear = !isOver && pt.expense >= dailyLimit * 0.75;
              const statusClass = isOver ? "over" : isNear ? "near" : "under";

              return (
                <div
                  key={pt.day}
                  className="day-bar-col"
                  title={`Day ${pt.day}: ${currencySymbol}${pt.expense.toFixed(2)} (${pt.txList.length} tx)`}
                >
                  <div
                    className={`day-bar-pillar ${statusClass}`}
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  />
                  <span className="day-bar-date">{pt.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. TRANSACTION TIME & DATE AUDIT LOG ──────────────────────── */}
      <div className="time-log-card">
        <div className="chart-card-header">
          <div className="chart-title-area">
            <h3>
              <span>📋</span>
              <span>{t("transactionAuditLog") || "Date & Time Transaction Log"}</span>
            </h3>
          </div>
          <span className="email-hint-chip">
            {filteredTransactions.length} {t("transactions") || "transactions"}
          </span>
        </div>

        <div className="time-log-table-wrapper">
          <table className="time-log-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Transaction</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.5)" }}>
                    {t("noTransactions") || "No transactions recorded for this period."}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const d = new Date(tx.dateTime || tx.date || Date.now());
                  const formattedDate = isNaN(d.getTime())
                    ? "Recent"
                    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                  const formattedTime = isNaN(d.getTime())
                    ? "12:00"
                    : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                  const meta = getCategoryMeta(tx.category || "General");

                  return (
                    <tr key={tx.id || Math.random()}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span className="date-chip-badge">📅 {formattedDate}</span>
                          <span className="time-chip-badge">⏰ {formattedTime}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{tx.name || "Untitled"}</strong>
                        {tx.description && (
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                            {tx.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span>{meta.icon} {tx.category || "General"}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "800",
                            color: tx.type === "INCOME" ? "#4ade80" : "#f87171",
                          }}
                        >
                          {tx.type === "INCOME" ? `+ ${t("incomeType") || "INCOME"}` : `- ${t("expense") || "EXPENSE"}`}
                        </span>
                      </td>
                      <td className={`tx-amount-cell ${tx.type === "INCOME" ? "income" : "expense"}`}>
                        {tx.type === "INCOME" ? "+" : "-"}{currencySymbol}
                        {parseFloat(tx.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

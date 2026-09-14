import { getCategoryMeta } from "./autoCategorizer";

/**
 * Monthly Analytics & Multi-Month Comparison Engine
 * Computes month-by-month financial metrics, peak/frugal month comparisons,
 * health grading, and smart budget maintenance recommendations.
 */

export const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Calculates performance tier, star rating (1-5 stars), and grade based on budget utilization
 * Tiers:
 *  - Excellent (5 Stars ⭐⭐⭐⭐⭐): <= 80% spent
 *  - Good (4 Stars ⭐⭐⭐⭐): 81% - 95% spent
 *  - Average (3 Stars ⭐⭐⭐): 96% - 100% spent
 *  - Poor (1-2 Stars ⭐⭐ / ⭐): > 100% spent (over-budget)
 */
export function getBudgetGrade(pct, { totalExpense = 0, limit = 0, netSavings = 0 } = {}) {
  if (totalExpense <= 0 && pct <= 0) {
    return {
      tier: "No Spend",
      tierKey: "tierNoSpend",
      tierIcon: "⚪",
      stars: 0,
      starIcons: "—",
      ratingScore: 0.0,
      grade: "—",
      label: "No Spend",
      color: "#94a3b8",
      feedback: "No expenses recorded for this month.",
    };
  }

  // 1. Excellent: <= 80% spent
  if (pct <= 80) {
    return {
      tier: "Excellent",
      tierKey: "tierExcellent",
      tierIcon: "🌟",
      stars: 5,
      starIcons: "⭐⭐⭐⭐⭐",
      ratingScore: 5.0,
      grade: pct <= 60 ? "A+" : "A",
      label: "Excellent",
      color: "#10b981",
      feedback:
        netSavings > 0
          ? `Outstanding discipline! You kept spending at ${pct.toFixed(0)}% of your limit and saved €${netSavings.toFixed(2)}.`
          : `Outstanding discipline! You stayed well within budget (${pct.toFixed(0)}% used) earning a full 5-star rating.`,
    };
  }

  // 2. Good: 81% - 95% spent
  if (pct <= 95) {
    return {
      tier: "Good",
      tierKey: "tierGood",
      tierIcon: "👍",
      stars: 4,
      starIcons: "⭐⭐⭐⭐",
      ratingScore: 4.0,
      grade: "A-",
      label: "Good",
      color: "#3b82f6",
      feedback: `Great budget management! You stayed safely under your spending limit (${pct.toFixed(0)}% used) earning 4 stars.`,
    };
  }

  // 3. Average: 96% - 100% spent
  if (pct <= 100) {
    return {
      tier: "Average",
      tierKey: "tierAverage",
      tierIcon: "⚖️",
      stars: 3,
      starIcons: "⭐⭐⭐",
      ratingScore: 3.0,
      grade: "B",
      label: "Average",
      color: "#f59e0b",
      feedback: `Fair spending balance (${pct.toFixed(0)}% used). You remained within budget but were close to reaching your ceiling.`,
    };
  }

  // 4. Poor: > 100% spent (Over budget)
  if (pct <= 125) {
    const overAmount = limit > 0 && totalExpense > limit ? totalExpense - limit : 0;
    return {
      tier: "Poor",
      tierKey: "tierPoor",
      tierIcon: "⚠️",
      stars: 2,
      starIcons: "⭐⭐",
      ratingScore: 2.0,
      grade: "D",
      label: "Poor",
      color: "#f97316",
      feedback: `Budget exceeded by ${overAmount > 0 ? `€${overAmount.toFixed(2)}` : `${(pct - 100).toFixed(0)}%`}. Review non-essential spending to recover balance.`,
    };
  }

  // High overrun (> 125%)
  const overAmount = limit > 0 && totalExpense > limit ? totalExpense - limit : 0;
  return {
    tier: "Poor",
    tierKey: "tierPoor",
    tierIcon: "⚠️",
    stars: 1,
    starIcons: "⭐",
    ratingScore: 1.0,
    grade: "F",
    label: "Poor",
    color: "#ef4444",
    feedback: `High budget overrun (${pct.toFixed(0)}% of limit spent${overAmount > 0 ? `, €${overAmount.toFixed(2)} over` : ""}). Substantial trimming recommended.`,
  };
}

/**
 * Computes multi-month statistics for a target year
 */
export function getYearlyMonthlyAnalytics({
  transactions = [],
  monthlyBudget = 1000,
  targetYear = new Date().getFullYear(),
}) {
  const txList = Array.isArray(transactions) ? transactions : [];
  const limit = Math.max(0, parseFloat(monthlyBudget) || 0);

  // Collect all available years in data
  const yearsSet = new Set([new Date().getFullYear(), targetYear]);
  txList.forEach((tx) => {
    if (!tx) return;
    const d = new Date(tx.dateTime || tx.date || Date.now());
    if (!isNaN(d.getTime())) yearsSet.add(d.getFullYear());
  });
  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

  // Month-by-month array for the target year
  const monthlyData = [];

  for (let m = 0; m < 12; m++) {
    // Filter transactions for this month and year
    const monthTx = txList.filter((tx) => {
      if (!tx) return false;
      const d = new Date(tx.dateTime || tx.date || Date.now());
      return d.getFullYear() === targetYear && d.getMonth() === m;
    });

    const expenseTx = monthTx.filter((t) => t && t.type === "EXPENSE");
    const incomeTx = monthTx.filter((t) => t && t.type === "INCOME");

    const totalExpense = expenseTx.reduce(
      (sum, t) => sum + (parseFloat(t.amount) || 0),
      0
    );
    const totalIncome = incomeTx.reduce(
      (sum, t) => sum + (parseFloat(t.amount) || 0),
      0
    );
    const netSavings = totalIncome - totalExpense;

    // Category breakdown for this month
    const categoryMap = {};
    expenseTx.forEach((t) => {
      const cat = t.category || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + (parseFloat(t.amount) || 0);
    });

    const categories = Object.entries(categoryMap)
      .map(([name, amount]) => {
        const meta = getCategoryMeta(name);
        return {
          name,
          amount,
          color: meta.color,
          icon: meta.icon,
          pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const topCategory = categories[0] || null;

    // Budget utilization & Performance Rating
    const pctUsed = limit > 0 ? (totalExpense / limit) * 100 : 0;
    const gradeInfo = getBudgetGrade(pctUsed, { totalExpense, limit, netSavings });

    monthlyData.push({
      monthIndex: m,
      monthShort: MONTH_NAMES_SHORT[m],
      monthFull: MONTH_NAMES_FULL[m],
      year: targetYear,
      totalExpense,
      totalIncome,
      netSavings,
      txCount: monthTx.length,
      expenseCount: expenseTx.length,
      incomeCount: incomeTx.length,
      categories,
      topCategory,
      pctUsed: parseFloat(pctUsed.toFixed(1)),
      isOverBudget: limit > 0 && totalExpense > limit,
      tier: gradeInfo.tier,
      tierKey: gradeInfo.tierKey,
      tierIcon: gradeInfo.tierIcon,
      stars: gradeInfo.stars,
      starIcons: gradeInfo.starIcons,
      ratingScore: gradeInfo.ratingScore,
      feedback: gradeInfo.feedback,
      grade: gradeInfo.grade,
      gradeLabel: gradeInfo.label,
      gradeColor: gradeInfo.color,
      momChangePct: 0,
      momChangeDiff: 0,
    });
  }

  // Calculate Month-over-Month (MoM) differences
  // For January, compare to December of previous year if data exists
  for (let m = 0; m < 12; m++) {
    let prevMonthExpense = 0;
    if (m > 0) {
      prevMonthExpense = monthlyData[m - 1].totalExpense;
    } else {
      // Check Dec of prior year
      const priorDecTx = txList.filter((tx) => {
        if (!tx || tx.type !== "EXPENSE") return false;
        const d = new Date(tx.dateTime || tx.date || Date.now());
        return d.getFullYear() === targetYear - 1 && d.getMonth() === 11;
      });
      prevMonthExpense = priorDecTx.reduce(
        (sum, t) => sum + (parseFloat(t.amount) || 0),
        0
      );
    }

    const currentExpense = monthlyData[m].totalExpense;
    const diff = currentExpense - prevMonthExpense;
    let pct = 0;
    if (prevMonthExpense > 0) {
      pct = ((currentExpense - prevMonthExpense) / prevMonthExpense) * 100;
    } else if (currentExpense > 0) {
      pct = 100;
    }

    monthlyData[m].momChangeDiff = parseFloat(diff.toFixed(2));
    monthlyData[m].momChangePct = parseFloat(pct.toFixed(1));
    monthlyData[m].prevMonthExpense = parseFloat(prevMonthExpense.toFixed(2));
  }

  // Active months with spending
  const activeMonths = monthlyData.filter((m) => m.totalExpense > 0);
  const now = new Date();
  const isTargetCurrentYear = targetYear === now.getFullYear();
  const currentMonthIdx = now.getMonth();

  // Aggregate stats
  const totalYearlySpend = monthlyData.reduce((sum, m) => sum + m.totalExpense, 0);
  const totalYearlyIncome = monthlyData.reduce((sum, m) => sum + m.totalIncome, 0);
  const totalYearlyNet = totalYearlyIncome - totalYearlySpend;

  const avgMonthlySpend =
    activeMonths.length > 0
      ? totalYearlySpend / activeMonths.length
      : isTargetCurrentYear
      ? totalYearlySpend / Math.max(1, currentMonthIdx + 1)
      : totalYearlySpend / 12;

  // Peak and Frugal Months
  let highestMonth = null;
  let lowestMonth = null;

  if (activeMonths.length > 0) {
    highestMonth = [...activeMonths].sort((a, b) => b.totalExpense - a.totalExpense)[0];
    lowestMonth = [...activeMonths].sort((a, b) => a.totalExpense - b.totalExpense)[0];
  } else {
    highestMonth = monthlyData[currentMonthIdx];
    lowestMonth = monthlyData[currentMonthIdx];
  }

  // Current month vs Previous Month
  const currentMonthData = monthlyData[currentMonthIdx] || monthlyData[0];
  const prevMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
  const prevMonthData =
    currentMonthIdx === 0
      ? {
          monthShort: "Dec",
          monthFull: "December",
          year: targetYear - 1,
          totalExpense: currentMonthData.prevMonthExpense || 0,
        }
      : monthlyData[prevMonthIdx];

  // Budget Consistency Score (0 - 100)
  let underBudgetCount = 0;
  activeMonths.forEach((m) => {
    if (limit > 0 && m.totalExpense <= limit) underBudgetCount++;
  });
  const budgetHealthScore =
    activeMonths.length > 0
      ? Math.round((underBudgetCount / activeMonths.length) * 100)
      : limit > 0
      ? 100
      : 50;

  return {
    targetYear,
    availableYears,
    monthlyData,
    activeMonthsCount: activeMonths.length,
    totalYearlySpend: parseFloat(totalYearlySpend.toFixed(2)),
    totalYearlyIncome: parseFloat(totalYearlyIncome.toFixed(2)),
    totalYearlyNet: parseFloat(totalYearlyNet.toFixed(2)),
    avgMonthlySpend: parseFloat(avgMonthlySpend.toFixed(2)),
    highestMonth,
    lowestMonth,
    currentMonthData,
    prevMonthData,
    budgetHealthScore,
  };
}

/**
 * Generates personalized, actionable Budget Maintenance & Health recommendations
 */
export function getBudgetMaintenanceAdvisor({
  analytics,
  monthlyBudget = 1000,
}) {
  const {
    monthlyData = [],
    avgMonthlySpend = 0,
    highestMonth,
    lowestMonth,
    budgetHealthScore = 100,
  } = analytics || {};

  const currentLimit = parseFloat(monthlyBudget) || 0;

  // Calculate smart recommended monthly budget:
  // Base on average monthly spend + 12% safety margin, rounded to nearest 50
  let recommendedBudget = currentLimit;
  if (avgMonthlySpend > 0) {
    const rawTarget = avgMonthlySpend * 1.12;
    recommendedBudget = Math.max(100, Math.ceil(rawTarget / 50) * 50);
  } else if (currentLimit <= 0) {
    recommendedBudget = 800;
  }

  const recommendedDaily = Math.max(5, Math.round(recommendedBudget / 30));

  // Category creeping detection: compare last 2 active months
  const activeMonths = monthlyData.filter((m) => m.totalExpense > 0);
  const creepingAlerts = [];

  if (activeMonths.length >= 2) {
    const latest = activeMonths[activeMonths.length - 1];
    const prior = activeMonths[activeMonths.length - 2];

    latest.categories.forEach((cat) => {
      const priorCat = prior.categories.find((c) => c.name === cat.name);
      if (priorCat && priorCat.amount > 30) {
        const increase = ((cat.amount - priorCat.amount) / priorCat.amount) * 100;
        if (increase >= 25) {
          creepingAlerts.push({
            category: cat.name,
            icon: cat.icon,
            increasePct: Math.round(increase),
            diff: parseFloat((cat.amount - priorCat.amount).toFixed(2)),
            latestAmount: cat.amount,
            priorAmount: priorCat.amount,
          });
        }
      }
    });
  }

  // Maintenance action tips
  const tips = [];

  if (budgetHealthScore >= 80) {
    tips.push({
      type: "success",
      icon: "🌟",
      title: "Strong Budget Discipline!",
      desc: `You have remained under budget for ${budgetHealthScore}% of tracked months. Maintaining this pace will accelerate your long-term savings.`,
      action: "Consider routing 15% of your surplus into a dedicated Savings Goal.",
    });
  } else if (budgetHealthScore < 60 && currentLimit > 0) {
    tips.push({
      type: "warning",
      icon: "⚠️",
      title: "Budget Optimization Needed",
      desc: `You exceeded your budget limit in several months. Your historical average monthly spend is €${avgMonthlySpend.toFixed(2)}, which exceeds your €${currentLimit.toFixed(2)} target.`,
      action: `Adjust your monthly budget to €${recommendedBudget} and cap daily spend at €${recommendedDaily} to maintain a realistic limit.`,
    });
  }

  if (highestMonth && lowestMonth && highestMonth.totalExpense > lowestMonth.totalExpense * 1.5) {
    const diff = highestMonth.totalExpense - lowestMonth.totalExpense;
    tips.push({
      type: "info",
      icon: "⚖️",
      title: "Spending Volatility Detected",
      desc: `Your spending peaked in ${highestMonth.monthFull} (€${highestMonth.totalExpense.toFixed(2)}) versus your most frugal month in ${lowestMonth.monthFull} (€${lowestMonth.totalExpense.toFixed(2)}).`,
      action: `Trimming top expenses during peak months could save you up to €${diff.toFixed(2)} annually!`,
    });
  }

  creepingAlerts.slice(0, 2).forEach((alert) => {
    tips.push({
      type: "alert",
      icon: alert.icon || "📈",
      title: `${alert.category} Spending Surge (+${alert.increasePct}%)`,
      desc: `You spent €${alert.latestAmount.toFixed(2)} on ${alert.category} this month compared to €${alert.priorAmount.toFixed(2)} last month (+€${alert.diff.toFixed(2)}).`,
      action: `Cap ${alert.category} to €${(alert.priorAmount * 1.1).toFixed(0)} next month to regain balance.`,
    });
  });

  return {
    recommendedBudget,
    recommendedDaily,
    isAdjustmentRecommended: Math.abs(recommendedBudget - currentLimit) >= 50,
    creepingAlerts,
    tips,
  };
}

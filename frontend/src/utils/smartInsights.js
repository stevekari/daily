/**
 * Smart Insights Engine for Steve Budget Pro
 * 
 * Computes deterministic, instant financial analytics and rule-based insights:
 * - Savings rate & progress (% of income saved)
 * - Category budget warnings & creeping spend detection
 * - Month-over-Month spending trajectory & variance
 * - Month-end budget burn rate predictions
 * - Safe daily spending allowance
 */

import { getCategoryMeta } from "./autoCategorizer";

export function generateSmartInsights({
  transactions = [],
  monthlyBudget = 1000,
  dailyLimit = 35,
  currencySymbol = "€",
  targetDate = new Date(),
}) {
  const txList = Array.isArray(transactions) ? transactions : [];
  const limit = Math.max(0, parseFloat(monthlyBudget) || 0);

  const now = targetDate instanceof Date && !isNaN(targetDate) ? targetDate : new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);
  const daysElapsed = Math.max(1, currentDay);

  // 1. Current Month Transactions
  const currentMonthTx = txList.filter((tx) => {
    if (!tx) return false;
    const d = new Date(tx.dateTime || tx.date || Date.now());
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const currentExpenses = currentMonthTx
    .filter((t) => t && t.type === "EXPENSE")
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const currentIncome = currentMonthTx
    .filter((t) => t && t.type === "INCOME")
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const netSavings = currentIncome - currentExpenses;
  const savingsRate = currentIncome > 0 ? Math.max(0, Math.round((netSavings / currentIncome) * 100)) : 0;
  const remainingBudget = limit > 0 ? Math.max(0, limit - currentExpenses) : Math.max(0, currentIncome - currentExpenses);
  const budgetUsedPct = limit > 0 ? (currentExpenses / limit) * 100 : currentIncome > 0 ? (currentExpenses / currentIncome) * 100 : 0;

  // 2. Previous Month Transactions (for MoM Comparison)
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const prevMonthTx = txList.filter((tx) => {
    if (!tx) return false;
    const d = new Date(tx.dateTime || tx.date || Date.now());
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const prevExpenses = prevMonthTx
    .filter((t) => t && t.type === "EXPENSE")
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const prevIncome = prevMonthTx
    .filter((t) => t && t.type === "INCOME")
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const momDiff = currentExpenses - prevExpenses;
  let momPctChange = 0;
  if (prevExpenses > 0) {
    momPctChange = ((currentExpenses - prevExpenses) / prevExpenses) * 100;
  } else if (currentExpenses > 0) {
    momPctChange = 100;
  }

  // 3. Category Breakdown & Critical Thresholds
  const categoryMap = {};
  currentMonthTx
    .filter((t) => t && t.type === "EXPENSE")
    .forEach((t) => {
      const cat = t.category || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + (parseFloat(t.amount) || 0);
    });

  const categories = Object.entries(categoryMap)
    .map(([name, amount]) => {
      const meta = getCategoryMeta(name);
      return {
        name,
        amount: parseFloat(amount.toFixed(2)),
        color: meta.color,
        icon: meta.icon,
        pct: currentExpenses > 0 ? Math.round((amount / currentExpenses) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categories[0] || null;

  // 4. Burn Rate & Month-End Forecast
  const avgDailyBurn = parseFloat((currentExpenses / daysElapsed).toFixed(2));
  const projectedMonthEndSpend = parseFloat((currentExpenses + avgDailyBurn * (daysRemaining - 1)).toFixed(2));
  const dynamicDailyAllowance = parseFloat((Math.max(0, remainingBudget) / daysRemaining).toFixed(2));
  const isProjectedOverBudget = limit > 0 && projectedMonthEndSpend > limit;
  const projectedDiff = limit > 0 ? Math.abs(limit - projectedMonthEndSpend) : 0;

  // 5. Generate Smart, Human-Readable Insights
  const insights = [];

  // Insight A: Good Progress / Savings
  if (currentIncome > 0 && netSavings > 0) {
    insights.push({
      id: "savings_progress",
      type: "success",
      icon: "💡",
      badge: "Good progress",
      title: `Saved ${currencySymbol}${netSavings.toFixed(0)} this month`,
      description: `You've saved ${currencySymbol}${netSavings.toFixed(2)} this month — ${savingsRate}% of your total income.`,
      metric: `${savingsRate}% saved`,
    });
  } else if (budgetUsedPct <= 80 && currentExpenses > 0) {
    insights.push({
      id: "budget_discipline",
      type: "success",
      icon: "🌟",
      badge: "On track",
      title: "Strong budget discipline",
      description: `You have used ${budgetUsedPct.toFixed(0)}% of your monthly budget with ${daysRemaining} days remaining.`,
      metric: `${(100 - budgetUsedPct).toFixed(0)}% remaining`,
    });
  }

  // Insight B: Category Spending Warnings
  if (topCategory && topCategory.pct >= 35 && topCategory.amount >= 50) {
    insights.push({
      id: "top_category_warning",
      type: "warning",
      icon: "⚠️",
      badge: `${topCategory.name} spending`,
      title: `${topCategory.name} is ${topCategory.pct}% of expenses`,
      description: `You have spent ${currencySymbol}${topCategory.amount.toFixed(2)} on ${topCategory.name}, accounting for ${topCategory.pct}% of all spending.`,
      metric: `${currencySymbol}${topCategory.amount.toFixed(0)} spent`,
    });
  }

  // Insight C: Month-over-Month Spending Trend
  if (prevExpenses > 0 && currentExpenses > 0) {
    if (momPctChange < 0) {
      const dropPct = Math.abs(momPctChange).toFixed(1);
      const dropAmount = Math.abs(momDiff).toFixed(2);
      insights.push({
        id: "mom_trend_down",
        type: "success",
        icon: "📈",
        badge: "Spending trend",
        title: `Spending decreased by ${dropPct}%`,
        description: `Your spending is ${currencySymbol}${dropAmount} lower than last month at this stage.`,
        metric: `-${dropPct}% MoM`,
      });
    } else if (momPctChange > 15) {
      const surgePct = momPctChange.toFixed(1);
      const surgeAmount = momDiff.toFixed(2);
      insights.push({
        id: "mom_trend_up",
        type: "alert",
        icon: "📈",
        badge: "Spending trend",
        title: `Spending increased by ${surgePct}%`,
        description: `Your spending is ${currencySymbol}${surgeAmount} higher than last month.`,
        metric: `+${surgePct}% MoM`,
      });
    }
  }

  // Insight D: Budget Forecast / Prediction
  if (limit > 0 && currentExpenses > 0) {
    if (isProjectedOverBudget) {
      insights.push({
        id: "budget_prediction_over",
        type: "warning",
        icon: "🎯",
        badge: "Budget prediction",
        title: `Projected ${currencySymbol}${projectedDiff.toFixed(0)} over budget`,
        description: `At your current burn rate of ${currencySymbol}${avgDailyBurn}/day, you will finish the month approximately ${currencySymbol}${projectedDiff.toFixed(0)} over budget.`,
        action: `Cap spending to ${currencySymbol}${dynamicDailyAllowance}/day for the remaining ${daysRemaining} days to stay safe.`,
        metric: `Over by ${currencySymbol}${projectedDiff.toFixed(0)}`,
      });
    } else {
      insights.push({
        id: "budget_prediction_under",
        type: "success",
        icon: "🎯",
        badge: "Budget prediction",
        title: `Projected ${currencySymbol}${projectedDiff.toFixed(0)} under budget`,
        description: `At your current rate, you will finish the month approximately ${currencySymbol}${projectedDiff.toFixed(0)} under budget.`,
        metric: `Under by ${currencySymbol}${projectedDiff.toFixed(0)}`,
      });
    }
  }

  // Insight E: Daily Spending Power
  if (dynamicDailyAllowance > 0) {
    insights.push({
      id: "daily_spending_power",
      type: "info",
      icon: "⚡",
      badge: "Daily power",
      title: `${currencySymbol}${dynamicDailyAllowance}/day safe allowance`,
      description: `You have ${currencySymbol}${remainingBudget.toFixed(2)} available for the next ${daysRemaining} days.`,
      metric: `${currencySymbol}${dynamicDailyAllowance}/day`,
    });
  }

  return {
    currentExpenses: parseFloat(currentExpenses.toFixed(2)),
    currentIncome: parseFloat(currentIncome.toFixed(2)),
    netSavings: parseFloat(netSavings.toFixed(2)),
    savingsRate,
    remainingBudget: parseFloat(remainingBudget.toFixed(2)),
    budgetUsedPct: parseFloat(budgetUsedPct.toFixed(1)),
    prevExpenses: parseFloat(prevExpenses.toFixed(2)),
    prevIncome: parseFloat(prevIncome.toFixed(2)),
    momDiff: parseFloat(momDiff.toFixed(2)),
    momPctChange: parseFloat(momPctChange.toFixed(1)),
    categories,
    topCategory,
    avgDailyBurn,
    projectedMonthEndSpend,
    dynamicDailyAllowance,
    isProjectedOverBudget,
    projectedDiff,
    daysRemaining,
    daysElapsed,
    insights,
  };
}


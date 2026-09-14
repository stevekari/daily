/**
 * AI Budget Coach & Predictive Analytics Engine
 * Calculates spending burn rates, end-of-month forecasts, and actionable saving tips.
 */

export function analyzeFinances(options = {}) {
  const transactions = Array.isArray(options?.transactions) ? options.transactions : [];
  const monthlyBudget = options?.monthlyBudget || 1000;
  const dailyLimit = options?.dailyLimit || 35;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

  // Filter this month's transactions
  const thisMonthTx = transactions.filter((t) => {
    if (!t) return false;
    const d = new Date(t.dateTime || t.date || Date.now());
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = thisMonthTx
    .filter((t) => t && t.type === "EXPENSE")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalIncome = thisMonthTx
    .filter((t) => t && t.type === "INCOME")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const remainingBudget = Math.max(0, monthlyBudget - totalSpent);

  // Dynamic daily budget power: remaining money distributed across remaining days
  const dynamicDailyBudget = parseFloat((remainingBudget / daysRemaining).toFixed(2));

  // Average daily burn rate so far this month
  const daysElapsed = Math.max(1, currentDay);
  const avgDailyBurn = parseFloat((totalSpent / daysElapsed).toFixed(2));

  // Projected spending at current burn rate
  const projectedMonthEndSpend = parseFloat((totalSpent + avgDailyBurn * (daysRemaining - 1)).toFixed(2));
  const isLikelyToExceed = projectedMonthEndSpend > monthlyBudget && monthlyBudget > 0;
  const projectedDifference = parseFloat(Math.abs(monthlyBudget - projectedMonthEndSpend).toFixed(2));

  // Category breakdown
  const categoryMap = {};
  thisMonthTx
    .filter((t) => t && t.type === "EXPENSE")
    .forEach((t) => {
      const cat = t.category || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(t.amount || 0);
    });

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2)),
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown[0] || { category: "General", amount: 0, percentage: 0 };

  // Generate personalized coaching recommendations
  const tips = [];

  if (isLikelyToExceed) {
    tips.push({
      type: "warning",
      icon: "⚠️",
      title: "Budget Overrun Forecast",
      text: `At your current burn rate of €${avgDailyBurn}/day, you are projected to reach €${projectedMonthEndSpend} by month-end, exceeding your budget by €${projectedDifference}.`,
      action: `Limit spending to €${dynamicDailyBudget}/day for the remaining ${daysRemaining} days to stay on track.`,
    });
  } else if (monthlyBudget > 0) {
    const projectedSavings = parseFloat((monthlyBudget - projectedMonthEndSpend).toFixed(2));
    tips.push({
      type: "positive",
      icon: "🎉",
      title: "Great Pace!",
      text: `You are spending an average of €${avgDailyBurn}/day. You are on track to save approximately €${projectedSavings} this month!`,
      action: "Consider moving excess savings to your goals.",
    });
  }

  if (topCategory.amount > 0 && topCategory.percentage >= 30) {
    tips.push({
      type: "info",
      icon: "💡",
      title: `Top Spending: ${topCategory.category}`,
      text: `${topCategory.category} accounts for ${topCategory.percentage}% of your expenses (€${topCategory.amount}).`,
      action: `Trimming just 15% here could save you €${(topCategory.amount * 0.15).toFixed(2)} this month.`,
    });
  }

  if (dynamicDailyBudget < dailyLimit && dynamicDailyBudget > 0) {
    tips.push({
      type: "tip",
      icon: "🎯",
      title: "Dynamic Allowance Adjusted",
      text: `Your safe spending power today is €${dynamicDailyBudget}/day (adjusted for the remaining ${daysRemaining} days).`,
      action: "Staying below this number guarantees you won't overspend.",
    });
  }

  return {
    totalSpent,
    totalIncome,
    remainingBudget,
    daysRemaining,
    daysInMonth,
    avgDailyBurn,
    projectedMonthEndSpend,
    isLikelyToExceed,
    projectedDifference,
    dynamicDailyBudget,
    categoryBreakdown,
    topCategory,
    tips,
  };
}

export function getDailyAllowance(monthlyBudget = 0, transactions = []) {
  const analysis = analyzeFinances({
    transactions: Array.isArray(transactions) ? transactions : [],
    monthlyBudget,
  });
  return {
    dailyAllowance: analysis.dynamicDailyBudget || 0,
    remainingBudget: analysis.remainingBudget || 0,
    daysRemaining: analysis.daysRemaining || 1,
  };
}

export function calculateBurnRate(transactions = [], monthlyBudget = 0) {
  const analysis = analyzeFinances({
    transactions: Array.isArray(transactions) ? transactions : [],
    monthlyBudget,
  });
  return {
    avgDailyBurn: analysis.avgDailyBurn || 0,
    projectedMonthEndSpend: analysis.projectedMonthEndSpend || 0,
    isLikelyToExceed: analysis.isLikelyToExceed || false,
  };
}

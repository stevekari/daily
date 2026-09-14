/**
 * Gamification Engine: Streaks, Achievements & Badges
 */

export const BADGES = [
  {
    id: "first_step",
    icon: "🌟",
    title: "First Step",
    description: "Logged your first transaction in Budget Pro",
    category: "Activity",
    maxProgress: 1,
  },
  {
    id: "streak_3",
    icon: "🔥",
    title: "Streak Novice",
    description: "Logged transactions 3 consecutive days",
    category: "Consistency",
    maxProgress: 3,
  },
  {
    id: "streak_7",
    icon: "⚡",
    title: "Streak Master",
    description: "Logged transactions 7 consecutive days",
    category: "Consistency",
    maxProgress: 7,
  },
  {
    id: "goal_crusher",
    icon: "🎯",
    title: "Goal Setter",
    description: "Created your first savings goal",
    category: "Savings",
    maxProgress: 1,
  },
  {
    id: "frugal_hero",
    icon: "💎",
    title: "Frugal Hero",
    description: "Logged 5 days strictly under your daily limit",
    category: "Discipline",
    maxProgress: 5,
  },
  {
    id: "receipt_scanner",
    icon: "📸",
    title: "Paperless Pro",
    description: "Used the AI Receipt Scanner to log a receipt",
    category: "Smart",
    maxProgress: 1,
  },
  {
    id: "export_master",
    icon: "📄",
    title: "Financial Auditor",
    description: "Exported your first statement report",
    category: "Smart",
    maxProgress: 1,
  },
  {
    id: "champion",
    icon: "🏆",
    title: "Budget Champion",
    description: "Logged 15+ transactions and maintained positive balance",
    category: "Mastery",
    maxProgress: 15,
  },
];

/**
 * Calculates current active streak in days based on transaction timestamps
 */
export function calculateStreak(transactions = []) {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return { count: 0, currentStreak: 0, activeToday: false };
  }

  const uniqueDays = new Set(
    transactions.map((t) => {
      const d = new Date(t.dateTime || t.date || Date.now());
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );

  const sortedDays = Array.from(uniqueDays).sort().reverse();
  if (sortedDays.length === 0) {
    return { count: 0, currentStreak: 0, activeToday: false };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  const activeToday = sortedDays[0] === todayStr;
  
  // If no transaction today or yesterday, streak is broken
  if (sortedDays[0] !== todayStr && sortedDays[0] !== yesterdayStr) {
    return { count: 0, currentStreak: 0, activeToday: false };
  }

  let streak = 0;
  const checkDate = new Date(sortedDays[0] === todayStr ? now : yesterday);

  for (let i = 0; i < 365; i++) {
    const targetStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
    if (uniqueDays.has(targetStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { count: streak, currentStreak: streak, activeToday };
}

/**
 * Evaluates which badges are unlocked given user state
 * Accepts either:
 * - evaluateBadges(userId, { transactions, goals, scannedCount, exportedCount, dailyLimit })
 * OR
 * - evaluateBadges({ userId, transactions, goals, scannedCount, exportedCount, dailyLimit, streakCount })
 */
export function evaluateBadges(param1 = {}, param2 = {}) {
  let userId = "default";
  let options = {};

  if (typeof param1 === "object" && param1 !== null && (!param2 || Object.keys(param2).length === 0)) {
    options = param1;
    userId = options.userId || "default";
  } else {
    userId = param1 || "default";
    options = param2 || {};
  }

  const transactions = Array.isArray(options.transactions) ? options.transactions : [];
  const goals = Array.isArray(options.goals) ? options.goals : [];
  const scannedCount = options.scannedCount || 0;
  const exportedCount = options.exportedCount || 0;
  const dailyLimit = options.dailyLimit || 50;

  const streakResult = calculateStreak(transactions);
  const streakCount = options.streakCount !== undefined ? options.streakCount : streakResult.count;

  let storedUnlocked = [];
  try {
    storedUnlocked = JSON.parse(localStorage.getItem(`budgetUser_badges_${userId}`) || "[]");
  } catch {
    storedUnlocked = [];
  }

  // Calculate days under limit
  const daysMap = {};
  transactions.forEach((t) => {
    if (t && t.type === "EXPENSE") {
      const d = new Date(t.dateTime || t.date || Date.now()).toDateString();
      daysMap[d] = (daysMap[d] || 0) + parseFloat(t.amount || 0);
    }
  });
  const daysUnderLimit = Object.values(daysMap).filter((spent) => spent > 0 && spent <= dailyLimit).length;

  const badgeStatus = BADGES.map((b) => {
    let progress = 0;
    let unlocked = storedUnlocked.includes(b.id);

    if (b.id === "first_step") progress = transactions.length >= 1 ? 1 : 0;
    if (b.id === "streak_3") progress = Math.min(streakCount, 3);
    if (b.id === "streak_7") progress = Math.min(streakCount, 7);
    if (b.id === "goal_crusher") progress = goals.length >= 1 ? 1 : 0;
    if (b.id === "frugal_hero") progress = Math.min(daysUnderLimit, 5);
    if (b.id === "receipt_scanner") progress = scannedCount >= 1 ? 1 : 0;
    if (b.id === "export_master") progress = exportedCount >= 1 ? 1 : 0;
    if (b.id === "champion") progress = Math.min(transactions.length, 15);

    if (progress >= b.maxProgress) {
      unlocked = true;
    }

    return {
      ...b,
      progress,
      unlocked,
    };
  });

  // Save new unlocked
  try {
    const newlyUnlocked = badgeStatus.filter((b) => b.unlocked).map((b) => b.id);
    localStorage.setItem(`budgetUser_badges_${userId}`, JSON.stringify(newlyUnlocked));
  } catch {
    // ignore storage errors
  }

  return badgeStatus;
}

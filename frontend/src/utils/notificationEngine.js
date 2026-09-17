/**
 * In-App Notification Center Engine & Daily Budget Alert Dispatcher
 */
import { sendPhoneSmsAlert } from "../firebase";

export function getNotifications(userId) {
  try {
    return JSON.parse(localStorage.getItem(`budgetUser_notifications_${userId}`) || "[]");
  } catch {
    return [];
  }
}

export const loadNotifications = getNotifications;

export function saveNotifications(userId, notifications = []) {
  try {
    localStorage.setItem(`budgetUser_notifications_${userId}`, JSON.stringify(notifications));
  } catch (err) {
    console.warn("Error saving notifications to localStorage:", err);
  }
}

export function getUnreadCount(userId) {
  const notifs = getNotifications(userId);
  return notifs.filter((n) => !n.read).length;
}

/**
 * Sends a native browser desktop/mobile push notification if permitted.
 */
export function sendBrowserNotification(title, options = {}) {
  try {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    }
  } catch (e) {
    console.warn("Native notification error:", e);
  }
}

/**
 * Requests browser notification permission.
 */
export async function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window) {
    try {
      return await Notification.requestPermission();
    } catch {
      return "default";
    }
  }
  return "unsupported";
}

/**
 * Add or update a notification by key to prevent duplicate spam while keeping amounts fresh.
 */
export function addNotification(userId, {
  title,
  message,
  type = "info", // 'warning' | 'danger' | 'success' | 'info' | 'badge'
  icon = "🔔",
  advice = [],
  category = "general",
  key = null,
}) {
  const current = getNotifications(userId);
  const notifKey = key || ("notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4));

  const newNotif = {
    id: notifKey,
    title,
    message,
    type,
    icon,
    advice: Array.isArray(advice) ? advice : advice ? [advice] : [],
    category,
    timestamp: new Date().toISOString(),
    read: false,
  };

  // If a notification with this key already exists, replace it at the top
  const filtered = current.filter((n) => n.id !== notifKey);
  const updated = [newNotif, ...filtered].slice(0, 40);
  saveNotifications(userId, updated);
  return updated;
}

export function deleteNotification(userId, notifId) {
  const current = getNotifications(userId);
  const updated = current.filter((n) => n.id !== notifId);
  saveNotifications(userId, updated);
  return updated;
}

export function updateNotification(userId, notifId, updates = {}) {
  const current = getNotifications(userId);
  const updated = current.map((n) => (n.id === notifId ? { ...n, ...updates } : n));
  saveNotifications(userId, updated);
  return updated;
}

export function deleteMultipleNotifications(userId, notifIds = []) {
  const idSet = new Set(notifIds);
  const current = getNotifications(userId);
  const updated = current.filter((n) => !idSet.has(n.id));
  saveNotifications(userId, updated);
  return updated;
}

export function clearAllNotifications(userId) {
  saveNotifications(userId, []);
  return [];
}

export function markAllAsRead(userId) {
  const current = getNotifications(userId);
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(userId, updated);
  return updated;
}

/**
 * Evaluates daily spending, monthly budget, streaks, and goals, triggering actionable alerts.
 */
export function checkAndTriggerSystemAlerts(
  userId,
  {
    totalSpent = 0,
    budgetAmount = 0,
    dailySpent = 0,
    dailyLimit = 0,
    dynamicDailyBudget = 0,
    streak = 0,
    goals = [],
  }
) {
  if (!userId) return;
  const notifications = getNotifications(userId);
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 1. Daily Limit Exceeded Alert (High Priority)
  if (dailyLimit > 0 && dailySpent > dailyLimit) {
    const overAmount = dailySpent - dailyLimit;
    const key = `alert_daily_exceeded_${todayKey}`;
    const existing = notifications.find((n) => n.id === key);

    // Check optional Firebase Phone SMS alert setup
    const userPhone = typeof window !== "undefined" ? localStorage.getItem(`budgetUser_phone_${userId}`) : null;
    const isPhoneVerified = typeof window !== "undefined" ? localStorage.getItem(`budgetUser_phone_verified_${userId}`) === "true" : false;
    const isSmsEnabled = typeof window !== "undefined" ? localStorage.getItem(`budgetUser_phone_sms_enabled_${userId}`) !== "false" : false;
    const smsSentTodayKey = `budgetUser_sms_sent_${userId}_${todayKey}`;
    const smsAlreadySentToday = typeof window !== "undefined" ? localStorage.getItem(smsSentTodayKey) === "true" : false;

    if (userPhone && isPhoneVerified && isSmsEnabled && !smsAlreadySentToday) {
      sendPhoneSmsAlert({
        phoneNumber: userPhone,
        title: "Steve Budget Daily Limit Exceeded 🚨",
        message: `🚨 Steve Budget Alert: You've spent €${dailySpent.toFixed(2)} today, which is €${overAmount.toFixed(2)} over your daily limit of €${dailyLimit.toFixed(2)}. Open Steve Budget to review anti-overspending advice.`,
      }).catch((err) => console.warn("Could not dispatch daily limit SMS:", err));
      if (typeof window !== "undefined") {
        localStorage.setItem(smsSentTodayKey, "true");
      }
    }

    const title = `Daily Limit Exceeded! 🚨`;
    const message = `You have spent €${dailySpent.toFixed(2)} today, which is €${overAmount.toFixed(2)} over your daily limit of €${dailyLimit.toFixed(2)}.` +
      (userPhone && isPhoneVerified && isSmsEnabled ? ` (📱 SMS Alert sent to ${userPhone})` : "");
    const advice = [
      "🛑 Pause non-essential & impulse purchases for the rest of today.",
      "🍳 Cook meals or brew coffee at home today instead of ordering takeout.",
      dynamicDailyBudget > 0
        ? `💰 Adjust future spending: your safe daily pace for the remaining days is €${dynamicDailyBudget.toFixed(2)}/day.`
        : "📊 Check your AI Coach insights to rebalance category expenses and safeguard monthly savings.",
    ];

    // Only dispatch native push when first exceeded or when spending jumps significantly
    if (!existing) {
      sendBrowserNotification(title, {
        body: `${message} Check your anti-overspending advice in the app!`,
        tag: key,
      });
    }

    addNotification(userId, {
      key,
      title,
      message,
      type: "danger",
      icon: "🚨",
      category: "daily",
      advice,
    });
  }

  // 2. Approaching Daily Limit Alert (85% to 100%)
  else if (dailyLimit > 0 && dailySpent >= dailyLimit * 0.85 && dailySpent <= dailyLimit) {
    const key = `alert_daily_near_${todayKey}`;
    const remainingToday = Math.max(0, dailyLimit - dailySpent);
    const pct = Math.round((dailySpent / dailyLimit) * 100);

    const title = `Approaching Daily Limit (${pct}%) ⚠️`;
    const message = `You've spent €${dailySpent.toFixed(2)} of your €${dailyLimit.toFixed(2)} daily limit. You have €${remainingToday.toFixed(2)} remaining today.`;
    const advice = [
      "⚠️ Be extra mindful of any additional purchases today so you don't overspend.",
      "⏳ Use the 24-hour rule: wait until tomorrow before buying non-essential items.",
    ];

    addNotification(userId, {
      key,
      title,
      message,
      type: "warning",
      icon: "⚠️",
      category: "daily",
      advice,
    });
  }

  // 3. Monthly 80% Budget Alert
  if (budgetAmount > 0 && totalSpent / budgetAmount >= 0.8 && totalSpent < budgetAmount) {
    const key = `alert_monthly_80_${todayKey.slice(0, 7)}`;
    if (!notifications.some((n) => n.id === key)) {
      const pct = ((totalSpent / budgetAmount) * 100).toFixed(0);
      addNotification(userId, {
        key,
        title: "80% Monthly Budget Reached ⚠️",
        message: `You have used ${pct}% of your monthly budget (€${totalSpent.toFixed(2)} of €${budgetAmount.toFixed(2)}).`,
        type: "warning",
        icon: "⚠️",
        category: "monthly",
        advice: [
          "Trim top spending categories by 10-15% for the rest of the month.",
          dynamicDailyBudget > 0 ? `Target a safe allowance of €${dynamicDailyBudget.toFixed(2)}/day.` : "Monitor your daily spending closely.",
        ],
      });
    }
  }

  // 4. Monthly 100% Budget Cap Exceeded Alert
  if (budgetAmount > 0 && totalSpent >= budgetAmount) {
    const key = `alert_monthly_100_${todayKey.slice(0, 7)}`;
    if (!notifications.some((n) => n.id === key)) {
      addNotification(userId, {
        key,
        title: "Monthly Budget Cap Exceeded 🚨",
        message: `You have spent €${totalSpent.toFixed(2)}, exceeding your €${budgetAmount.toFixed(2)} monthly budget.`,
        type: "danger",
        icon: "🚨",
        category: "monthly",
        advice: [
          "Freeze non-essential category spending for the remainder of this month.",
          "Check the Monthly Comparison tab to apply a realistic budget baseline.",
        ],
      });
    }
  }

  // 5. Streak milestone alert
  if (streak > 0 && streak % 3 === 0) {
    const key = `alert_streak_${streak}`;
    if (!notifications.some((n) => n.id === key)) {
      addNotification(userId, {
        key,
        title: `${streak}-Day Streak! 🔥`,
        message: `Amazing consistency! You've logged your expenses for ${streak} consecutive days.`,
        type: "badge",
        icon: "🔥",
        category: "milestone",
      });
    }
  }

  // 6. Goal milestone alert
  goals.forEach((goal) => {
    if (goal.targetAmount > 0 && (goal.currentAmount || 0) >= goal.targetAmount) {
      const key = `goal_completed_${goal.id}`;
      if (!notifications.some((n) => n.id === key)) {
        addNotification(userId, {
          key,
          title: `Goal Achieved! 🎯`,
          message: `Congratulations! You reached your savings goal for "${goal.title}" (€${goal.targetAmount}).`,
          type: "badge",
          icon: "🎯",
          category: "milestone",
        });
      }
    }
  });
}

export function checkBudgetAlerts({
  budgetAmount,
  totalSpent,
  dailySpent = 0,
  dailyLimit = 0,
  dynamicDailyBudget = 0,
  streak = 0,
  userId,
  goals = [],
}) {
  return checkAndTriggerSystemAlerts(userId, {
    totalSpent,
    budgetAmount,
    dailySpent,
    dailyLimit,
    dynamicDailyBudget,
    streak,
    goals,
  });
}

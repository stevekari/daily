import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "../LanguageContext";
import { ThemeToggle } from "../ThemeContext";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  getUserBudgets,
  getUserTransactions,
  createOrUpdateBudget,
} from "../dataApi";

// Utils
import {
  autoCategorizeMeta,
  getCategoryMeta,
  STANDARD_CATEGORIES,
} from "../utils/autoCategorizer";
import { calculateStreak, evaluateBadges } from "../utils/gamification";
import { getDailyAllowance } from "../utils/aiCoach";
import {
  loadNotifications,
  getUnreadCount,
  checkBudgetAlerts,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../utils/notificationEngine";

// Sub-components
import AchievementsModal from "./AchievementsModal";
import SpendingCalendar from "./SpendingCalendar";
import SavingsGoals from "./SavingsGoals";
import BudgetCoach from "./BudgetCoach";
import ReceiptScannerModal from "./ReceiptScannerModal";
import NotificationCenter from "./NotificationCenter";
import AnalyticsCharts from "./AnalyticsCharts";
import MonthlyComparison from "./MonthlyComparison";
import ExportReportModal from "./ExportReportModal";
import AnimatedNumber from "./AnimatedNumber";
import WheelDatePicker from "./WheelDatePicker";
import PwaInstallModal, { usePwaInstall } from "./PwaInstallPrompt";

// Safe number formatter helper
const fmt = (num, decimals = 2) => {
  const n = Number(num);
  return isNaN(n) ? "0.00" : n.toFixed(decimals);
};

export default function BudgetApp({ userId, username, onLogout }) {
  const { language, t, setShowLanguagePicker } = useLanguage();

  // ── CORE DATA STATE ───────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard' | 'analytics' | 'calendar' | 'goals' | 'coach'
  const [tabMode, setTabMode] = useState("all"); // 'all' | 'daily' | 'weekly' | 'monthly'

  // Modals state
  const [showAchievements, setShowAchievements] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  // PWA Install State
  const { isInstallable, isInstalled, isIos, isAndroid, triggerInstall } = usePwaInstall();

  // User details & local budget overrides
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem(`budgetUser_name_${userId}`) || username || "User";
  });

  // Profile Avatar State (Base64 data URL)
  const [userAvatar, setUserAvatar] = useState(() => {
    return (
      localStorage.getItem(`budgetUser_avatar_${userId}`) ||
      localStorage.getItem(`budgetUser_avatar_${username}`) ||
      ""
    );
  });
  const fileInputRef = useRef(null);
  const settingsFileInputRef = useRef(null);

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleAvatarFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setUserAvatar(dataUrl);
        if (userId) localStorage.setItem(`budgetUser_avatar_${userId}`, dataUrl);
        if (username) localStorage.setItem(`budgetUser_avatar_${username}`, dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    setUserAvatar("");
    if (userId) localStorage.removeItem(`budgetUser_avatar_${userId}`);
    if (username) localStorage.removeItem(`budgetUser_avatar_${username}`);
  };

  const [localBudget, setLocalBudget] = useState(() => {
    const stored = localStorage.getItem(`budgetUser_budget_${userId}`);
    return stored ? parseFloat(stored) : null;
  });

  const [localDailyLimit, setLocalDailyLimit] = useState(() => {
    const stored = localStorage.getItem(`budgetUser_daily_${userId}`);
    return stored ? parseFloat(stored) : null;
  });

  // Goals state
  const [goals, setGoals] = useState(() => {
    try {
      const stored = localStorage.getItem(`budgetUser_goals_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [dismissedDailyAlert, setDismissedDailyAlert] = useState(false);

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState(displayName);
  const [settingsBudget, setSettingsBudget] = useState("");
  const [settingsDaily, setSettingsDaily] = useState("");

  // Name inline editing
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const nameInputRef = useRef(null);

  // Transaction inline editing
  const [editingTx, setEditingTx] = useState(null);

  // Live clock
  const [now, setNow] = useState(new Date());

  // Transaction form state
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    type: "EXPENSE",
    date: new Date().toISOString().slice(0, 10),
    category: "General",
    reason: "",
  });
  const [detectedCategory, setDetectedCategory] = useState(null);
  const [typeFilter, setTypeFilter] = useState("ALL"); // 'ALL' | 'EXPENSE' | 'INCOME'

  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── API & DATA CALLBACKS ──────────────────────────────────────────────────
  const loadBudget = useCallback(async () => {
    try {
      const budgets = await getUserBudgets(userId);
      if (budgets && budgets.length > 0) setBudget(budgets[0]);
    } catch (err) {
      console.error("Error loading budget:", err);
    }
  }, [userId]);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getUserTransactions(userId);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading transactions:", err);
    }
  }, [userId]);

  const refreshNotifications = useCallback(() => {
    if (!userId) return;
    const list = loadNotifications(userId);
    setNotifications(list);
    setUnreadNotifsCount(getUnreadCount(userId));
  }, [userId]);

  // ── EFFECTS ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!userId) return;

    async function fetchUserData() {
      try {
        const budgets = await getUserBudgets(userId);
        if (isMounted && budgets && budgets.length > 0) setBudget(budgets[0]);
      } catch (err) {
        console.error("Error loading budget:", err);
        if (err.message && err.message.toLowerCase().includes("user not found")) {
          onLogout();
          return;
        }
      }
      try {
        const data = await getUserTransactions(userId);
        if (isMounted) setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading transactions:", err);
        if (err.message && err.message.toLowerCase().includes("user not found")) {
          onLogout();
          return;
        }
      }
      if (isMounted) {
        const list = loadNotifications(userId);
        setNotifications(list);
        setUnreadNotifsCount(getUnreadCount(userId));
      }
    }

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [userId, onLogout]);

  useEffect(() => {
    if (editingName && nameInputRef.current) nameInputRef.current.focus();
  }, [editingName]);

  // ── CALCULATIONS ──────────────────────────────────────────────────────────
  const txList = Array.isArray(transactions) ? transactions : [];

  const totalSpent = txList
    .filter((t) => t && t.type === "EXPENSE")
    .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0) || 0;

  const totalIncome = txList
    .filter((t) => t && t.type === "INCOME")
    .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0) || 0;

  const budgetAmount = Number(localBudget ?? (budget?.totalBudget ?? 0)) || 0;
  const dailyLimitAmount =
    Number(localDailyLimit ?? (budget?.dailyLimit ?? (budgetAmount > 0 ? Math.round(budgetAmount / 30) : 50))) || 0;
  const monthlyLimitAmount = budgetAmount;

  const getDailySpending = () => {
    const today = new Date();
    return txList
      .filter(
        (t) =>
          t &&
          t.type === "EXPENSE" &&
          new Date(t.dateTime || t.date || now).toDateString() === today.toDateString()
      )
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
  };

  const getMonthlySpending = () => {
    const today = new Date();
    return txList
      .filter((t) => {
        if (!t) return false;
        const txDate = new Date(t.dateTime || t.date || now);
        return (
          t.type === "EXPENSE" &&
          txDate.getMonth() === today.getMonth() &&
          txDate.getFullYear() === today.getFullYear()
        );
      })
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
  };

  const dailySpent = getDailySpending();
  const monthlySpent = getMonthlySpending();

  const remaining = budgetAmount - totalSpent;
  const percentage = budgetAmount > 0 ? Math.min((totalSpent / budgetAmount) * 100, 100) : 0;

  const gaugePercentage = Math.min(percentage, 100);
  const gaugeAngle = (gaugePercentage / 100) * 180 - 90;
  let gaugeColor = "#22c55e";
  if (gaugePercentage > 80) gaugeColor = "#ef4444";
  else if (gaugePercentage > 50) gaugeColor = "#f97316";

  const locale = { en: "en-GB", es: "es-ES", fr: "fr-FR", pt: "pt-PT" }[language] || "en-GB";
  const timeStr = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Gamification & AI Coach metrics
  const streakInfo = calculateStreak(txList);
  const badges = evaluateBadges({
    userId,
    transactions: txList,
    budgetAmount,
    streakCount: streakInfo.currentStreak,
    goals,
  });
  const allowance = getDailyAllowance(budgetAmount, txList);

  // Check budget alerts (monthly, daily limit, streak, goals)
  useEffect(() => {
    if (!userId) return;
    checkBudgetAlerts({
      budgetAmount,
      totalSpent: monthlySpent,
      dailySpent,
      dailyLimit: dailyLimitAmount,
      dynamicDailyBudget: allowance.dailyAllowance,
      streak: streakInfo.currentStreak,
      userId,
      goals,
    });
    const timer = setTimeout(() => {
      refreshNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    userId,
    budgetAmount,
    monthlySpent,
    dailySpent,
    dailyLimitAmount,
    allowance.dailyAllowance,
    streakInfo.currentStreak,
    goals,
    refreshNotifications,
  ]);

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const handleNameInputChange = (e) => {
    const val = e.target.value;
    const meta = autoCategorizeMeta(val + " " + (formData.reason || ""));
    setDetectedCategory(meta);

    setFormData((prev) => ({
      ...prev,
      name: val,
      category: meta ? meta.category : prev.category,
      type: meta && meta.isIncome ? "INCOME" : prev.type,
    }));
  };

  const handleReasonInputChange = (e) => {
    const val = e.target.value;
    const meta = autoCategorizeMeta((formData.name || "") + " " + val);
    if (meta) {
      setDetectedCategory(meta);
      setFormData((prev) => ({
        ...prev,
        reason: val,
        category: meta.category,
        type: meta.isIncome ? "INCOME" : prev.type,
      }));
    } else {
      setFormData((prev) => ({ ...prev, reason: val }));
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      alert(t("pleaseFillNameAmount"));
      return;
    }

    try {
      const nowTime = new Date().toTimeString().slice(0, 8);
      const fullDateTime = formData.date ? `${formData.date}T${nowTime}` : new Date().toISOString().slice(0, 19);

      await createTransaction({
        userId: parseInt(userId),
        name: formData.name,
        amount: parseFloat(formData.amount),
        type: formData.type,
        dateTime: fullDateTime,
        category: formData.category || "General",
        description: formData.reason,
      });

      setFormData({
        name: "",
        amount: "",
        type: "EXPENSE",
        date: new Date().toISOString().slice(0, 10),
        category: "General",
        reason: "",
      });
      setDetectedCategory(null);
      loadTransactions();
    } catch (err) {
      console.error("Error adding transaction:", err);
    }
  };

  const handleReceiptScanned = async (scannedTx) => {
    try {
      await createTransaction({
        userId: parseInt(userId),
        name: scannedTx.name,
        amount: parseFloat(scannedTx.amount),
        type: scannedTx.type || "EXPENSE",
        dateTime: scannedTx.dateTime || new Date().toISOString().slice(0, 16),
        category: scannedTx.category || "General",
        description: scannedTx.reason || "Scanned Receipt",
      });
      loadTransactions();
    } catch (err) {
      console.error("Error adding scanned transaction:", err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      loadTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTx) return;
    try {
      await updateTransaction(editingTx.id, {
        userId: parseInt(userId),
        name: editingTx.name,
        amount: parseFloat(editingTx.amount),
        type: editingTx.type,
        category: editingTx.category,
        description: editingTx.description,
      });
      setEditingTx(null);
      loadTransactions();
    } catch (err) {
      console.error("Error updating transaction:", err);
      // Fallback local update
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTx.id
            ? {
                ...t,
                amount: parseFloat(editingTx.amount),
                type: editingTx.type,
                name: editingTx.name,
                category: editingTx.category,
                description: editingTx.description,
              }
            : t
        )
      );
      setEditingTx(null);
    }
  };

  const handleUpdateGoals = (newGoals) => {
    setGoals(newGoals);
    localStorage.setItem(`budgetUser_goals_${userId}`, JSON.stringify(newGoals));
  };

  const handleMarkAllRead = () => {
    markAllAsRead(userId);
    refreshNotifications();
  };

  const handleDeleteNotification = (id) => {
    deleteNotification(userId, id);
    refreshNotifications();
  };

  const handleClearAllNotifications = () => {
    clearAllNotifications(userId);
    refreshNotifications();
  };

  const handleLogout = () => {
    if (window.confirm(t("areYouSureLogout"))) onLogout();
  };

  const commitNameEdit = async () => {
    const trimmed = tempName.trim() || username;
    setDisplayName(trimmed);
    localStorage.setItem(`budgetUser_name_${userId}`, trimmed);
    setSettingsName(trimmed);
    setEditingName(false);
  };

  const handleSaveSettings = async () => {
    const trimmed = settingsName.trim() || username;
    setDisplayName(trimmed);
    setTempName(trimmed);
    localStorage.setItem(`budgetUser_name_${userId}`, trimmed);

    let newBudgetVal = localBudget;
    if (settingsBudget && parseFloat(settingsBudget) > 0) {
      newBudgetVal = parseFloat(settingsBudget);
      setLocalBudget(newBudgetVal);
      localStorage.setItem(`budgetUser_budget_${userId}`, String(newBudgetVal));
    }

    let newDailyVal = localDailyLimit;
    if (settingsDaily && parseFloat(settingsDaily) > 0) {
      newDailyVal = parseFloat(settingsDaily);
      setLocalDailyLimit(newDailyVal);
      localStorage.setItem(`budgetUser_daily_${userId}`, String(newDailyVal));
    }

    try {
      if (newBudgetVal && newBudgetVal > 0) {
        await createOrUpdateBudget({
          userId: parseInt(userId),
          user: { id: parseInt(userId) },
          name: trimmed,
          totalBudget: newBudgetVal,
          dailyLimit: newDailyVal || Math.round(newBudgetVal / 30),
          monthlyLimit: newBudgetVal,
        });
        loadBudget();
      }
    } catch (err) {
      console.error("Error updating budget in settings:", err);
    }

    setSettingsBudget("");
    setSettingsDaily("");
    setShowSettings(false);
  };

  const handleApplyRecommendedBudget = async (newBudget, newDaily) => {
    if (!newBudget || newBudget <= 0) return;
    setLocalBudget(newBudget);
    if (newDaily && newDaily > 0) {
      setLocalDailyLimit(newDaily);
      localStorage.setItem(`budgetUser_daily_${userId}`, String(newDaily));
    }
    localStorage.setItem(`budgetUser_budget_${userId}`, String(newBudget));
    try {
      await createOrUpdateBudget({
        userId: parseInt(userId),
        user: { id: parseInt(userId) },
        name: displayName,
        totalBudget: newBudget,
        dailyLimit: newDaily || Math.round(newBudget / 30),
        monthlyLimit: newBudget,
      });
      loadBudget();
    } catch (err) {
      console.error("Error applying recommended budget:", err);
    }
  };

  // Recent filters for sidebar & transactions list
  const getRecentTransactions = (period) => {
    const today = new Date();
    return txList
      .filter((t) => {
        if (!t) return false;
        const txDate = new Date(t.dateTime || t.date || now);
        if (period === "daily") {
          return txDate.toDateString() === today.toDateString();
        } else if (period === "weekly") {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return txDate >= weekAgo;
        } else        return true;
      })
      .sort((a, b) => new Date(b.dateTime || b.date || 0) - new Date(a.dateTime || a.date || 0));
  };

  const periodTransactions =
    tabMode === "all" ? txList : getRecentTransactions(tabMode);

  const filteredTransactions = periodTransactions.filter((t) => {
    if (!t) return false;
    if (typeFilter === "EXPENSE") return t.type === "EXPENSE";
    if (typeFilter === "INCOME") return t.type === "INCOME";
    return true;
  });

  const incomeTxList = txList
    .filter((t) => t && t.type === "INCOME")
    .sort((a, b) => new Date(b.dateTime || b.date || 0) - new Date(a.dateTime || a.date || 0));

  const expenseTxList = txList
    .filter((t) => t && t.type === "EXPENSE")
    .sort((a, b) => new Date(b.dateTime || b.date || 0) - new Date(a.dateTime || a.date || 0));

  const avgIncome = incomeTxList.length > 0 ? totalIncome / incomeTxList.length : 0;
  const maxIncome = incomeTxList.reduce((max, t) => Math.max(max, parseFloat(t.amount || 0)), 0);
  const avgExpense = expenseTxList.length > 0 ? totalSpent / expenseTxList.length : 0;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="budget-app">
      {/* ── SETTINGS MODAL ────────────────────────────────────────── */}
      {showSettings && (
        <div className="bs-modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="bs-modal" onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 900,
                marginBottom: 20,
                letterSpacing: 2,
                color: "#f97316",
              }}
            >
              ⚙️ {t("settings")}
            </h2>

            {/* Profile Photo Section */}
            <div className="settings-avatar-row">
              <div className="settings-avatar-preview">
                {userAvatar ? (
                  <img src={userAvatar} alt={settingsName} className="settings-avatar-img" />
                ) : (
                  <div className="settings-avatar-initials">{getInitials(settingsName)}</div>
                )}
              </div>
              <div className="settings-avatar-actions">
                <button
                  type="button"
                  className="settings-photo-btn primary"
                  onClick={() => settingsFileInputRef.current && settingsFileInputRef.current.click()}
                >
                  📷 {userAvatar ? t("changePhoto") || "Change Photo" : t("uploadPhoto") || "Upload Photo"}
                </button>
                {userAvatar && (
                  <button
                    type="button"
                    className="settings-photo-btn danger"
                    onClick={handleRemoveAvatar}
                  >
                    🗑️ {t("removePhoto") || "Remove"}
                  </button>
                )}
              </div>
            </div>

            <label className="auth-label">{t("yourName")}</label>
            <input
              className="bs-form-input"
              type="text"
              value={settingsName}
              onChange={(e) => setSettingsName(e.target.value)}
              placeholder="Enter your name"
              style={{ marginBottom: 14 }}
            />

            <label className="auth-label">{t("monthlyBudget")}</label>
            <input
              className="bs-form-input"
              type="number"
              min="1"
              step="1"
              value={settingsBudget}
              onChange={(e) => setSettingsBudget(e.target.value)}
              placeholder={`${t("current")}: €${budgetAmount > 0 ? fmt(budgetAmount) : t("notSet")}`}
              style={{ marginBottom: 14 }}
            />

            <label className="auth-label">{t("dailyLimit")}</label>
            <input
              className="bs-form-input"
              type="number"
              min="1"
              step="1"
              value={settingsDaily}
              onChange={(e) => setSettingsDaily(e.target.value)}
              placeholder={`${t("current")}: €${fmt(dailyLimitAmount)}`}
              style={{ marginBottom: 20 }}
            />

            <button
              className="bs-language-link"
              onClick={() => {
                setShowSettings(false);
                setShowLanguagePicker(true);
              }}
              type="button"
            >
              {t("language")} <span>EN · ES · FR · PT</span>
            </button>

            <div style={{ marginBottom: 20 }}>
              <ThemeToggle />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="btn-submit"
                style={{ flex: 1, padding: "12px 0" }}
              >
                💾 {t("save")}
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="secondary-btn"
                style={{ flex: 1, padding: "12px 0" }}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENTS MODAL ────────────────────────────────────── */}
      <AchievementsModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        streakCount={streakInfo.currentStreak}
        badges={badges}
      />

      {/* ── RECEIPT SCANNER MODAL ─────────────────────────────────── */}
      <ReceiptScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onAddTransaction={handleReceiptScanned}
      />

      {/* ── NOTIFICATIONS DRAWER MODAL ────────────────────────────── */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          refreshNotifications();
        }}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAll={handleClearAllNotifications}
      />

      {/* ── EXPORT PDF / CSV REPORT MODAL ─────────────────────────── */}
      <ExportReportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        username={displayName}
        budgetAmount={budgetAmount}
        totalSpent={monthlySpent}
        totalIncome={totalIncome}
        transactions={txList}
      />

      {/* Hidden File Inputs for Profile Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleAvatarFileSelected}
      />
      <input
        type="file"
        ref={settingsFileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleAvatarFileSelected}
      />

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          ORANGE ANIMATED SIDEBAR (Left side with glowing profile & navigation items)
          ════════════════════════════════════════════════════════════════════════════ */}
      <aside className={`sidebar ${mobileSidebarOpen ? "sidebar--mobile-open" : ""}`}>
        {/* Mobile Close Button */}
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>

        {/* User Profile Card with Photo and Person's Name */}
        <div className="sidebar-profile-card">
          <div
            className="sidebar-avatar-wrap"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            title={t("changePhoto") || "Click to upload / change photo"}
          >
            {userAvatar ? (
              <img src={userAvatar} alt={displayName} className="sidebar-avatar-img" />
            ) : (
              <div className="sidebar-avatar-initials">{getInitials(displayName)}</div>
            )}
            <div className="sidebar-avatar-overlay">
              <span>📷</span>
            </div>
          </div>
          <div className="sidebar-user-details">
            <div className="sidebar-user-name-row">
              <span className="sidebar-user-name" title={displayName}>
                {displayName}
              </span>
              <button
                type="button"
                className="sidebar-name-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsName(displayName);
                  setShowSettings(true);
                  setMobileSidebarOpen(false);
                }}
                title={t("editName") || "Edit profile"}
              >
                ✏️
              </button>
            </div>
            <div className="sidebar-user-status">
              <span className="user-status-dot"></span>
              <span className="user-status-text">{t("personalAccount") || "Personal Account"}</span>
            </div>
          </div>
        </div>

        {/* Quick View Links inside Sidebar */}
        <div className="sidebar-section" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p className="sidebar-section-title">✦ {t("dashboard") || "NAVIGATION"}</p>
          {[
            { id: "dashboard", icon: "📊", label: t("dashboard") || "Dashboard" },
            { id: "analytics", icon: "📈", label: t("analytics") || "Analytics" },
            { id: "calendar", icon: "📅", label: t("calendar") || "Calendar" },
            { id: "goals", icon: "🎯", label: t("savingsGoals") || "Goals" },
            { id: "coach", icon: "🤖", label: t("budgetCoach") || "AI Coach" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCurrentView(item.id);
                setMobileSidebarOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: currentView === item.id ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.15)",
                color: "#fff",
                fontWeight: currentView === item.id ? 900 : 700,
                fontSize: 12,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Daily */}
        <div className="sidebar-section">
          <p className="sidebar-section-title">✦ {t("recentDaily") || "RECENT DAILY"}</p>
          {getRecentTransactions("daily").length === 0 ? (
            <p style={{ fontSize: 11, opacity: 0.75, fontStyle: "italic", margin: "4px 0" }}>
              {t("noTransactionsShort") || "No items today"}
            </p>
          ) : (
            getRecentTransactions("daily")
              .slice(0, 2)
              .map((tx) => (
                <div key={tx.id} className="sidebar-transaction">
                  <div>
                    <p className="sidebar-transaction-name">✦ {tx.name}</p>
                    <p className="sidebar-transaction-date">
                      {new Date(tx.dateTime || tx.date || now).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="sidebar-transaction-amount">
                    {tx.type === "EXPENSE" ? "-" : "+"}€{fmt(tx.amount)}
                  </p>
                </div>
              ))
          )}
        </div>

        {/* Recent Monthly */}
        <div className="sidebar-section grow">
          <p className="sidebar-section-title">✦ {t("recentMonthly") || "RECENT MONTHLY"}</p>
          {getRecentTransactions("monthly").length === 0 ? (
            <p style={{ fontSize: 11, opacity: 0.75, fontStyle: "italic", margin: "4px 0" }}>
              {t("noTransactionsShort") || "No items this month"}
            </p>
          ) : (
            getRecentTransactions("monthly")
              .slice(0, 2)
              .map((tx) => (
                <div key={tx.id} className="sidebar-transaction">
                  <div>
                    <p className="sidebar-transaction-name">✦ {tx.name}</p>
                    <p className="sidebar-transaction-date">
                      {new Date(tx.dateTime || tx.date || now).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="sidebar-transaction-amount">
                    {tx.type === "EXPENSE" ? "-" : "+"}€{fmt(tx.amount)}
                  </p>
                </div>
              ))
          )}
        </div>

        {/* Settings & Logout */}
        <div className="sidebar-footer">
          {!isInstalled && (
            <button
              type="button"
              className="btn-sidebar btn-install-app"
              onClick={() => {
                if (isInstallable) {
                  triggerInstall();
                } else {
                  setShowPwaModal(true);
                }
                setMobileSidebarOpen(false);
              }}
              style={{
                background: "linear-gradient(135deg, rgba(249, 115, 22, 0.4), rgba(234, 88, 12, 0.6))",
                border: "1px solid rgba(249, 115, 22, 0.6)",
                color: "#fff",
                fontWeight: 800,
                boxShadow: "0 2px 10px rgba(249, 115, 22, 0.25)",
              }}
            >
              📲 {t("installApp") || "Install App"}
            </button>
          )}
          <button
            type="button"
            className="btn-sidebar btn-settings"
            onClick={() => {
              setSettingsName(displayName);
              setSettingsBudget("");
              setSettingsDaily("");
              setShowSettings(true);
              setMobileSidebarOpen(false);
            }}
          >
            ⚙️ {t("settings")}
          </button>
          <button type="button" className="btn-sidebar btn-logout" onClick={handleLogout}>
            🚪 {t("logout")}
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA (Right Side)
          ════════════════════════════════════════════════════════════════════════════ */}
      <main className="main">
        {/* Mobile Top Header */}
        <div className="mobile-top-bar">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div
            className="mobile-profile-chip"
            onClick={() => {
              setSettingsName(displayName);
              setShowSettings(true);
            }}
            title={t("settings") || "Profile Settings"}
          >
            <div className="mobile-avatar-thumb">
              {userAvatar ? (
                <img src={userAvatar} alt={displayName} className="mobile-avatar-img" />
              ) : (
                <span className="mobile-avatar-initials">{getInitials(displayName)}</span>
              )}
            </div>
            <span className="mobile-profile-name">{displayName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {!isInstalled && (
              <button
                type="button"
                className="mobile-install-pill"
                onClick={() => {
                  if (isInstallable) {
                    triggerInstall();
                  } else {
                    setShowPwaModal(true);
                  }
                }}
                title={t("installApp") || "Install App"}
              >
                <span>📲</span>
                <span>Install</span>
              </button>
            )}
            <button
              type="button"
              className="mobile-icon-btn"
              onClick={() => setShowNotifications(true)}
              title={t("notifications")}
              style={{ position: "relative" }}
            >
              🔔
              {unreadNotifsCount > 0 && (
                <span className="notif-badge-pill">{unreadNotifsCount}</span>
              )}
            </button>
            <div className="mobile-theme-toggle-wrap">
              <ThemeToggle compact />
            </div>
            <button
              type="button"
              className="mobile-icon-btn"
              onClick={() => {
                setSettingsName(displayName);
                setSettingsBudget("");
                setSettingsDaily("");
                setShowSettings(true);
              }}
              title={t("settings")}
            >
              ⚙️
            </button>
            <button
              type="button"
              className="mobile-icon-btn mobile-logout-btn"
              onClick={handleLogout}
              title={t("logout") || "Logout"}
              aria-label={t("logout") || "Logout"}
            >
              🚪
            </button>
          </div>
        </div>

        {/* Top Header Bar */}
        <div className="main-header-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              className="header-avatar-wrap"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title={t("changePhoto") || "Click to upload / change photo"}
            >
              {userAvatar ? (
                <img src={userAvatar} alt={displayName} className="header-avatar-img" />
              ) : (
                <div className="header-avatar-initials">{getInitials(displayName)}</div>
              )}
              <span className="header-avatar-cam">📷</span>
            </div>
            <div>
              <h1
                className="bs-main-title"
                style={{ fontSize: 24, fontWeight: 900, letterSpacing: 1.5, margin: 0 }}
              >
                {displayName ? `${displayName.toUpperCase()}'S BUDGET` : "STEVE BUDGET APPS"}
              </h1>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                👋 {t("welcomeBack")},{" "}
                {editingName ? (
                  <input
                    ref={nameInputRef}
                    className="ba-name-input"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={commitNameEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitNameEdit();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: "2px solid #f97316",
                      color: "#f97316",
                      fontWeight: 800,
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                ) : (
                  <strong
                    onClick={() => {
                      setTempName(displayName);
                      setEditingName(true);
                    }}
                    style={{ color: "#f97316", cursor: "pointer" }}
                    title={t("editName")}
                  >
                    {displayName} ✏️
                  </strong>
                )}
              </p>
            </div>
          </div>

          {/* Live Clock & Top Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div className="ba-clock" style={{ padding: "8px 16px" }}>
              <div className="ba-clock-time" style={{ fontSize: 22 }}>
                {timeStr.split(":").map((seg, i) => (
                  <span key={i}>
                    {i > 0 && <span className="ba-colon-blink">:</span>}
                    <span>{seg}</span>
                  </span>
                ))}
              </div>
              <div className="ba-clock-date" style={{ fontSize: 9 }}>
                {dateStr}
              </div>
            </div>

            <div className="header-theme-toggle-wrap">
              <ThemeToggle showLabel={false} />
            </div>

            <button
              type="button"
              className="top-nav-logout-btn"
              onClick={handleLogout}
              title={t("logout") || "Logout"}
            >
              🚪 <span>{t("logout") || "Logout"}</span>
            </button>
          </div>
        </div>

        {/* ── HEADER ACTION PILLS & STATUS BADGES ─────────────────── */}
        <div className="header-actions-row">
          {/* Streak Pill */}
          <button
            type="button"
            className="status-pill streak"
            onClick={() => setShowAchievements(true)}
            title="View streaks & achievements"
          >
            🔥 {streakInfo.currentStreak} {t("dayStreak") || "Day Streak"}
          </button>

          {/* Dynamic Daily Budget Allowance */}
          <button
            type="button"
            className="status-pill allowance"
            onClick={() => setCurrentView("coach")}
            title="Dynamic spending allowance for remaining days"
          >
            💰 €{fmt(allowance.dailyAllowance)}/day {t("left") || "left"}
          </button>

          {/* Action: Receipt Scanner */}
          <button
            type="button"
            className="header-action-btn"
            onClick={() => setShowScanner(true)}
            title={t("scanReceipt")}
          >
            📸 {t("scanReceipt") || "Scan Receipt"}
          </button>

          {/* Action: Achievements */}
          <button
            type="button"
            className="header-action-btn"
            onClick={() => setShowAchievements(true)}
            title={t("achievements")}
          >
            🏆 {t("achievements") || "Badges"}
          </button>

          {/* Action: Export Statement */}
          <button
            type="button"
            className="header-action-btn"
            onClick={() => setShowExport(true)}
            title={t("exportPDF")}
          >
            📄 {t("exportPDF") || "Export"}
          </button>

          {/* Action: Notifications */}
          <button
            type="button"
            className="header-action-btn notif-btn-wrap"
            onClick={() => setShowNotifications(true)}
            title={t("notifications")}
          >
            🔔 {t("notifications") || "Alerts"}
            {unreadNotifsCount > 0 && (
              <span className="notif-badge-pill">{unreadNotifsCount}</span>
            )}
          </button>
        </div>

        {/* ── NAVIGATION TABS (with Expenses & Income Separation) ── */}
        <nav className="main-nav-tabs-bar" aria-label="Main navigation">
          {[
            { id: "dashboard", icon: "📊", label: t("dashboard") || "Dashboard" },
            { id: "expenses", icon: "💸", label: t("expensesTab") || "Expenses" },
            { id: "income", icon: "💵", label: t("incomeTab") || "Income" },
            { id: "monthly", icon: "📉", label: t("compareMonths") || "Compare Months" },
            { id: "analytics", icon: "📈", label: t("analytics") || "Analytics" },
            { id: "calendar", icon: "📅", label: t("calendar") || "Calendar" },
            { id: "goals", icon: "🎯", label: t("savingsGoals") || "Savings Goals" },
            { id: "coach", icon: "🤖", label: t("budgetCoach") || "Budget Coach" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab-btn ${currentView === tab.id ? "active" : ""}`}
              onClick={() => setCurrentView(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* ── LIVE DAILY OVERSPEND WARNING BANNER ── */}
        {dailyLimitAmount > 0 && dailySpent > dailyLimitAmount && !dismissedDailyAlert && (
          <div className="daily-overspend-banner" role="alert">
            <div className="daily-overspend-banner-left">
              <span className="daily-overspend-banner-icon">🚨</span>
              <div className="daily-overspend-banner-text">
                <div className="daily-overspend-banner-title">
                  {t("dailyLimitExceededTitle") || "Daily Limit Exceeded! 🚨"}
                </div>
                <div className="daily-overspend-banner-sub">
                  {(t("dailyBannerWarning") || "Daily limit exceeded! You've spent €{spent} today (€{over} over €{limit} limit).")
                    .replace("{spent}", fmt(dailySpent))
                    .replace("{over}", fmt(dailySpent - dailyLimitAmount))
                    .replace("{limit}", fmt(dailyLimitAmount))}
                </div>
              </div>
            </div>
            <div className="daily-overspend-banner-actions">
              <button
                type="button"
                className="daily-overspend-banner-btn"
                onClick={() => setShowNotifications(true)}
              >
                💡 {t("viewAdvice") || "View Advice"}
              </button>
              <button
                type="button"
                className="daily-overspend-banner-close"
                onClick={() => setDismissedDailyAlert(true)}
                title={t("dismiss") || "Dismiss"}
                aria-label={t("dismiss") || "Dismiss"}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            DYNAMIC VIEWS (Conditional on currentView)
            ════════════════════════════════════════════════════════════════════ */}

        {/* ── VIEW 1: DASHBOARD (Default) ─────────────────────────── */}
        {currentView === "dashboard" && (
          <>
            {/* Gauge Card with 3-Column Hero Layout: Left (Spent), Middle (Gauge SVG), Right (Income & Remaining), Bottom (Total Budget) */}
            <div className="card gauge-card">
              <div className="gauge-hero-grid">
                {/* ── LEFT SIDE: Total Spent ── */}
                <div className="gauge-side-panel gauge-side-left">
                  <div className="gauge-hero-stat-card spent-stat-card">
                    <div className="gauge-hero-icon-pill spent-pill">
                      <span>💸</span>
                    </div>
                    <span className="gauge-hero-stat-label">{t("spent") || "Total Spent"}</span>
                    <div className="gauge-hero-stat-value spent">
                      <AnimatedNumber value={totalSpent} prefix="€" decimals={2} />
                    </div>
                    <div className="gauge-hero-stat-sub">
                      {budgetAmount > 0
                        ? `${((totalSpent / budgetAmount) * 100).toFixed(0)}% ${t("budgetUsed") || "of budget used"}`
                        : t("thisMonth") || "This month"}
                    </div>
                  </div>
                </div>

                {/* ── MIDDLE: Gauge SVG ── */}
                <div className="gauge-center-col">
                  <div className="gauge-wrapper">
                    <svg viewBox="0 0 200 200">
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="12"
                        className="gauge-track"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="12"
                        strokeDasharray={`${(gaugePercentage / 100) * 502.65} 502.65`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                      />
                      <circle cx="100" cy="100" r="8" fill={gaugeColor} className="gauge-hub" />
                      <line
                        x1="100"
                        y1="100"
                        x2={100 + 60 * Math.cos((gaugeAngle * Math.PI) / 180)}
                        y2={100 + 60 * Math.sin((gaugeAngle * Math.PI) / 180)}
                        stroke={gaugeColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="gauge-needle"
                        style={{ transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                      />
                    </svg>
                    <div className="gauge-center-badge">
                      <span className="gauge-center-pct" style={{ color: gaugeColor }}>
                        {percentage.toFixed(0)}%
                      </span>
                      <span className="gauge-center-sub">{t("used") || "Used"}</span>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT SIDE: Income & Remaining ── */}
                <div className="gauge-side-panel gauge-side-right">
                  {/* Income Card */}
                  <div className="gauge-hero-stat-card income-stat-card">
                    <div className="gauge-hero-icon-pill income-pill">
                      <span>💵</span>
                    </div>
                    <div className="gauge-hero-stat-body">
                      <span className="gauge-hero-stat-label">{t("income") || "Income"}</span>
                      <div className="gauge-hero-stat-value safe">
                        <AnimatedNumber value={totalIncome} prefix="€" decimals={2} />
                      </div>
                    </div>
                  </div>

                  {/* Remaining Card */}
                  <div className="gauge-hero-stat-card remaining-stat-card">
                    <div className="gauge-hero-icon-pill remaining-pill">
                      <span>🛡️</span>
                    </div>
                    <div className="gauge-hero-stat-body">
                      <span className="gauge-hero-stat-label">{t("remaining") || "Remaining"}</span>
                      <div className={`gauge-hero-stat-value ${remaining >= 0 ? "safe" : "danger"}`}>
                        <AnimatedNumber value={Math.max(0, remaining)} prefix="€" decimals={2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── BOTTOM: Total Budget ── */}
              <div className="gauge-bottom-bar">
                <div className="gauge-total-badge">
                  <span className="gauge-total-icon">🎯</span>
                  <span className="gauge-total-title">{t("totalBudget") || "Total Budget"}:</span>
                  <span className="gauge-total-amount">
                    <AnimatedNumber value={budgetAmount} prefix="€" decimals={2} />
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Form Card with Real-Time Auto-Categorization */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3 className="chart-title" style={{ margin: 0 }}>
                  ➕ {t("addTransaction")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  style={{
                    background: "rgba(249, 115, 22, 0.15)",
                    border: "1px solid rgba(249, 115, 22, 0.4)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    color: "#fb923c",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  📸 {t("scanReceipt") || "Scan Receipt"}
                </button>
              </div>

              <form onSubmit={handleAddTransaction}>
                <div className="form-grid-2">
                  <div>
                    <input
                      className="form-input"
                      type="text"
                      placeholder={t("namePlaceholder")}
                      value={formData.name}
                      onChange={handleNameInputChange}
                    />
                    {detectedCategory && (
                      <div
                        className="autocat-live-pill"
                        style={{
                          borderColor: detectedCategory.color,
                          backgroundColor: `${detectedCategory.color}18`,
                        }}
                      >
                        <span className="autocat-pill-icon">{detectedCategory.icon || "✨"}</span>
                        <span className="autocat-pill-text">
                          {t("detectedCategory") || "Detected"}:{" "}
                          <strong style={{ color: detectedCategory.color }}>
                            {detectedCategory.category || detectedCategory.name}
                          </strong>
                        </span>
                        <span className="autocat-applied-tag">✓ Applied</span>
                      </div>
                    )}
                  </div>
                  <input
                    className="form-input"
                    type="number"
                    placeholder={t("amountPlaceholder")}
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                {/* Category Quick-Select Chips */}
                <div className="category-quick-select-wrap">
                  <div className="category-chips-header">
                    <span className="category-chips-label">🏷️ {t("selectCategory") || "Quick Categories"}:</span>
                    <span
                      className="category-active-label"
                      style={{ color: getCategoryMeta(formData.category).color }}
                    >
                      {getCategoryMeta(formData.category).icon} {formData.category}
                    </span>
                  </div>
                  <div className="category-chips-grid">
                    {STANDARD_CATEGORIES.map((cat) => {
                      const isSelected =
                        (formData.category || "").toLowerCase() === cat.name.toLowerCase();
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          className={`category-chip-btn ${isSelected ? "selected" : ""}`}
                          style={
                            isSelected
                              ? {
                                  borderColor: cat.color,
                                  backgroundColor: `${cat.color}25`,
                                  color: cat.color,
                                  boxShadow: `0 0 10px ${cat.color}40`,
                                }
                              : {}
                          }
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              category: cat.name,
                              type: cat.name === "Salary & Income" ? "INCOME" : prev.type,
                            }));
                            setDetectedCategory(cat);
                          }}
                        >
                          <span className="cat-chip-icon">{cat.icon}</span>
                          <span className="cat-chip-name">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: 12 }}>
                  <select
                    className="form-input form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="EXPENSE">💸 {t("expense")}</option>
                    <option value="INCOME">💵 {t("incomeType")}</option>
                  </select>
                  <div className="date-input-field-wrap">
                    <WheelDatePicker
                      value={formData.date}
                      onChange={(newDate) => setFormData({ ...formData, date: newDate })}
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: 10 }}>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => {
                      const catName = e.target.value;
                      setFormData({
                        ...formData,
                        category: catName,
                        type: catName === "Salary & Income" ? "INCOME" : formData.type,
                      });
                      setDetectedCategory(getCategoryMeta(catName));
                    }}
                  >
                    {STANDARD_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={t("reasonPlaceholder")}
                    value={formData.reason}
                    onChange={handleReasonInputChange}
                  />
                </div>

                <button type="submit" className="btn-submit" style={{ marginTop: 14 }}>
                  {t("submit")}
                </button>
              </form>
            </div>

            {/* Daily Budget Bar Chart Card (Last 7 Days) */}
            <div className="card daily-chart-card">
              <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h3 className="chart-title">📅 {t("dailyBarChartTitle") || t("dailyBudget")}</h3>
                  <p className="chart-subtitle">
                    {t("today")}: €<AnimatedNumber value={dailySpent} prefix="" decimals={2} /> / {t("limit")} €{fmt(dailyLimitAmount)}
                  </p>
                </div>
                <div className="chart-legend-row">
                  <span className="legend-item"><span className="legend-dot safe"></span><span className="legend-txt">Safe</span></span>
                  <span className="legend-item"><span className="legend-dot warn"></span><span className="legend-txt">Near Limit</span></span>
                  <span className="legend-item"><span className="legend-dot danger"></span><span className="legend-txt">Over</span></span>
                </div>
              </div>

              {/* 7-Day Vertical Bar Chart */}
              <div className="bars-grid-7">
                {Array.from({ length: 7 }).map((_, i) => {
                  // Rolling 7 days: 6 days ago ... today (i=6 is today)
                  const dayDate = new Date();
                  dayDate.setDate(dayDate.getDate() - (6 - i));
                  const isToday = i === 6;

                  const daySpentVal = txList
                    .filter((t) => {
                      if (!t) return false;
                      const txDate = new Date(t.dateTime || t.date || now);
                      return t.type === "EXPENSE" && txDate.toDateString() === dayDate.toDateString();
                    })
                    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

                  const isOverLimit = daySpentVal > dailyLimitAmount && dailyLimitAmount > 0;
                  const isNearLimit = !isOverLimit && dailyLimitAmount > 0 && daySpentVal >= dailyLimitAmount * 0.75;

                  // Fill percentage scaled to daily limit, capped at 100%
                  const fillPct =
                    dailyLimitAmount > 0
                      ? Math.min(Math.max((daySpentVal / dailyLimitAmount) * 100, daySpentVal > 0 ? 6 : 0), 100)
                      : 0;

                  const weekdayStr = dayDate.toLocaleDateString(locale, { weekday: "short" });
                  const dateShortStr = dayDate.toLocaleDateString(locale, { day: "numeric", month: "short" });
                  const barStatusClass = isOverLimit ? "over" : isNearLimit ? "warn" : isToday ? "today" : "normal";

                  return (
                    <div
                      key={dayDate.toISOString().slice(0, 10)}
                      className={`bar-col ${isToday ? "bar-col--today" : ""}`}
                    >
                      {/* Top floating amount */}
                      <div className="bar-top-val">
                        {daySpentVal > 0 ? `€${daySpentVal >= 100 ? Math.round(daySpentVal) : fmt(daySpentVal, 1)}` : "€0"}
                      </div>

                      {/* Bar Track & Fill */}
                      <div
                        className="bar-track"
                        title={`${dateShortStr}: €${fmt(daySpentVal)} (${dailyLimitAmount > 0 ? Math.round((daySpentVal / dailyLimitAmount) * 100) : 0}% of limit)`}
                      >
                        <div
                          className={`bar-fill ${barStatusClass}`}
                          style={{ height: `${fillPct}%` }}
                        />
                      </div>

                      {/* Day Label & Date */}
                      <div className="bar-label-group">
                        <p className={`bar-day-label ${isToday ? "today" : ""}`}>{weekdayStr}</p>
                        <span className="bar-date-sub">{dateShortStr}</span>
                        {isToday && <span className="today-badge-chip">TODAY</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="chart-caption" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                <span>── {t("dailyLimit")} €{fmt(dailyLimitAmount)} / day</span>
                <span>
                  {t("safeAllowance") || "Allowance"}:{" "}
                  <strong style={{ color: "#22c55e" }}>
                    €{fmt(Math.max(0, dailyLimitAmount - dailySpent))}
                  </strong>{" "}
                  left today
                </span>
              </div>
            </div>

            {/* Monthly Budget Bar Chart Card */}
            <div className="card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">{t("monthlyBudgetTitle")}</h3>
                  <p className="chart-subtitle">
                    {t("thisMonth")}: <AnimatedNumber value={monthlySpent} prefix="€" decimals={2} />
                  </p>
                </div>
                <button
                  type="button"
                  className="header-action-pill"
                  style={{
                    background: "rgba(139, 92, 246, 0.2)",
                    borderColor: "rgba(139, 92, 246, 0.5)",
                    color: "#c4b5fd",
                  }}
                  onClick={() => setCurrentView("monthly")}
                  title={t("compareMonths") || "Compare all months"}
                >
                  📉 {t("compareMonths") || "Compare All Months"} →
                </button>
              </div>

              <p className="monthly-caption">
                {t("budgetCap")} — <AnimatedNumber value={monthlyLimitAmount} prefix="€" decimals={2} />/{t("perMonth")}
              </p>

              <div className="bars-grid-12">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                  (month, i) => {
                    const monthNum = i;
                    const nowInstance = new Date();
                    const isCurrentMonth = monthNum === nowInstance.getMonth();

                    const monthSpentVal = txList
                      .filter((t) => {
                        if (!t) return false;
                        const txDate = new Date(t.dateTime || t.date || now);
                        return (
                          t.type === "EXPENSE" &&
                          txDate.getMonth() === monthNum &&
                          txDate.getFullYear() === nowInstance.getFullYear()
                        );
                      })
                      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

                    const isOverLimit = monthSpentVal > monthlyLimitAmount && monthlyLimitAmount > 0;
                    const isNearLimit = !isOverLimit && monthlyLimitAmount > 0 && monthSpentVal >= monthlyLimitAmount * 0.75;
                    const fillPct = Math.min(
                      monthlyLimitAmount > 0 ? Math.max((monthSpentVal / monthlyLimitAmount) * 100, monthSpentVal > 0 ? 5 : 0) : 0,
                      100
                    );

                    return (
                      <div key={month} className="bar-col">
                        <p className={`bar-month-label ${isCurrentMonth ? "current" : ""}`}>{month}</p>
                        <div className="bar-track short">
                          <div
                            className={`bar-fill short ${
                              isOverLimit ? "over" : isNearLimit ? "warn" : isCurrentMonth ? "today" : "normal"
                            }`}
                            style={{ height: `${fillPct}%` }}
                          />
                        </div>
                        <p className="bar-amount small">€{fmt(monthSpentVal, 0)}</p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Transactions List Card with Type Separation Bar */}
            <div className="card">
              <div className="tx-header-container">
                {/* Top Row: Title on Left, Type Filter on Right */}
                <div className="tx-header-top">
                  <div className="tx-title-wrapper">
                    <h3 className="chart-title" style={{ margin: 0 }}>📊 {t("transactions")}</h3>
                    <span className="tx-count-pill">{filteredTransactions.length}</span>
                  </div>

                  {/* Separation Filter Bar for Expenses and Income */}
                  <div className="type-filter-bar">
                    {[
                      { id: "ALL", icon: "🌟", label: t("allTransactions") || "All" },
                      { id: "EXPENSE", icon: "💸", label: t("expensesTab") || "Expenses" },
                      { id: "INCOME", icon: "💵", label: t("incomeTab") || "Income" },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setTypeFilter(filter.id)}
                        className={`type-filter-btn ${typeFilter === filter.id ? `active-${filter.id.toLowerCase()}` : ""}`}
                      >
                        <span className="type-filter-icon">{filter.icon}</span>
                        <span className="type-filter-label">{filter.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period filter tabs underneath */}
                <div className="tx-header-sub">
                  <div className="tx-tabs">
                    {[
                      { id: "all", label: "All Time" },
                      { id: "daily", label: t("daily") || "Daily" },
                      { id: "weekly", label: t("weekly") || "Weekly" },
                      { id: "monthly", label: t("monthly") || "Monthly" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTabMode(tab.id)}
                        className={`btn-tab ${tabMode === tab.id ? "active" : "inactive"}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Row */}
              <div className="tx-summary">
                <div>
                  <p className="tx-summary-label">{t("expense")}</p>
                  <p className="tx-summary-value expense">
                    <AnimatedNumber
                      value={filteredTransactions
                        .filter((t) => t && t.type === "EXPENSE")
                        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)}
                      prefix="€"
                      decimals={2}
                    />
                  </p>
                </div>
                <div>
                  <p className="tx-summary-label">{t("income")}</p>
                  <p className="tx-summary-value income">
                    <AnimatedNumber
                      value={filteredTransactions
                        .filter((t) => t && t.type === "INCOME")
                        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)}
                      prefix="€"
                      decimals={2}
                    />
                  </p>
                </div>
                <div>
                  <p className="tx-summary-label">{t("net")}</p>
                  <p
                    className={`tx-summary-value ${
                      filteredTransactions
                        .filter((t) => t && t.type === "INCOME")
                        .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0) >=
                      filteredTransactions
                        .filter((t) => t && t.type === "EXPENSE")
                        .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
                        ? "net-neg"
                        : "net-pos"
                    }`}
                  >
                    <AnimatedNumber
                      value={
                        filteredTransactions
                          .filter((t) => t && t.type === "INCOME")
                          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) -
                        filteredTransactions
                          .filter((t) => t && t.type === "EXPENSE")
                          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                      }
                      prefix="€"
                      decimals={2}
                    />
                  </p>
                </div>
              </div>

              {/* Transaction List with inline editing and delete */}
              <div className="tx-list">
                {filteredTransactions.length === 0 ? (
                  <p className="tx-empty">{t("noTransactions")}</p>
                ) : (
                  filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className={`tx-row ${tx.type === "EXPENSE" ? "expense" : "income"}`}
                    >
                      {editingTx?.id === tx.id ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                            width: "100%",
                          }}
                        >
                          <input
                            type="text"
                            value={editingTx.name}
                            onChange={(e) =>
                              setEditingTx({ ...editingTx, name: e.target.value })
                            }
                            style={{
                              flex: 1,
                              padding: "6px 10px",
                              background: "rgba(0,0,0,0.3)",
                              border: "1.5px solid #f97316",
                              borderRadius: 8,
                              fontSize: 13,
                            }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingTx.amount}
                            onChange={(e) =>
                              setEditingTx({ ...editingTx, amount: e.target.value })
                            }
                            style={{
                              width: 90,
                              padding: "6px 10px",
                              background: "rgba(0,0,0,0.3)",
                              border: "1.5px solid #f97316",
                              borderRadius: 8,
                              fontSize: 13,
                            }}
                          />
                          <select
                            value={editingTx.type}
                            onChange={(e) =>
                              setEditingTx({ ...editingTx, type: e.target.value })
                            }
                            style={{
                              padding: "6px 10px",
                              background: "rgba(0,0,0,0.3)",
                              border: "1.5px solid #f97316",
                              borderRadius: 8,
                              fontSize: 13,
                            }}
                          >
                            <option value="EXPENSE">💸 {t("expense")}</option>
                            <option value="INCOME">💵 {t("incomeType")}</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleEditTransaction}
                            className="primary-btn"
                            style={{
                              width: "auto",
                              margin: 0,
                              padding: "6px 14px",
                              fontSize: 12,
                            }}
                          >
                            ✓ {t("save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTx(null)}
                            className="secondary-btn"
                            style={{
                              width: "auto",
                              padding: "6px 12px",
                              fontSize: 12,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="tx-name" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span>{tx.type === "EXPENSE" ? "💸" : "💵"} {tx.name}</span>
                              <span
                                className="tx-cat-chip"
                                style={{
                                  backgroundColor: `${getCategoryMeta(tx.category).color}22`,
                                  color: getCategoryMeta(tx.category).color,
                                  borderColor: `${getCategoryMeta(tx.category).color}44`,
                                }}
                              >
                                {getCategoryMeta(tx.category).icon} {tx.category || "General"}
                              </span>
                            </div>
                            <p className="tx-date">
                              {new Date(tx.dateTime || tx.date || now).toLocaleDateString(locale, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {tx.description ? ` · ${tx.description}` : ""}
                            </p>
                          </div>
                          <div className="tx-right">
                            <p
                              className={`tx-amount ${
                                tx.type === "EXPENSE" ? "expense" : "income"
                              }`}
                            >
                              {tx.type === "EXPENSE" ? "-" : "+"}€
                              {fmt(tx.amount)}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingTx({
                                  id: tx.id,
                                  name: tx.name,
                                  amount: tx.amount,
                                  type: tx.type,
                                  category: tx.category,
                                  description: tx.description,
                                })
                              }
                              className="secondary-btn"
                              style={{ padding: "4px 8px", fontSize: 11 }}
                              title={t("edit")}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="btn-delete"
                            >
                              🗑
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* ── VIEW: DEDICATED EXPENSES VIEW ───────────────────────── */}
        {currentView === "expenses" && (
          <div className="card expense-records-view">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <h3
                  className="chart-title"
                  style={{
                    margin: 0,
                    color: "#f97316",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>💸</span>
                  <span>{t("expensesTab") || "Expense Records"}</span>
                </h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
                  All outgoing payments, purchases, and planned expenses
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setCurrentView("dashboard")}
                  style={{ width: "auto", margin: 0 }}
                >
                  ← {t("exitCalendar") || "Back to Dashboard"}
                </button>
              </div>
            </div>

            {/* Expense Stats Banner */}
            <div className="income-stats-banner">
              <div className="income-stat-card">
                <span className="income-stat-label">💸 Total Spent</span>
                <span className="income-stat-value expense">
                  <AnimatedNumber value={totalSpent} prefix="€" decimals={2} />
                </span>
              </div>
              <div className="income-stat-card">
                <span className="income-stat-label">🛍️ Transactions</span>
                <span className="income-stat-value">{expenseTxList.length}</span>
              </div>
              <div className="income-stat-card">
                <span className="income-stat-label">⚡ Average Expense</span>
                <span className="income-stat-value">
                  <AnimatedNumber value={avgExpense} prefix="€" decimals={2} />
                </span>
              </div>
              <div className="income-stat-card">
                <span className="income-stat-label">🎯 Monthly Budget</span>
                <span className="income-stat-value">
                  <AnimatedNumber value={budgetAmount} prefix="€" decimals={2} />
                </span>
              </div>
            </div>

            {/* Expense Cards Grid */}
            <h4 style={{ margin: "20px 0 12px", fontSize: 15, fontWeight: 800 }}>
              📋 {t("expensesTab") || "Expenses"} ({expenseTxList.length})
            </h4>

            {expenseTxList.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div className="empty-state-icon">💸</div>
                <p className="empty-state-text">{t("noExpensesYet")}</p>
              </div>
            ) : (
              <div className="income-cards-grid">
                {expenseTxList.map((tx) => {
                  const txDate = new Date(tx.dateTime || tx.date || now);
                  const timeStr = txDate.toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const dateStrFormatted = txDate.toLocaleDateString(locale, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const meta = getCategoryMeta(tx.category || "General");

                  return (
                    <div key={tx.id} className="income-card expense-card-border">
                      <div className="income-card-header">
                        <div className="income-card-meta">
                          <span className="income-card-icon">{meta.icon || "💸"}</span>
                          <div>
                            <h4 className="income-card-title">{tx.name}</h4>
                            <span
                              className="income-card-cat"
                              style={{
                                color: meta.color,
                                backgroundColor: `${meta.color}20`,
                                borderColor: `${meta.color}40`,
                              }}
                            >
                              {meta.icon} {tx.category || "General"}
                            </span>
                          </div>
                        </div>
                        <div className="income-card-amount expense-amount">
                          -<AnimatedNumber value={parseFloat(tx.amount || 0)} prefix="€" decimals={2} />
                        </div>
                      </div>

                      <div className="income-card-footer">
                        <div className="income-card-datetime">
                          <span className="income-time-chip">🕒 {timeStr}</span>
                          <span className="income-date-chip">📅 {dateStrFormatted}</span>
                        </div>
                        {tx.description && (
                          <p className="income-card-desc">💬 {tx.description}</p>
                        )}
                        <div className="income-card-actions">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingTx({
                                id: tx.id,
                                name: tx.name,
                                amount: tx.amount,
                                type: tx.type,
                                category: tx.category,
                                description: tx.description,
                              })
                            }
                            className="secondary-btn"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            title={t("edit")}
                          >
                            ✏️ {t("edit") || "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="btn-delete"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: DEDICATED INCOME VIEW (Cards with exact time and date) ── */}
        {currentView === "income" && (
          <div className="card income-records-view">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <h3
                  className="chart-title"
                  style={{
                    margin: 0,
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>💵</span>
                  <span>{t("incomeOverview") || "Income Records & Money Received"}</span>
                </h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
                  All incoming funds, paychecks, freelancing, dividends, and deposits
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setCurrentView("dashboard")}
                  style={{ width: "auto", margin: 0 }}
                >
                  ← {t("exitCalendar") || "Back to Dashboard"}
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      type: "INCOME",
                      category: "Salary & Income",
                    }));
                    setCurrentView("dashboard");
                  }}
                  style={{
                    width: "auto",
                    margin: 0,
                    background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  }}
                >
                  ➕ Log New Income
                </button>
              </div>
            </div>

            {/* Income Stats Banner */}
            <div className="income-stats-banner">
              <div className="income-stat-card">
                <span className="income-stat-label">💵 {t("totalIncomeReceived") || "Total Income"}</span>
                <span className="income-stat-value">
                  <AnimatedNumber value={totalIncome} prefix="€" decimals={2} />
                </span>
              </div>
              <div className="income-stat-card">
                <span className="income-stat-label">📥 {t("depositsCount") || "Deposits Recorded"}</span>
                <span className="income-stat-value">{incomeTxList.length}</span>
              </div>
              <div className="income-stat-card">
                <span className="income-stat-label">⚡ {t("avgIncome") || "Average Deposit"}</span>
                <span className="income-stat-value">
                  <AnimatedNumber value={avgIncome} prefix="€" decimals={2} />
                </span>
              </div>
              <div className="income-stat-card">
                <span className="income-stat-label">📈 {t("highestIncome") || "Highest Deposit"}</span>
                <span className="income-stat-value">
                  <AnimatedNumber value={maxIncome} prefix="€" decimals={2} />
                </span>
              </div>
            </div>

            {/* Income Cards Grid */}
            <h4 style={{ margin: "20px 0 12px", fontSize: 15, fontWeight: 800 }}>
              📋 {t("incomeTab") || "Income Transactions"} ({incomeTxList.length})
            </h4>

            {incomeTxList.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div className="empty-state-icon">💵</div>
                <p className="empty-state-text">{t("noIncomeYet")}</p>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      type: "INCOME",
                      category: "Salary & Income",
                    }));
                    setCurrentView("dashboard");
                  }}
                  style={{ width: "auto", marginTop: 12, display: "inline-block" }}
                >
                  + Add First Income
                </button>
              </div>
            ) : (
              <div className="income-cards-grid">
                {incomeTxList.map((tx) => {
                  const txDate = new Date(tx.dateTime || tx.date || now);
                  const timeStr = txDate.toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const dateStrFormatted = txDate.toLocaleDateString(locale, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const meta = getCategoryMeta(tx.category || "Salary & Income");

                  return (
                    <div key={tx.id} className="income-card">
                      <div className="income-card-header">
                        <div className="income-card-meta">
                          <span className="income-card-icon">{meta.icon || "💵"}</span>
                          <div>
                            <h4 className="income-card-title">{tx.name}</h4>
                            <span
                              className="income-card-cat"
                              style={{
                                color: meta.color,
                                backgroundColor: `${meta.color}20`,
                                borderColor: `${meta.color}40`,
                              }}
                            >
                              {meta.icon} {tx.category || "Salary & Income"}
                            </span>
                          </div>
                        </div>
                        <div className="income-card-amount">
                          +<AnimatedNumber value={parseFloat(tx.amount || 0)} prefix="€" decimals={2} />
                        </div>
                      </div>

                      <div className="income-card-footer">
                        <div className="income-card-datetime">
                          <span className="income-time-chip">🕒 {timeStr}</span>
                          <span className="income-date-chip">📅 {dateStrFormatted}</span>
                        </div>
                        {tx.description && (
                          <p className="income-card-desc">💬 {tx.description}</p>
                        )}
                        <div className="income-card-actions">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingTx({
                                id: tx.id,
                                name: tx.name,
                                amount: tx.amount,
                                type: tx.type,
                                category: tx.category,
                                description: tx.description,
                              })
                            }
                            className="secondary-btn"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            title={t("edit")}
                          >
                            ✏️ {t("edit") || "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="btn-delete"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: MONTHLY COMPARISON & BUDGET MAINTENANCE ───────── */}
        {currentView === "monthly" && (
          <MonthlyComparison
            transactions={txList}
            budgetAmount={budgetAmount}
            dailyLimit={dailyLimitAmount}
            onExit={() => setCurrentView("dashboard")}
            onApplyBudget={handleApplyRecommendedBudget}
          />
        )}

        {/* ── VIEW: ANALYTICS & CATEGORIES ─────────────────────────── */}
        {currentView === "analytics" && (
          <AnalyticsCharts transactions={txList} budgetAmount={budgetAmount} />
        )}

        {/* ── VIEW: SPENDING CALENDAR (with Exit and Month Navigation) ── */}
        {currentView === "calendar" && (
          <SpendingCalendar
            transactions={txList}
            dailyLimit={dailyLimitAmount}
            onExit={() => setCurrentView("dashboard")}
          />
        )}

        {/* ── VIEW 4: SAVINGS GOALS ───────────────────────────────── */}
        {currentView === "goals" && (
          <SavingsGoals
            userId={userId}
            goals={goals}
            onUpdateGoals={handleUpdateGoals}
          />
        )}

        {/* ── VIEW 5: BUDGET COACH ────────────────────────────────── */}
        {currentView === "coach" && (
          <BudgetCoach
            transactions={txList}
            budgetAmount={budgetAmount}
            dailyLimit={dailyLimitAmount}
            username={displayName}
          />
        )}

        {/* Footer */}
        <footer className="main-footer">
          STEVE BUDGET APPS · {new Date().getFullYear()} · PWA Ready 📱
        </footer>

        {/* Universal Multi-Device PWA Install Guide Modal */}
        <PwaInstallModal
          isOpen={showPwaModal}
          onClose={() => setShowPwaModal(false)}
          initialTab={isIos ? "ios" : isAndroid ? "android" : "auto"}
        />
      </main>
    </div>
  );
}

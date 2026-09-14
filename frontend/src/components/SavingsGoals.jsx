import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import WheelDatePicker from "./WheelDatePicker";

export default function SavingsGoals({
  userId,
  goals = [],
  onUpdateGoals,
}) {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositModalGoal, setDepositModalGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");

  const [form, setForm] = useState({
    title: "",
    targetAmount: "",
    targetDate: "",
    icon: "🎯",
    color: "#f97316",
  });

  const ICONS = ["🎯", "🏖️", "🚗", "🏠", "💻", "💍", "🛡️", "🎓", "👶", "✈️"];

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.targetAmount || parseFloat(form.targetAmount) <= 0) {
      alert("Please fill in a valid goal name and target amount.");
      return;
    }

    const newGoal = {
      id: "goal_" + Date.now(),
      title: form.title.trim(),
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: 0,
      targetDate: form.targetDate || "",
      icon: form.icon,
      color: form.color,
      createdAt: new Date().toISOString(),
    };

    const updated = [...goals, newGoal];
    localStorage.setItem(`budgetUser_goals_${userId}`, JSON.stringify(updated));
    onUpdateGoals(updated);
    setShowAddModal(false);
    setForm({ title: "", targetAmount: "", targetDate: "", icon: "🎯", color: "#f97316" });
  };

  const handleAddDeposit = (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0 || !depositModalGoal) return;

    const updated = goals.map((g) => {
      if (g.id === depositModalGoal.id) {
        return {
          ...g,
          currentAmount: parseFloat((g.currentAmount + amount).toFixed(2)),
        };
      }
      return g;
    });

    localStorage.setItem(`budgetUser_goals_${userId}`, JSON.stringify(updated));
    onUpdateGoals(updated);
    setDepositModalGoal(null);
    setDepositAmount("");
  };

  const handleDeleteGoal = (goalId) => {
    if (window.confirm("Are you sure you want to delete this savings goal?")) {
      const updated = goals.filter((g) => g.id !== goalId);
      localStorage.setItem(`budgetUser_goals_${userId}`, JSON.stringify(updated));
      onUpdateGoals(updated);
    }
  };

  return (
    <div className="card goals-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 className="chart-title" style={{ margin: 0 }}>
            🎯 {t("savingsGoalsTitle")}
          </h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
            Track target milestones and build financial security
          </p>
        </div>
        <button
          type="button"
          className="secondary-btn"
          style={{ padding: "8px 14px", fontSize: 12 }}
          onClick={() => setShowAddModal(true)}
        >
          ➕ {t("createGoal")}
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <p className="empty-state-text">{t("emptyGoals")}</p>
          <button
            type="button"
            className="btn-submit"
            style={{ maxWidth: 220, margin: "14px auto 0" }}
            onClick={() => setShowAddModal(true)}
          >
            ➕ {t("createGoal")}
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            return (
              <div key={goal.id} className={`goal-card ${isCompleted ? "goal-card--completed" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="goal-icon">{goal.icon}</span>
                    <div>
                      <h4 className="goal-title">{goal.title}</h4>
                      {goal.targetDate && (
                        <p className="goal-date">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-delete"
                    style={{ padding: "4px 8px" }}
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    ✕
                  </button>
                </div>

                <div className="goal-amounts">
                  <span className="goal-saved">€{goal.currentAmount.toFixed(2)}</span>
                  <span className="goal-target">/ €{goal.targetAmount.toFixed(2)}</span>
                  <span className="goal-pct">{pct}%</span>
                </div>

                <div className="goal-progress-bar">
                  <div
                    className="goal-progress-fill"
                    style={{ width: `${pct}%`, background: isCompleted ? "#22c55e" : goal.color }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                  {isCompleted ? (
                    <span className="goal-status-tag completed">🎉 Goal Achieved!</span>
                  ) : (
                    <span className="goal-status-tag pending">€{(goal.targetAmount - goal.currentAmount).toFixed(2)} remaining</span>
                  )}
                  <button
                    type="button"
                    className="goal-deposit-btn"
                    onClick={() => setDepositModalGoal(goal)}
                  >
                    💰 {t("depositFunds")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      {showAddModal && (
        <div className="bs-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="bs-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, color: "#f97316" }}>
              🎯 {t("createGoal")}
            </h2>
            <form onSubmit={handleCreateGoal}>
              <label className="auth-label">{t("goalNamePlaceholder")}</label>
              <input
                className="bs-form-input"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Vacation Fund"
                style={{ marginBottom: 12 }}
              />

              <label className="auth-label">{t("targetAmountPlaceholder")}</label>
              <input
                className="bs-form-input"
                type="number"
                step="1"
                min="1"
                required
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                placeholder="e.g. 1500"
                style={{ marginBottom: 12 }}
              />

              <div style={{ marginBottom: 14 }}>
                <WheelDatePicker
                  label={t("targetDate")}
                  value={form.targetDate}
                  onChange={(newDate) => setForm({ ...form, targetDate: newDate })}
                />
              </div>

              <label className="auth-label">Choose Icon</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    className={`icon-picker-btn ${form.icon === ic ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, icon: ic })}
                  >
                    {ic}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn-submit" style={{ flex: 1 }}>
                  💾 {t("save")}
                </button>
                <button type="button" className="secondary-btn" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT FUNDS MODAL */}
      {depositModalGoal && (
        <div className="bs-modal-backdrop" onClick={() => setDepositModalGoal(null)}>
          <div className="bs-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 10, color: "#22c55e" }}>
              💰 {t("depositFunds")}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
              {depositModalGoal.title} (Current: €{depositModalGoal.currentAmount.toFixed(2)})
            </p>
            <form onSubmit={handleAddDeposit}>
              <label className="auth-label">{t("depositPlaceholder")}</label>
              <input
                className="bs-form-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 50.00"
                style={{ marginBottom: 20 }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn-submit" style={{ flex: 1 }}>
                  ✅ Add Deposit
                </button>
                <button type="button" className="secondary-btn" style={{ flex: 1 }} onClick={() => setDepositModalGoal(null)}>
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import { analyzeFinances } from "../utils/aiCoach";
import AnimatedNumber from "./AnimatedNumber";

export default function BudgetCoach({
  transactions = [],
  budgetAmount = 1000,
  dailyLimit = 35,
  username = "User",
}) {
  const { t } = useLanguage();
  const [activePrompt, setActivePrompt] = useState(null);

  const analytics = analyzeFinances({
    transactions,
    monthlyBudget: budgetAmount,
    dailyLimit,
  });

  const QUICK_QUESTIONS = [
    { id: "forecast", label: "📈 Am I on track this month?", answer: analytics.isLikelyToExceed ? `⚠️ You are currently burning €${analytics.avgDailyBurn}/day. At this pace, you will reach €${analytics.projectedMonthEndSpend} by month-end, exceeding your budget by €${analytics.projectedDifference}. Try sticking to €${analytics.dynamicDailyBudget}/day for the rest of the month!` : `🎉 Excellent work, ${username}! You're spending €${analytics.avgDailyBurn}/day on average. You are projected to finish the month at €${analytics.projectedMonthEndSpend}, giving you €${analytics.projectedDifference} in surplus savings!` },
    { id: "top_spend", label: "🍔 Where is my money going?", answer: analytics.topCategory.amount > 0 ? `Your top expense category is ${analytics.topCategory.category}, accounting for ${analytics.topCategory.percentage}% of your spending (€${analytics.topCategory.amount}).` : "You haven't logged enough categorized transactions yet this month." },
    { id: "daily_power", label: "💰 What can I safely spend today?", answer: `Your dynamic daily spending power is €${analytics.dynamicDailyBudget}/day across the remaining ${analytics.daysRemaining} days of this month.` },
    { id: "savings_tip", label: "💡 How can I save 15% more?", answer: `If you trim 15% from ${analytics.topCategory.category || 'discretionary purchases'}, you'll keep an extra €${(analytics.totalSpent * 0.15).toFixed(2)} in your bank account this month!` },
  ];

  return (
    <div className="card coach-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="coach-avatar">🤖</div>
          <div>
            <h3 className="chart-title" style={{ margin: 0 }}>
              {t("aiCoach")} · Steve Assistant
            </h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "2px 0 0" }}>
              Intelligent burn-rate forecasting & personal advice
            </p>
          </div>
        </div>

        {analytics.isLikelyToExceed && (
          <span className="coach-alert-badge">
            ⚠️ Overrun Risk
          </span>
        )}
      </div>

      {/* Burn-rate stats banner */}
      <div className="coach-stats-banner">
        <div className="coach-stat-col">
          <span className="coach-stat-lbl">{t("burnRate")}</span>
          <span className="coach-stat-val">
            <AnimatedNumber value={analytics.avgDailyBurn} prefix="€" decimals={2} /> <small>/day</small>
          </span>
        </div>
        <div className="coach-stat-col">
          <span className="coach-stat-lbl">{t("projectedSpend")}</span>
          <span className={`coach-stat-val ${analytics.isLikelyToExceed ? "danger" : "safe"}`}>
            <AnimatedNumber value={analytics.projectedMonthEndSpend} prefix="€" decimals={2} />
          </span>
        </div>
        <div className="coach-stat-col">
          <span className="coach-stat-lbl">{t("dailySpendingPower")}</span>
          <span className="coach-stat-val dynamic">
            <AnimatedNumber value={analytics.dynamicDailyBudget} prefix="€" decimals={2} /> <small>/day</small>
          </span>
        </div>
      </div>

      {/* Key Recommendation Alert Card */}
      {analytics.tips.map((tip, idx) => (
        <div key={idx} className={`coach-tip-card coach-tip--${tip.type}`}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{tip.icon}</span>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{tip.title}</h4>
              <p style={{ margin: "4px 0 6px", fontSize: 12, opacity: 0.9 }}>{tip.text}</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#f97316" }}>💡 {tip.action}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Quick Prompt Chips */}
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
          {t("askCoach")}
        </p>
        <div className="coach-prompts-grid">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q.id}
              type="button"
              className={`coach-prompt-btn ${activePrompt?.id === q.id ? "active" : ""}`}
              onClick={() => setActivePrompt(activePrompt?.id === q.id ? null : q)}
            >
              {q.label}
            </button>
          ))}
        </div>

        {activePrompt && (
          <div className="coach-answer-box">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>🤖</span>
              <strong style={{ fontSize: 13, color: "#f97316" }}>Coach Response:</strong>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              {activePrompt.answer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


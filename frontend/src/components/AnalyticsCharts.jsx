import { useLanguage } from "../LanguageContext";
import { getCategoryMeta } from "../utils/autoCategorizer";
import AnimatedNumber from "./AnimatedNumber";

export default function AnalyticsCharts({
  transactions = [],
  budgetAmount = 1000,
}) {
  const { t } = useLanguage();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTx = transactions.filter((tx) => {
    const d = new Date(tx.dateTime || tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = thisMonthTx
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const categoryMap = {};
  thisMonthTx
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      const cat = t.category || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(t.amount || 0);
    });

  const categoryList = Object.entries(categoryMap)
    .map(([cat, amount]) => {
      const meta = getCategoryMeta(cat);
      return {
        name: cat,
        amount,
        color: meta.color,
        icon: meta.icon,
        pct: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="card analytics-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h3 className="chart-title" style={{ margin: 0 }}>
            📊 {t("categoryBreakdown")}
          </h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
            Monthly distribution across spending categories
          </p>
        </div>
        <span style={{ fontSize: 13, fontWeight: 900, color: "#f97316" }}>
          Total: <AnimatedNumber value={totalSpent} prefix="€" decimals={2} />
          {budgetAmount > 0 ? (
            <> / <AnimatedNumber value={budgetAmount} prefix="€" decimals={2} /></>
          ) : (
            ""
          )}
        </span>
      </div>

      {categoryList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-text">No expenses recorded for this month yet.</p>
        </div>
      ) : (
        <div>
          {/* Multi-segment Progress Bar */}
          <div className="category-stacked-bar">
            {categoryList.map((c) => (
              <div
                key={c.name}
                className="category-bar-segment"
                style={{ width: `${c.pct}%`, background: c.color }}
                title={`${c.name}: €${c.amount.toFixed(2)} (${c.pct}%)`}
              />
            ))}
          </div>

          {/* Category List */}
          <div className="category-list-grid">
            {categoryList.map((c) => (
              <div key={c.name} className="category-item-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="cat-item-icon" style={{ background: `${c.color}22`, border: `1px solid ${c.color}44` }}>
                    {c.icon}
                  </span>
                  <div>
                    <h5 className="cat-item-title">{c.name}</h5>
                    <span className="cat-item-pct">{c.pct}% of spending</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="cat-item-val" style={{ color: c.color }}>
                    <AnimatedNumber value={c.amount} prefix="€" decimals={2} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

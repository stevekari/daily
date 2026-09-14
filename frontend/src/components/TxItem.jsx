import React, { useEffect, useState } from "react";

export default function TxItem({ tx, onDelete, index }) {
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVis(true), index * 70);
    return () => clearTimeout(t);
  }, [index]);

  const d = new Date(tx.dateTime);
  const label = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;

  const isIncome = tx.type === "INCOME";

  // Logic for dynamic class names
  const itemClasses = `tx-item ${isIncome ? "tx-income" : "tx-expense"} ${vis ? "tx-visible" : "tx-hidden"}`;
  const colorClass = isIncome ? "income-text" : "expense-text";

  return (
    <div className={itemClasses}>
      <span className={`icon-marker ${colorClass}`}>✦</span>

      <div className="content-area">
        <div className="tx-title">{tx.name}</div>
        <div className="tx-date">{label}</div>
      </div>

      <span className={`amount ${colorClass}`}>
        {isIncome ? "+" : "-"}€{Number(tx.amount).toFixed(2)}
      </span>

      <button className="delete-btn" onClick={() => onDelete(tx.id)}>
        ×
      </button>
    </div>
  );
}

import { getBudgetGrade } from "./monthlyAnalytics";

/**
 * Statement Export Utilities: CSV & Printable PDF Statement
 */

export function exportTransactionsToCSV(transactions = [], username = "User") {
  if (!transactions || transactions.length === 0) {
    alert("No transactions available to export.");
    return;
  }

  const headers = ["ID", "Name", "Type", "Category", "Amount (€)", "Date & Time", "Notes"];
  
  const rows = transactions.map((t) => [
    t.id || "",
    `"${(t.name || "").replace(/"/g, '""')}"`,
    t.type || "EXPENSE",
    `"${(t.category || "General").replace(/"/g, '""')}"`,
    parseFloat(t.amount || 0).toFixed(2),
    t.dateTime || "",
    `"${(t.description || t.reason || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `budget_statement_${username}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printFinancialReport({
  username = "User",
  budgetAmount = 0,
  totalSpent = 0,
  totalIncome = 0,
  transactions = [],
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate the printable statement.");
    return;
  }

  const dateStr = new Date().toLocaleDateString();
  const remaining = budgetAmount - totalSpent;
  const pct = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
  const gradeInfo = getBudgetGrade(pct, { totalExpense: totalSpent, limit: budgetAmount, netSavings: totalIncome - totalSpent });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Budget Pro Statement - ${username}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: 900; color: #ea580c; }
          .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
          .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .stat-val { font-size: 18px; font-weight: 900; margin-top: 4px; }
          .performance-banner { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 14px 18px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .performance-title { font-size: 14px; font-weight: 800; color: #15803d; }
          .performance-stars { font-size: 16px; color: #eab308; letter-spacing: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 12px; border-bottom: 2px solid #cbd5e1; }
          td { padding: 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
          .expense { color: #dc2626; font-weight: bold; }
          .income { color: #16a34a; font-weight: bold; }
          .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">💰 BUDGET PRO FINANCIAL STATEMENT</div>
            <div style="color: #64748b; font-size: 13px; margin-top: 4px;">Account: ${username}</div>
          </div>
          <div style="text-align: right; font-size: 13px; color: #64748b;">
            <div>Generated: ${dateStr}</div>
            <div>Status: Active</div>
          </div>
        </div>

        <div class="performance-banner">
          <div>
            <div class="performance-title">⭐ MONTH PERFORMANCE: ${gradeInfo.tierIcon} ${gradeInfo.tier.toUpperCase()} (${gradeInfo.grade})</div>
            <div style="font-size: 12px; color: #475569; margin-top: 3px;">${gradeInfo.feedback}</div>
          </div>
          <div style="text-align: right;">
            <div class="performance-stars">${gradeInfo.stars > 0 ? "★".repeat(gradeInfo.stars) : "—"}</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 700;">${gradeInfo.stars}/5 Stars</div>
          </div>
        </div>

        <div class="stats">
          <div class="stat-box">
            <div class="stat-label">Total Budget</div>
            <div class="stat-val" style="color: #ea580c;">€${budgetAmount.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Spent</div>
            <div class="stat-val" style="color: #dc2626;">€${totalSpent.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Income</div>
            <div class="stat-val" style="color: #16a34a;">€${totalIncome.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Remaining Balance</div>
            <div class="stat-val" style="color: ${remaining >= 0 ? '#16a34a' : '#dc2626'};">€${remaining.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Budget Used</div>
            <div class="stat-val" style="color: ${gradeInfo.color};">${pct.toFixed(0)}%</div>
          </div>
        </div>

        <h3>Itemized Ledger (${transactions.length} Records)</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map((t) => `
              <tr>
                <td>${t.dateTime ? new Date(t.dateTime).toLocaleDateString() : 'N/A'}</td>
                <td><strong>${t.name}</strong> ${t.description ? `<br><small style="color:#64748b">${t.description}</small>` : ''}</td>
                <td>${t.category || 'General'}</td>
                <td>${t.type || 'EXPENSE'}</td>
                <td class="${t.type === 'INCOME' ? 'income' : 'expense'}">${t.type === 'INCOME' ? '+' : '-'}€${parseFloat(t.amount || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by Steve Budget Pro · Personal Finance Management System
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}


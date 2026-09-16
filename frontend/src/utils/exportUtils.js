import { getBudgetGrade } from "./monthlyAnalytics";
import { generateSmartInsights } from "./smartInsights";

/**
 * Statement Export & Data Portability Utilities
 * Supports PDF/Printable statements, CSV exports, complete JSON data backups,
 * and multi-format transaction imports (JSON/CSV).
 */

/**
 * Export Transactions to CSV file
 */
export function exportTransactionsToCSV(transactions = [], username = "User", currencySymbol = "€") {
  if (!transactions || transactions.length === 0) {
    alert("No transactions available to export.");
    return;
  }

  const headers = ["ID", "Name", "Type", "Category", `Amount (${currencySymbol})`, "Date & Time", "Notes"];

  const rows = transactions.map((t) => [
    t.id || "",
    `"${(t.name || "").replace(/"/g, '""')}"`,
    t.type || "EXPENSE",
    `"${(t.category || "General").replace(/"/g, '""')}"`,
    parseFloat(t.amount || 0).toFixed(2),
    t.dateTime || t.date || "",
    `"${(t.description || t.reason || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `stevebudget_transactions_${username}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export complete JSON Backup
 */
export function exportBackupJSON({
  userId,
  username = "User",
  budgetAmount = 0,
  dailyLimit = 0,
  currencySymbol = "€",
  transactions = [],
  goals = [],
}) {
  const payload = {
    appName: "Steve Budget Pro",
    version: "2.0.0",
    exportDate: new Date().toISOString(),
    user: {
      userId,
      username,
    },
    settings: {
      budgetAmount: parseFloat(budgetAmount) || 0,
      dailyLimit: parseFloat(dailyLimit) || 0,
      currencySymbol: currencySymbol || "€",
    },
    transactions: Array.isArray(transactions) ? transactions : [],
    goals: Array.isArray(goals) ? goals : [],
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `stevebudget_backup_${username}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse and validate uploaded import file (JSON or CSV)
 */
export async function parseImportFile(file) {
  if (!file) throw new Error("No file selected for import.");

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".json")) {
    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON format in uploaded file.");
    }

    let txs = [];
    if (Array.isArray(parsed)) {
      txs = parsed;
    } else if (parsed && Array.isArray(parsed.transactions)) {
      txs = parsed.transactions;
    } else {
      throw new Error("Could not find transactions array in the JSON file.");
    }

    const cleanTxs = txs
      .filter((t) => t && (t.name || t.amount))
      .map((t, i) => ({
        id: t.id || `import_${Date.now()}_${i}`,
        name: String(t.name || "Imported Item").trim(),
        amount: Math.abs(parseFloat(t.amount) || 0),
        type: t.type === "INCOME" ? "INCOME" : "EXPENSE",
        category: t.category || "General",
        dateTime: t.dateTime || t.date || new Date().toISOString(),
        reason: t.reason || t.description || "Imported from JSON backup",
      }));

    return {
      type: "JSON",
      count: cleanTxs.length,
      transactions: cleanTxs,
      settings: parsed.settings || null,
      goals: parsed.goals || [],
    };
  }

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("CSV file must have a header row and at least 1 data row.");
    }

    const header = lines[0].toLowerCase();
    const rows = lines.slice(1);

    const cleanTxs = [];
    for (let i = 0; i < rows.length; i++) {
      // Regex CSV splitter handling quoted values
      const cols = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rows[i].split(",");
      if (!cols || cols.length < 2) continue;

      const unquote = (val) => (val ? val.replace(/^"|"$/g, "").replace(/""/g, '"').trim() : "");

      // Common column guessing
      const name = unquote(cols[1]) || unquote(cols[0]) || `Item ${i + 1}`;
      const type = unquote(cols[2]).toUpperCase() === "INCOME" ? "INCOME" : "EXPENSE";
      const category = unquote(cols[3]) || "General";
      const amount = Math.abs(parseFloat(unquote(cols[4]) || unquote(cols[1]) || "0")) || 0;
      const dateTime = unquote(cols[5]) || new Date().toISOString();
      const reason = unquote(cols[6]) || "Imported from CSV";

      if (amount > 0 || name) {
        cleanTxs.push({
          id: `import_csv_${Date.now()}_${i}`,
          name,
          amount,
          type,
          category,
          dateTime,
          reason,
        });
      }
    }

    return {
      type: "CSV",
      count: cleanTxs.length,
      transactions: cleanTxs,
      settings: null,
      goals: [],
    };
  }

  throw new Error("Unsupported file type. Please upload a .json or .csv file.");
}

/**
 * Printable / PDF Monthly Financial Report (Executive Recap)
 */
export function printMonthlyFinancialReport({
  username = "User",
  budgetAmount = 0,
  dailyLimit = 0,
  currencySymbol = "€",
  transactions = [],
  targetDate = new Date(),
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to open the Printable Monthly Report.");
    return;
  }

  const dateObj = targetDate instanceof Date && !isNaN(targetDate) ? targetDate : new Date();
  const monthName = dateObj.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  const yearStr = dateObj.getFullYear();

  const insightsData = generateSmartInsights({
    transactions,
    monthlyBudget: budgetAmount,
    dailyLimit,
    currencySymbol,
    targetDate: dateObj,
  });

  const {
    currentIncome,
    currentExpenses,
    netSavings,
    savingsRate,
    categories,
    momPctChange,
    momDiff,
    budgetUsedPct,
    insights,
  } = insightsData;

  const topCategories = categories.slice(0, 4);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Steve Budget Pro - ${monthName} ${yearStr} Report</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .report-card {
            border: 2px solid #ea580c;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.06);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 900;
            color: #ea580c;
            letter-spacing: 1px;
          }
          .report-subtitle {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
          }
          .report-tag {
            background: #fff7ed;
            color: #ea580c;
            font-weight: 800;
            font-size: 13px;
            padding: 6px 14px;
            border-radius: 999px;
            border: 1px solid #fdba74;
          }
          .divider {
            border: 0;
            height: 1px;
            background: #e2e8f0;
            margin: 24px 0;
          }
          .section-title {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
            color: #475569;
            text-transform: uppercase;
            margin-bottom: 16px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .stat-tile {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
          }
          .stat-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
          }
          .stat-value {
            font-size: 20px;
            font-weight: 900;
            margin-top: 6px;
          }
          .stat-value.income { color: #16a34a; }
          .stat-value.expense { color: #dc2626; }
          .stat-value.savings { color: #2563eb; }
          .stat-value.rate { color: #ea580c; }
          .category-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .cat-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .cat-left {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 13px;
          }
          .cat-bar-wrap {
            flex: 1;
            margin: 0 20px;
            background: #e2e8f0;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
          }
          .cat-bar-fill {
            height: 100%;
            background: #ea580c;
            border-radius: 4px;
          }
          .cat-amount {
            font-weight: 800;
            font-size: 13px;
          }
          .insights-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            padding: 16px;
          }
          .insight-item {
            font-size: 13px;
            color: #1e3a8a;
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
          }
          .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="report-card">
          <div class="header">
            <div>
              <div class="brand-title">STEVE BUDGET PRO</div>
              <div class="report-subtitle">Monthly Financial Recap · Account: <strong>${username}</strong></div>
            </div>
            <div class="report-tag">${monthName} ${yearStr}</div>
          </div>

          <div class="section-title">Your Financial Summary</div>
          <div class="summary-grid">
            <div class="stat-tile">
              <div class="stat-label">💰 Income</div>
              <div class="stat-value income">${currencySymbol}${currentIncome.toFixed(0)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-label">💸 Expenses</div>
              <div class="stat-value expense">${currencySymbol}${currentExpenses.toFixed(0)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-label">💎 Saved</div>
              <div class="stat-value savings">${currencySymbol}${netSavings.toFixed(0)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-label">🎯 Savings Rate</div>
              <div class="stat-value rate">${savingsRate}%</div>
            </div>
          </div>

          <hr class="divider">

          <div class="section-title">Top Spending Categories</div>
          <div class="category-list">
            ${topCategories.length > 0 ? topCategories.map((c) => `
              <div class="cat-row">
                <div class="cat-left">
                  <span>${c.icon || "🏷️"}</span>
                  <span>${c.name}</span>
                </div>
                <div class="cat-bar-wrap">
                  <div class="cat-bar-fill" style="width: ${Math.min(100, Math.max(5, c.pct))}%; background-color: ${c.color || '#ea580c'};"></div>
                </div>
                <div class="cat-amount">${currencySymbol}${c.amount.toFixed(2)} (${c.pct}%)</div>
              </div>
            `).join("") : `<div style="color: #94a3b8; font-style: italic; font-size: 13px;">No expense categories recorded this month.</div>`}
          </div>

          <hr class="divider">

          <div class="section-title">Executive Insights & Trends</div>
          <div class="insights-box">
            ${momPctChange !== 0 ? `
              <div class="insight-item">
                <span>📈</span>
                <div>${momPctChange < 0 ? `Your spending <strong>decreased by ${Math.abs(momPctChange).toFixed(1)}%</strong> (${currencySymbol}${Math.abs(momDiff).toFixed(2)}) compared to last month.` : `Your spending <strong>increased by ${momPctChange.toFixed(1)}%</strong> compared to last month.`}</div>
              </div>
            ` : ""}
            <div class="insight-item">
              <span>🎯</span>
              <div>${budgetUsedPct <= 100 ? `You used <strong>${budgetUsedPct.toFixed(0)}%</strong> of your monthly limit and remained on track to achieve your savings goal.` : `You reached <strong>${budgetUsedPct.toFixed(0)}%</strong> of your monthly limit.`}</div>
            </div>
            ${insights.slice(0, 2).map((ins) => `
              <div class="insight-item">
                <span>${ins.icon}</span>
                <div>${ins.description}</div>
              </div>
            `).join("")}
          </div>

          <div class="footer">
            Generated by Steve Budget Pro · Personal Finance Management System · ${new Date().toLocaleDateString()}
          </div>
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

/**
 * Backward compatible alias for printMonthlyFinancialReport
 */
export const printFinancialReport = printMonthlyFinancialReport;


import { useLanguage } from "../LanguageContext";
import { exportTransactionsToCSV, printFinancialReport } from "../utils/exportUtils";

export default function ExportReportModal({
  isOpen,
  onClose,
  username = "User",
  budgetAmount = 0,
  totalSpent = 0,
  totalIncome = 0,
  transactions = [],
  onExportSuccess,
}) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const handleExportCSV = () => {
    exportTransactionsToCSV(transactions, username);
    if (onExportSuccess) onExportSuccess();
  };

  const handlePrintPDF = () => {
    printFinancialReport({
      username,
      budgetAmount,
      totalSpent,
      totalIncome,
      transactions,
    });
    if (onExportSuccess) onExportSuccess();
  };

  return (
    <div className="bs-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bs-modal export-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#f97316", margin: 0 }}>
            📄 {t("exportStatement")}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
          Export your complete budget transactions, categories, and balance sheet.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            className="btn-submit export-action-btn"
            onClick={handleExportCSV}
          >
            📊 {t("downloadCSV")}
          </button>

          <button
            type="button"
            className="secondary-btn export-action-btn"
            onClick={handlePrintPDF}
          >
            🖨️ {t("printStatement")}
          </button>
        </div>

        <button
          type="button"
          className="secondary-btn"
          style={{ width: "100%", marginTop: 16 }}
          onClick={onClose}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}


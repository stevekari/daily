import { useState, useRef } from "react";
import { useLanguage } from "../LanguageContext";
import { parseImportFile } from "../utils/exportUtils";

export default function DataImportModal({
  isOpen,
  onClose,
  onImportTransactions,
  currencySymbol = "€",
}) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setParsing(true);
    setImportResult(null);

    try {
      const result = await parseImportFile(file);
      if (!result.transactions || result.transactions.length === 0) {
        throw new Error("No valid transactions found in this file.");
      }
      setImportResult(result);
    } catch (err) {
      setError(err.message || "Failed to parse import file.");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importResult || !importResult.transactions) return;
    onImportTransactions(importResult.transactions);
    onClose();
    setImportResult(null);
  };

  return (
    <div className="bs-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bs-modal import-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>📥</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#f97316" }}>
                Import Financial Data
              </h2>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
                Upload a JSON backup or CSV spreadsheet
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fca5a5",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Upload Dropzone */}
        {!importResult ? (
          <div
            className="receipt-dropzone"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: "pointer", padding: "28px 16px" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,text/csv,application/json"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div className="dropzone-icon" style={{ fontSize: 38 }}>📁</div>
            <p className="dropzone-text" style={{ fontSize: 13, fontWeight: 800, margin: "10px 0 4px" }}>
              Choose a .JSON or .CSV File
            </p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
              Supports Steve Budget JSON backups and CSV exports
            </p>
            {parsing && (
              <p style={{ fontSize: 12, color: "#fb923c", fontWeight: 800, marginTop: 10 }}>
                ⏳ Parsing file...
              </p>
            )}
          </div>
        ) : (
          <div>
            {/* Preview Card */}
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#10b981" }}>
                  ✓ Found {importResult.count} Records ({importResult.type})
                </span>
                <button
                  type="button"
                  onClick={() => { setImportResult(null); setError(""); }}
                  style={{ background: "transparent", border: 0, color: "#f97316", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Choose Another
                </button>
              </div>

              {/* Preview items list */}
              <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {importResult.transactions.slice(0, 8).map((tx, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 10px",
                      background: "rgba(0, 0, 0, 0.2)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <strong>{tx.name}</strong>
                      <span style={{ color: "#94a3b8", marginLeft: 6 }}>· {t(tx.category || "General")}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: tx.type === "INCOME" ? "#10b981" : "#ef4444" }}>
                      {tx.type === "INCOME" ? "+" : "-"}{currencySymbol}{tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              {importResult.count > 8 && (
                <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: "8px 0 0" }}>
                  + {importResult.count - 8} more transactions ready to import
                </p>
              )}
            </div>

            {/* Confirm button */}
            <button
              type="button"
              className="btn-submit"
              onClick={handleConfirmAdd || handleConfirmImport}
              style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 800 }}
            >
              📥 Import {importResult.count} Transactions
            </button>
          </div>
        )}

        <button
          type="button"
          className="secondary-btn"
          onClick={onClose}
          style={{ width: "100%", marginTop: 12 }}
        >
          {t("cancel") || "Cancel"}
        </button>
      </div>
    </div>
  );
}


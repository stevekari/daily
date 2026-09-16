import { useState, useRef } from "react";
import { useLanguage } from "../LanguageContext";
import { parseReceiptImage } from "../utils/receiptParser";
import { STANDARD_CATEGORIES } from "../utils/autoCategorizer";

export default function ReceiptScannerModal({
  isOpen,
  onClose,
  onAddTransaction,
  currencySymbol = "€",
}) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);
    setScannedData(null);
    setIsEditing(false);

    try {
      const result = await parseReceiptImage(file);
      setScannedData(result);
    } catch (err) {
      console.error("Scanning failed:", err);
      alert("Failed to scan receipt image.");
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!scannedData) return;

    onAddTransaction({
      name: scannedData.merchant || "Scanned Receipt",
      amount: scannedData.amount || 0,
      type: "EXPENSE",
      category: scannedData.category || "General",
      dateTime: scannedData.date || new Date().toISOString(),
      reason: `Scanned Receipt (${(scannedData.confidence * 100).toFixed(0)}% OCR match)`,
    });

    onClose();
    setScannedData(null);
    setPreviewUrl(null);
    setIsEditing(false);
  };

  return (
    <div className="bs-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bs-modal receipt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>📷</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#f97316", margin: 0 }}>
                {t("receiptScannerTitle") || "Scan Receipt"}
              </h2>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>
                Extract vendor, amount, date & auto-categorize
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

        {/* Upload Dropzone */}
        {!previewUrl ? (
          <div
            className="receipt-dropzone"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: "pointer", padding: "28px 16px" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div className="dropzone-icon" style={{ fontSize: 38 }}>🧾</div>
            <p className="dropzone-text" style={{ fontSize: 13, fontWeight: 800, margin: "10px 0 4px" }}>
              {t("dragDropReceipt") || "Take photo or upload receipt image"}
            </p>
            <span className="dropzone-btn" style={{ fontSize: 12, padding: "6px 14px" }}>
              📁 Browse Photo / Camera
            </span>
          </div>
        ) : (
          <div>
            {/* Image Preview */}
            <div className="receipt-preview-wrap" style={{ position: "relative", maxHeight: 180, overflow: "hidden", borderRadius: 12, marginBottom: 14 }}>
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="receipt-preview-img"
                style={{ width: "100%", height: 180, objectFit: "cover" }}
              />
              {scanning && (
                <div className="receipt-scanning-overlay">
                  <div className="scan-laser-line" />
                  <p style={{ fontWeight: 800, fontSize: 13, margin: "12px 0 0", color: "#fff" }}>
                    🤖 {t("scanningReceipt") || "Analyzing receipt with OCR..."}
                  </p>
                </div>
              )}
            </div>

            {/* Extracted Data Card */}
            {scannedData && (
              <div className="scanned-result-card" style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 12,
                padding: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#10b981", textTransform: "uppercase" }}>
                    ✓ Extracted ({(scannedData.confidence * 100).toFixed(0)}% Confidence)
                  </span>
                  <button
                    type="button"
                    style={{ background: "transparent", border: 0, color: "#f97316", fontSize: 11, cursor: "pointer", fontWeight: 700 }}
                    onClick={() => { setPreviewUrl(null); setScannedData(null); setIsEditing(false); }}
                  >
                    Scan Another
                  </button>
                </div>

                {/* Form fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="scanned-field-row">
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{t("merchant") || "Merchant / Store"}:</label>
                    <input
                      className="bs-form-input"
                      value={scannedData.merchant}
                      onChange={(e) => setScannedData({ ...scannedData, merchant: e.target.value })}
                      placeholder="e.g. Mercadona, Starbucks"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="scanned-field-row">
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>Total ({currencySymbol}):</label>
                      <input
                        className="bs-form-input"
                        type="number"
                        step="0.01"
                        value={scannedData.amount}
                        onChange={(e) => setScannedData({ ...scannedData, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="scanned-field-row">
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>Date:</label>
                      <input
                        className="bs-form-input"
                        type="datetime-local"
                        value={scannedData.date ? scannedData.date.slice(0, 16) : new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setScannedData({ ...scannedData, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="scanned-field-row">
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>Suggested Category:</label>
                    <select
                      className="bs-form-input"
                      value={scannedData.category}
                      onChange={(e) => setScannedData({ ...scannedData, category: e.target.value })}
                    >
                      {STANDARD_CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Verification Actions: [ Edit ] and [ Save ] */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setIsEditing(!isEditing)}
                    style={{ fontSize: 12, fontWeight: 800 }}
                  >
                    ✏️ {isEditing ? "Done Editing" : "Edit"}
                  </button>
                  <button
                    type="button"
                    className="btn-submit"
                    onClick={handleConfirmAdd}
                    style={{ margin: 0, fontSize: 13, fontWeight: 800 }}
                  >
                    💾 Save Transaction
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="secondary-btn"
          style={{ width: "100%", marginTop: 12 }}
          onClick={onClose}
        >
          {t("cancel") || "Close"}
        </button>
      </div>
    </div>
  );
}

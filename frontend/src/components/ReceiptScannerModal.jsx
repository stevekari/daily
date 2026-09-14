import { useState, useRef } from "react";
import { useLanguage } from "../LanguageContext";
import { parseReceiptImage } from "../utils/receiptParser";

export default function ReceiptScannerModal({
  isOpen,
  onClose,
  onAddTransaction,
}) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);
    setScannedData(null);

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
      name: scannedData.merchant,
      amount: scannedData.amount,
      type: "EXPENSE",
      category: scannedData.category,
      dateTime: scannedData.date,
      reason: `Scanned Receipt (${(scannedData.confidence * 100).toFixed(0)}% accuracy)`,
    });

    onClose();
    setScannedData(null);
    setPreviewUrl(null);
  };

  return (
    <div className="bs-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bs-modal receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#f97316", margin: 0 }}>
            📸 {t("receiptScannerTitle")}
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

        {/* Upload Dropzone */}
        {!previewUrl ? (
          <div
            className="receipt-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div className="dropzone-icon">🧾</div>
            <p className="dropzone-text">{t("dragDropReceipt")}</p>
            <span className="dropzone-btn">📁 Browse Photo or Receipt</span>
          </div>
        ) : (
          <div>
            {/* Image Preview */}
            <div className="receipt-preview-wrap">
              <img src={previewUrl} alt="Receipt preview" className="receipt-preview-img" />
              {scanning && (
                <div className="receipt-scanning-overlay">
                  <div className="scan-laser-line" />
                  <p style={{ fontWeight: 800, fontSize: 13, margin: "12px 0 0" }}>
                    🤖 {t("scanningReceipt")}
                  </p>
                </div>
              )}
            </div>

            {/* Extracted Data Card */}
            {scannedData && (
              <div className="scanned-result-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#22c55e", textTransform: "uppercase" }}>
                    ✓ Data Extracted ({(scannedData.confidence * 100).toFixed(0)}% Confidence)
                  </span>
                  <button
                    type="button"
                    style={{ background: "transparent", border: 0, color: "#f97316", fontSize: 11, cursor: "pointer", fontWeight: 700 }}
                    onClick={() => { setPreviewUrl(null); setScannedData(null); }}
                  >
                    Scan Another
                  </button>
                </div>

                <div className="scanned-field-row">
                  <label>{t("merchant")}:</label>
                  <input
                    className="bs-form-input"
                    value={scannedData.merchant}
                    onChange={(e) => setScannedData({ ...scannedData, merchant: e.target.value })}
                  />
                </div>

                <div className="scanned-field-row">
                  <label>Amount (€):</label>
                  <input
                    className="bs-form-input"
                    type="number"
                    step="0.01"
                    value={scannedData.amount}
                    onChange={(e) => setScannedData({ ...scannedData, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="scanned-field-row">
                  <label>Category:</label>
                  <input
                    className="bs-form-input"
                    value={scannedData.category}
                    onChange={(e) => setScannedData({ ...scannedData, category: e.target.value })}
                  />
                </div>

                <button
                  type="button"
                  className="btn-submit"
                  style={{ marginTop: 14 }}
                  onClick={handleConfirmAdd}
                >
                  ➕ {t("addToTransactions")}
                </button>
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
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}


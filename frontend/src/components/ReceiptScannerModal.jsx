import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../LanguageContext";
import { parseReceiptImage, parseReceiptText, preprocessImageToCanvas } from "../utils/receiptParser";
import { STANDARD_CATEGORIES } from "../utils/autoCategorizer";

export default function ReceiptScannerModal({
  isOpen,
  onClose,
  onAddTransaction,
  currencySymbol = "€",
}) {
  const { t } = useLanguage();

  // Mode: "camera" | "upload" | "text"
  const [activeTab, setActiveTab] = useState("camera");

  // Camera state
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // File upload state
  const fileInputRef = useRef(null);

  // Processing state
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [manualText, setManualText] = useState("");

  // Start / Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported by your browser. Please use the Upload tab.");
      setActiveTab("upload");
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === "function") {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }
    } catch (err) {
      console.warn("Camera init error:", err);
      setCameraError("Could not access camera. Please allow camera permissions or upload a photo.");
      setActiveTab("upload");
    }
  }, [facingMode, stopCamera]);

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (err) {
        console.warn("Torch toggle failed:", err);
      }
    }
  };

  // Flip Camera (Rear <-> Front)
  const flipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Lifecycle when modal opens/closes or tab changes
  useEffect(() => {
    if (isOpen && activeTab === "camera" && !scannedData) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, scannedData, startCamera, stopCamera]);

  // Clean up ObjectURL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  // Capture current camera frame and analyze
  const handleCaptureFrame = async () => {
    if (!videoRef.current || !cameraActive) return;

    setScanning(true);
    try {
      const canvas = preprocessImageToCanvas(videoRef.current);
      if (!canvas) throw new Error("Could not capture video frame");

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setCapturedBlob(blob);
      stopCamera();

      const result = await parseReceiptImage(blob);
      setScannedData(result);
    } catch (err) {
      console.error("Frame capture error:", err);
      alert("Failed to analyze camera frame. Please try again or upload a photo.");
    } finally {
      setScanning(false);
    }
  };

  // Handle uploaded file
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCapturedBlob(file);
    setScanning(true);
    setScannedData(null);

    try {
      const result = await parseReceiptImage(file);
      setScannedData(result);
    } catch (err) {
      console.error("File scan failed:", err);
      alert("Failed to scan receipt image.");
    } finally {
      setScanning(false);
    }
  };

  // Handle manual text parsing
  const handleParseManualText = () => {
    if (!manualText.trim()) return;
    setScanning(true);
    try {
      const result = parseReceiptText(manualText);
      setScannedData(result);
    } finally {
      setScanning(false);
    }
  };

  // Confirm and add transaction
  const handleConfirmAdd = () => {
    if (!scannedData) return;

    onAddTransaction({
      name: scannedData.merchant || "Scanned Item",
      amount: parseFloat(scannedData.amount) || 0,
      type: scannedData.type || "EXPENSE",
      category: scannedData.category || "General",
      dateTime: scannedData.date || new Date().toISOString(),
      reason: scannedData.reason || `Scanned via AI Optical Scanner (${(scannedData.confidence * 100).toFixed(0)}% match)`,
    });

    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    stopCamera();
    setScannedData(null);
    setPreviewUrl(null);
    setCapturedBlob(null);
    setManualText("");
    onClose();
  };

  const handleScanAnother = () => {
    setScannedData(null);
    setPreviewUrl(null);
    setCapturedBlob(null);
    setManualText("");
    if (activeTab === "camera") {
      startCamera();
    }
  };

  return (
    <div className="bs-modal-backdrop" onClick={handleResetAndClose} role="dialog" aria-modal="true">
      <div
        className="bs-modal receipt-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, width: "94%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>📸</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#f97316", margin: 0 }}>
                {t("receiptScannerTitle") || "Capture Name & Price"}
              </h2>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>
                Scan receipts, bills, or price tags with camera or photo
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleResetAndClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector (only when no result is currently shown) */}
        {!scannedData && !scanning && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 6,
              background: "rgba(255, 255, 255, 0.05)",
              padding: 4,
              borderRadius: 10,
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              className={`calendar-view-btn ${activeTab === "camera" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("camera");
                startCamera();
              }}
              style={{ fontSize: 12, padding: "7px 4px", fontWeight: 800 }}
            >
              🎥 Live Camera
            </button>
            <button
              type="button"
              className={`calendar-view-btn ${activeTab === "upload" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("upload");
                stopCamera();
              }}
              style={{ fontSize: 12, padding: "7px 4px", fontWeight: 800 }}
            >
              📁 Upload Photo
            </button>
            <button
              type="button"
              className={`calendar-view-btn ${activeTab === "text" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("text");
                stopCamera();
              }}
              style={{ fontSize: 12, padding: "7px 4px", fontWeight: 800 }}
            >
              ⌨️ Paste Text
            </button>
          </div>
        )}

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {/* 1. Scanning In Progress Overlay */}
          {scanning && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 20px",
                background: "rgba(0,0,0,0.4)",
                borderRadius: 14,
                border: "1px dashed rgba(249, 115, 22, 0.5)",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "4px solid rgba(249, 115, 22, 0.2)",
                  borderTopColor: "#f97316",
                  animation: "spin 0.9s linear infinite",
                  marginBottom: 16,
                }}
              />
              <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: "#fff" }}>
                🔍 Analyzing Name & Price...
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                Extracting item name, amounts, and auto-categorizing
              </p>
            </div>
          )}

          {/* 2. Live Camera View */}
          {!scannedData && !scanning && activeTab === "camera" && (
            <div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 270,
                  backgroundColor: "#000",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                {/* Futuristic Laser & Targeting Box Overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: "14%",
                    left: "10%",
                    right: "10%",
                    bottom: "14%",
                    border: "2px solid rgba(249, 115, 22, 0.7)",
                    borderRadius: 12,
                    boxShadow: "0 0 16px rgba(249, 115, 22, 0.35)",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "linear-gradient(90deg, transparent, #22c55e, transparent)",
                      boxShadow: "0 0 8px #22c55e",
                      animation: "scanLineAnim 2s ease-in-out infinite",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#fff",
                      textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    Align price tag or receipt in box
                  </span>
                </div>

                {/* Top Camera Controls */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    display: "flex",
                    gap: 8,
                    zIndex: 10,
                  }}
                >
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      style={{
                        background: torchOn ? "#eab308" : "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: torchOn ? "#000" : "#fff",
                        borderRadius: "50%",
                        width: 36,
                        height: 36,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                      }}
                      title="Toggle Flashlight"
                    >
                      💡
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={flipCamera}
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                    title="Flip Camera"
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Shutter Button */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={handleCaptureFrame}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    border: "4px solid #fff",
                    boxShadow: "0 4px 16px rgba(249, 115, 22, 0.6)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    color: "#fff",
                    transition: "transform 0.15s ease",
                  }}
                  title="Snap & Scan"
                >
                  📸
                </button>
              </div>
            </div>
          )}

          {/* 3. Photo Upload Mode */}
          {!scannedData && !scanning && activeTab === "upload" && (
            <div>
              {cameraError && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 11,
                    marginBottom: 12,
                  }}
                >
                  {cameraError}
                </div>
              )}
              <div
                className="receipt-dropzone"
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: "pointer", padding: "28px 16px", textAlign: "center" }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div style={{ fontSize: 40, marginBottom: 8 }}>🧾</div>
                <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 6px" }}>
                  {t("dragDropReceipt") || "Upload photo or receipt image"}
                </p>
                <span className="secondary-btn" style={{ fontSize: 12, padding: "6px 14px", display: "inline-block" }}>
                  📁 Browse Photos / Gallery
                </span>
              </div>
            </div>
          )}

          {/* 4. Manual Text Paste Mode */}
          {!scannedData && !scanning && activeTab === "text" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                Paste or type receipt / invoice lines:
              </label>
              <textarea
                className="bs-form-input"
                rows={5}
                placeholder="e.g.&#10;Starbucks Coffee&#10;Latte €4.50&#10;Croissant €3.20&#10;Total: €7.70"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                style={{ fontFamily: "monospace", fontSize: 12 }}
              />
              <button
                type="button"
                className="primary-btn"
                onClick={handleParseManualText}
                disabled={!manualText.trim()}
                style={{ fontSize: 13, fontWeight: 800, padding: "10px" }}
              >
                ⚡ Extract Name & Price
              </button>
            </div>
          )}

          {/* 5. Extracted Results Card */}
          {scannedData && (
            <div
              className="scanned-result-card"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 14,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Image thumbnail + confidence header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Captured receipt"
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 10,
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#10b981" }}>
                      ✓ {((scannedData.confidence || 0.9) * 100).toFixed(0)}% Match
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>· Verified OCR</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>
                    Review captured details below before saving:
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleScanAnother}
                  style={{
                    background: "rgba(249, 115, 22, 0.15)",
                    border: "1px solid rgba(249, 115, 22, 0.4)",
                    color: "#fb923c",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  🔄 Retake
                </button>
              </div>

              {/* Form fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Name / Merchant */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                    🏷️ Item / Store Name:
                  </label>
                  <input
                    className="bs-form-input"
                    value={scannedData.merchant}
                    onChange={(e) => setScannedData({ ...scannedData, merchant: e.target.value })}
                    placeholder="e.g. Nike Shoes, Mercadona, Starbucks"
                    style={{ fontSize: 14, fontWeight: 700 }}
                  />
                </div>

                {/* Amount / Price */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>
                      💰 Price / Total ({currencySymbol}):
                    </label>
                    {scannedData.allAmounts && scannedData.allAmounts.length > 1 && (
                      <span style={{ fontSize: 10, color: "#fb923c" }}>Tap candidate price:</span>
                    )}
                  </div>

                  <input
                    className="bs-form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={scannedData.amount}
                    onChange={(e) => setScannedData({ ...scannedData, amount: parseFloat(e.target.value) || 0 })}
                    style={{ fontSize: 18, fontWeight: 900, color: "#22c55e" }}
                  />

                  {/* Candidate price chips */}
                  {scannedData.allAmounts && scannedData.allAmounts.length > 1 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                      {scannedData.allAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setScannedData({ ...scannedData, amount: amt })}
                          style={{
                            background: scannedData.amount === amt ? "rgba(34, 197, 94, 0.25)" : "rgba(255, 255, 255, 0.06)",
                            border: `1px solid ${scannedData.amount === amt ? "#22c55e" : "rgba(255, 255, 255, 0.12)"}`,
                            color: scannedData.amount === amt ? "#4ade80" : "#cbd5e1",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {currencySymbol}{amt.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Type & Date */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                      Type:
                    </label>
                    <select
                      className="bs-form-input"
                      value={scannedData.type || "EXPENSE"}
                      onChange={(e) => setScannedData({ ...scannedData, type: e.target.value })}
                    >
                      <option value="EXPENSE">💸 Expense</option>
                      <option value="INCOME">💵 Income</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                      Date:
                    </label>
                    <input
                      className="bs-form-input"
                      type="datetime-local"
                      value={scannedData.date ? scannedData.date.slice(0, 16) : new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setScannedData({ ...scannedData, date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                    Category:
                  </label>
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

              {/* Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleScanAnother}
                  style={{ fontSize: 12, fontWeight: 800 }}
                >
                  🔄 Retake
                </button>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleConfirmAdd}
                  style={{ margin: 0, fontSize: 13, fontWeight: 900 }}
                >
                  💾 Save to Budget
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Close */}
        <button
          type="button"
          className="secondary-btn"
          style={{ width: "100%", marginTop: 12 }}
          onClick={handleResetAndClose}
        >
          {t("cancel") || "Close"}
        </button>
      </div>
    </div>
  );
}

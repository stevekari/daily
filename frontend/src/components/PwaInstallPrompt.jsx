import { useState, useEffect } from "react";

/**
 * Custom hook to detect PWA installability, device environment, and trigger install flow
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");
    setIsInstalled(isStandalone);

    // Detect User Agent
    const userAgent = (window.navigator.userAgent || "").toLowerCase();
    const platform = (window.navigator.platform || "").toLowerCase();
    const maxTouchPoints = window.navigator.maxTouchPoints || 0;

    // Detect iOS (iPhone, iPad, iPod, or iPadOS 13+ identifying as MacIntel with touch)
    const isAppleMobile =
      /iphone|ipad|ipod/.test(userAgent) ||
      (platform.includes("mac") && maxTouchPoints > 1);
    setIsIos(isAppleMobile && !isStandalone);

    // Detect if running inside iOS Safari
    const isAppleSafari =
      /safari/.test(userAgent) &&
      !/chrome|crios|fxios|opera|opr|edg|instagram|fbav|tiktok/.test(userAgent);
    setIsSafari(isAppleSafari);

    // Detect Android
    const isAndroidDevice = /android/.test(userAgent);
    setIsAndroid(isAndroidDevice && !isStandalone);

    // Listen for beforeinstallprompt event (Chrome, Edge, Android, Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("Steve Budget Pro was successfully installed!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
      return outcome;
    }
    return null;
  };

  return {
    isInstallable,
    isInstalled,
    isIos,
    isSafari,
    isAndroid,
    triggerInstall,
    deferredPrompt,
  };
}

/**
 * Universal PWA Install Guide Modal
 * Offers dedicated, interactive tabs for iOS, Android, and Desktop PC/Mac
 */
export function PwaInstallModal({ isOpen, onClose, initialTab = "auto", onInstallNow }) {
  const { isIos, isAndroid, isInstallable, triggerInstall } = usePwaInstall();
  const [activeTab, setActiveTab] = useState("ios");

  useEffect(() => {
    if (initialTab === "auto") {
      if (isIos) setActiveTab("ios");
      else if (isAndroid) setActiveTab("android");
      else setActiveTab("desktop");
    } else {
      setActiveTab(initialTab);
    }
  }, [initialTab, isIos, isAndroid, isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (onInstallNow) {
      onInstallNow();
    } else if (isInstallable) {
      await triggerInstall();
    }
    onClose();
  };

  return (
    <div className="bs-modal-backdrop pwa-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bs-modal pwa-guide-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="pwa-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="pwa-modal-header-icon">
              <img src="/icons/pwa-192x192.png" alt="App Icon" />
            </div>
            <div>
              <h3 className="pwa-modal-title">Install Steve Budget Pro</h3>
              <p className="pwa-modal-subtitle">Choose your device below for quick setup instructions:</p>
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

        {/* Device Switcher Tabs */}
        <div className="pwa-tabs-bar">
          <button
            type="button"
            className={`pwa-tab-btn ${activeTab === "ios" ? "active" : ""}`}
            onClick={() => setActiveTab("ios")}
          >
            🍏 iPhone / iPad
          </button>
          <button
            type="button"
            className={`pwa-tab-btn ${activeTab === "android" ? "active" : ""}`}
            onClick={() => setActiveTab("android")}
          >
            🤖 Android
          </button>
          <button
            type="button"
            className={`pwa-tab-btn ${activeTab === "desktop" ? "active" : ""}`}
            onClick={() => setActiveTab("desktop")}
          >
            💻 Mac / PC
          </button>
        </div>

        {/* TAB 1: iOS (iPhone & iPad) */}
        {activeTab === "ios" && (
          <div className="pwa-tab-content">
            <div className="pwa-callout pwa-callout-ios">
              <span>💡</span>
              <p>
                Apple requires installing web apps via <strong>Safari</strong>. If you are using Chrome or another browser on iPhone, open this link in Safari first.
              </p>
            </div>

            <div className="pwa-steps-list">
              <div className="pwa-step-card">
                <div className="pwa-step-badge">1</div>
                <div className="pwa-step-body">
                  <div className="pwa-step-header">
                    <strong>Tap the Share Button</strong>
                    <span className="pwa-symbol-pill">⎋ Share</span>
                  </div>
                  <p>In Safari, tap the <strong>Share icon ( ⎋ )</strong> located at the bottom toolbar of your iPhone (or top right on iPad).</p>
                </div>
              </div>

              <div className="pwa-step-card">
                <div className="pwa-step-badge">2</div>
                <div className="pwa-step-body">
                  <div className="pwa-step-header">
                    <strong>Select 'Add to Home Screen'</strong>
                    <span className="pwa-symbol-pill">➕ Add</span>
                  </div>
                  <p>Scroll down the share options list and tap <strong>'Add to Home Screen'</strong>.</p>
                </div>
              </div>

              <div className="pwa-step-card">
                <div className="pwa-step-badge">3</div>
                <div className="pwa-step-body">
                  <div className="pwa-step-header">
                    <strong>Tap 'Add' at Top Right</strong>
                    <span className="pwa-symbol-pill">Done</span>
                  </div>
                  <p>Tap <strong>'Add'</strong> in the top-right corner. The Steve Budget icon will appear on your home screen!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Android */}
        {activeTab === "android" && (
          <div className="pwa-tab-content">
            {isInstallable ? (
              <div className="pwa-direct-install-box">
                <p>1-Click instant install is ready for your Android device:</p>
                <button
                  type="button"
                  className="btn-submit pwa-direct-btn"
                  onClick={handleNativeInstall}
                >
                  📲 Install Steve Budget Now
                </button>
              </div>
            ) : null}

            <div className="pwa-steps-list">
              <div className="pwa-step-card">
                <div className="pwa-step-badge">1</div>
                <div className="pwa-step-body">
                  <div className="pwa-step-header">
                    <strong>Open Chrome Menu</strong>
                    <span className="pwa-symbol-pill">⋮ Menu</span>
                  </div>
                  <p>Tap the <strong>three vertical dots ( ⋮ )</strong> in the top right corner of Chrome.</p>
                </div>
              </div>

              <div className="pwa-step-card">
                <div className="pwa-step-badge">2</div>
                <div className="pwa-step-body">
                  <div className="pwa-step-header">
                    <strong>Tap 'Install app' or 'Add to Home screen'</strong>
                    <span className="pwa-symbol-pill">📲 Install</span>
                  </div>
                  <p>Select <strong>'Install app'</strong> (or 'Add to Home screen') from the dropdown menu.</p>
                </div>
              </div>

              <div className="pwa-step-card">
                <div className="pwa-step-badge">3</div>
                <div className="pwa-step-body">
                  <div className="pwa-step-header">
                    <strong>Confirm Installation</strong>
                    <span className="pwa-symbol-pill">Confirm</span>
                  </div>
                  <p>Tap <strong>'Install'</strong> to download the full app onto your Android device.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Desktop (PC / Mac) */}
        {activeTab === "desktop" && (
          <div className="pwa-tab-content">
            {isInstallable ? (
              <div className="pwa-direct-install-box">
                <p>Click below to install Steve Budget Pro on your computer:</p>
                <button
                  type="button"
                  className="btn-submit pwa-direct-btn"
                  onClick={handleNativeInstall}
                >
                  💻 Install on Desktop
                </button>
              </div>
            ) : null}

            <div className="pwa-steps-list">
              <div className="pwa-step-card">
                <div className="pwa-step-badge">1</div>
                <div className="pwa-step-body">
                  <div className="pwa-step-header">
                    <strong>Address Bar Install Icon</strong>
                    <span className="pwa-symbol-pill">⊕ Install</span>
                  </div>
                  <p>In Chrome, Edge, or Brave, look for the <strong>Install icon ( ⊕ )</strong> on the right side of the address bar.</p>
                </div>
              </div>

              <div className="pwa-step-card">
                <div className="pwa-step-badge">2</div>
                <div className="pwa-step-body">
                  <div className="pwa-step-header">
                    <strong>Click Install</strong>
                    <span className="pwa-symbol-pill">Open</span>
                  </div>
                  <p>Click <strong>'Install'</strong>. The app will launch in its own dedicated, clean window.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pwa-modal-footer">
          <button
            type="button"
            className="btn-submit"
            style={{ width: "100%", padding: "12px 18px", fontSize: 14 }}
            onClick={onClose}
          >
            Got it, Let's Go! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * PWA Install Prompt Banner Component
 * Floating smart banner with 1-click install & interactive modal trigger
 */
export default function PwaInstallPrompt({ onInstalled }) {
  const { isInstallable, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("pwa_prompt_dismissed") === "true";
    setDismissed(isDismissed);
  }, []);

  if (isInstalled || dismissed) {
    return (
      <PwaInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialTab="auto"
      />
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await triggerInstall();
    }
    // If not installable directly or on iOS, open the guide modal
    setShowModal(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
    setDismissed(true);
  };

  return (
    <>
      <div className="pwa-install-banner" role="region" aria-label="Install App">
        <div className="pwa-banner-content" onClick={handleInstallClick} style={{ cursor: "pointer" }}>
          <div className="pwa-banner-icon">
            <img src="/icons/pwa-192x192.png" alt="App Icon" className="pwa-icon-img" />
          </div>
          <div className="pwa-banner-text">
            <h4 className="pwa-banner-title">
              {isIos ? "📱 Install on iPhone / iPad" : "📲 Install Steve Budget Pro"}
            </h4>
            <p className="pwa-banner-subtitle">
              {isIos
                ? "Tap for step-by-step instructions to add to your Home Screen"
                : "Install on your home screen for quick offline access & full screen"}
            </p>
          </div>
        </div>

        <div className="pwa-banner-actions">
          <button
            type="button"
            className="pwa-install-btn"
            onClick={handleInstallClick}
          >
            {isIos ? "📖 How to Install" : "📲 Install"}
          </button>
          <button
            type="button"
            className="pwa-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Interactive Guide Modal */}
      <PwaInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialTab={isIos ? "ios" : "auto"}
      />
    </>
  );
}

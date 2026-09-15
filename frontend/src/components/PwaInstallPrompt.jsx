import { useState, useEffect } from "react";

/**
 * Custom hook to detect PWA installability and trigger installation prompt
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      /safari/.test(userAgent) &&
      !/chrome|crios|fxios|opera|opr/.test(userAgent);
    setIsIos(isAppleDevice && isSafari && !isStandalone);

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
    triggerInstall,
  };
}

/**
 * PWA Install Prompt Banner Component
 * Floating smart banner with 1-click install on Android/PC/Mac and iOS guidance modal
 */
export default function PwaInstallPrompt({ onInstalled }) {
  const { isInstallable, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("pwa_prompt_dismissed") === "true";
    setDismissed(isDismissed);
  }, []);

  // Do not show if already installed or dismissed this session
  if (isInstalled || dismissed || (!isInstallable && !isIos)) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
    } else if (isInstallable) {
      const outcome = await triggerInstall();
      if (outcome === "accepted" && onInstalled) {
        onInstalled();
      }
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
    setDismissed(true);
  };

  return (
    <>
      <div className="pwa-install-banner" role="region" aria-label="Install App">
        <div className="pwa-banner-content">
          <div className="pwa-banner-icon">
            <img src="/icons/pwa-192x192.png" alt="App Icon" className="pwa-icon-img" />
          </div>
          <div className="pwa-banner-text">
            <h4 className="pwa-banner-title">Install Steve Budget Pro</h4>
            <p className="pwa-banner-subtitle">
              Install on your home screen for quick offline access & instant launch!
            </p>
          </div>
        </div>

        <div className="pwa-banner-actions">
          <button
            type="button"
            className="pwa-install-btn"
            onClick={handleInstallClick}
          >
            📲 Install
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

      {/* iOS Install Instructions Modal */}
      {showIosModal && (
        <div className="bs-modal-backdrop" onClick={() => setShowIosModal(false)}>
          <div className="bs-modal pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: "#f97316", margin: 0 }}>
                📱 Install on iPhone / iPad
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowIosModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 18 }}>
              Follow these two quick steps in Safari to add Steve Budget Pro to your home screen:
            </p>

            <div className="pwa-ios-steps">
              <div className="pwa-step-item">
                <span className="pwa-step-num">1</span>
                <div>
                  <strong>Tap the Share button</strong>
                  <p>Tap the <strong>Share icon ( ⎋ )</strong> at the bottom or top of your Safari screen.</p>
                </div>
              </div>

              <div className="pwa-step-item">
                <span className="pwa-step-num">2</span>
                <div>
                  <strong>Add to Home Screen</strong>
                  <p>Scroll down the menu and tap <strong>'Add to Home Screen' ( ➕ )</strong>.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-submit"
              style={{ width: "100%", marginTop: 20 }}
              onClick={() => setShowIosModal(false)}
            >
              Got it! 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}

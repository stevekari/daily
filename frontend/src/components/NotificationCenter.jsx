import React from "react";
import { useLanguage } from "../LanguageContext";
import { requestNotificationPermission } from "../utils/notificationEngine";

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
}) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    if (res === "granted") {
      alert("✅ Browser notifications enabled! You will receive live alerts when exceeding limits.");
    }
  };

  const isPushSupported = typeof window !== "undefined" && "Notification" in window;
  const isPushGranted = isPushSupported && Notification.permission === "granted";

  return (
    <div className="bs-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bs-modal notif-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#f97316", margin: 0 }}>
                {t("notifications")}
              </h2>
              <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.55)" }}>
                {notifications.filter((n) => !n.read).length} unread
              </span>
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

        {/* Action Bar (Push Permission, Mark Read, Clear All) */}
        <div className="notif-action-bar">
          {isPushSupported && !isPushGranted && (
            <button
              type="button"
              className="notif-perm-btn"
              onClick={handleEnablePush}
              title="Get notified even when app is in the background"
            >
              🔔 {t("enableBrowserNotifications") || "Enable Push Alerts"}
            </button>
          )}
          {notifications.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
              <button
                type="button"
                className="notif-text-btn"
                onClick={onMarkAllAsRead}
              >
                ✓ {t("markAllRead")}
              </button>
              {onClearAll && (
                <button
                  type="button"
                  className="notif-text-btn danger"
                  onClick={onClearAll}
                >
                  🗑️ {t("clearAll") || "Clear All"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <div className="empty-state-icon" style={{ fontSize: 36 }}>🔕</div>
              <p className="empty-state-text">
                {t("noNotifications") || "You're all caught up! No notifications."}
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isDanger = n.type === "danger" || n.type === "warning";
              const isDaily = n.category === "daily";

              return (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? "read" : "unread"} ${n.type || "info"} ${isDaily ? "daily-alert" : ""}`}
                >
                  <span className="notif-icon">{n.icon || (isDanger ? "🚨" : "🔔")}</span>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <h5 className="notif-title">{n.title}</h5>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span className="notif-time">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {onDeleteNotification && (
                          <button
                            type="button"
                            className="notif-item-del-btn"
                            title={t("delete") || "Delete"}
                            onClick={() => onDeleteNotification(n.id)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="notif-msg">{n.message}</p>

                    {/* Anti-Overspending Actionable Advice Section */}
                    {n.advice && n.advice.length > 0 && (
                      <div className="notif-advice-box">
                        <div className="notif-advice-header">
                          <span>💡</span>
                          <span>{t("antiOverspendingAdviceTitle") || "Advice to Stop Overspending:"}</span>
                        </div>
                        <ul className="notif-advice-list">
                          {n.advice.map((adv, idx) => (
                            <li key={idx}>{adv}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button type="button" className="secondary-btn" style={{ width: "100%", marginTop: 14 }} onClick={onClose}>
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

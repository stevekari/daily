import React, { useState } from "react";
import { useLanguage } from "../LanguageContext";
import { requestNotificationPermission } from "../utils/notificationEngine";

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onUpdateNotification,
  onDeleteMultiple,
}) {
  const { t } = useLanguage();

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    if (res === "granted") {
      alert("✅ Browser notifications enabled! You will receive live alerts when exceeding limits.");
    }
  };

  const isPushSupported = typeof window !== "undefined" && "Notification" in window;
  const isPushGranted = isPushSupported && Notification.permission === "granted";

  const handleStartEdit = (n) => {
    setEditingId(n.id);
    setEditTitle(n.title || "");
    setEditMessage(n.message || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditMessage("");
  };

  const handleSaveEdit = (notifId) => {
    if (!editTitle.trim() && !editMessage.trim()) {
      alert("Please enter a title or message.");
      return;
    }
    if (onUpdateNotification) {
      onUpdateNotification(notifId, {
        title: editTitle.trim(),
        message: editMessage.trim(),
      });
    }
    setEditingId(null);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const handleClearSelected = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteMultiple) {
      onDeleteMultiple(selectedIds);
    } else if (onDeleteNotification) {
      selectedIds.forEach((id) => onDeleteNotification(id));
    }
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleClearAllClick = () => {
    if (notifications.length === 0) return;
    if (window.confirm(t("confirmClearAll") || "Are you sure you want to clear all notifications?")) {
      if (onClearAll) onClearAll();
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
  };

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

        {/* Action Bar (Push Permission, Mark Read, Selection Mode, Clear All) */}
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
            <div style={{ display: "flex", gap: 10, marginLeft: "auto", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="notif-text-btn"
                onClick={onMarkAllAsRead}
                title="Mark all notifications as read"
              >
                ✓ {t("markAllRead") || "Mark read"}
              </button>

              <button
                type="button"
                className={`notif-text-btn notif-select-mode-btn ${isSelectionMode ? "active-toggle" : ""}`}
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedIds([]);
                }}
                title="Select multiple messages to clear together"
              >
                {isSelectionMode ? `✕ ${t("cancel") || "Done"}` : `☑️ ${t("select") || "Select"}`}
              </button>

              {onClearAll && (
                <button
                  type="button"
                  className="notif-text-btn danger"
                  onClick={handleClearAllClick}
                  title="Clear all notifications together"
                >
                  🗑️ {t("clearAll") || "Clear All"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Multi-Selection Sub-Bar */}
        {isSelectionMode && notifications.length > 0 && (
          <div className="notif-selection-toolbar">
            <label className="notif-select-all-label">
              <input
                type="checkbox"
                checked={selectedIds.length === notifications.length && notifications.length > 0}
                onChange={handleToggleSelectAll}
                className="notif-checkbox"
              />
              <span>
                {selectedIds.length === notifications.length
                  ? t("deselectAll") || "Deselect All"
                  : t("selectAll") || "Select All"}
              </span>
            </label>

            <span className="notif-selected-count">
              {selectedIds.length} / {notifications.length} {t("selectedCount") || "selected"}
            </span>

            <button
              type="button"
              className="notif-batch-clear-btn"
              disabled={selectedIds.length === 0}
              onClick={handleClearSelected}
            >
              🗑️ {t("clearSelected") || "Clear Selected"} ({selectedIds.length})
            </button>
          </div>
        )}

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
              const isEditing = editingId === n.id;
              const isSelected = selectedIds.includes(n.id);

              return (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? "read" : "unread"} ${n.type || "info"} ${
                    isDaily ? "daily-alert" : ""
                  } ${isSelected ? "selected" : ""} ${isEditing ? "editing-mode" : ""}`}
                >
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className="notif-item-check-wrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(n.id)}
                        className="notif-checkbox"
                      />
                    </div>
                  )}

                  <span className="notif-icon">{n.icon || (isDanger ? "🚨" : "🔔")}</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      /* Inline Message Editor */
                      <div className="notif-edit-container">
                        <div className="notif-edit-field">
                          <label className="notif-edit-label">Title</label>
                          <input
                            type="text"
                            className="notif-edit-input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Notification title..."
                            autoFocus
                          />
                        </div>

                        <div className="notif-edit-field">
                          <label className="notif-edit-label">Message</label>
                          <textarea
                            className="notif-edit-textarea"
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            placeholder="Notification message..."
                            rows={3}
                          />
                        </div>

                        <div className="notif-edit-actions">
                          <button
                            type="button"
                            className="notif-save-btn"
                            onClick={() => handleSaveEdit(n.id)}
                          >
                            💾 {t("saveMessage") || t("save") || "Save"}
                          </button>
                          <button
                            type="button"
                            className="notif-cancel-btn"
                            onClick={handleCancelEdit}
                          >
                            ✕ {t("cancelEdit") || t("cancel") || "Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Mode */
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 6,
                          }}
                        >
                          <h5 className="notif-title">{n.title}</h5>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexShrink: 0,
                            }}
                          >
                            <span className="notif-time">
                              {n.timestamp
                                ? new Date(n.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>

                            {/* Edit Button (One by One) */}
                            <button
                              type="button"
                              className="notif-item-action-btn edit"
                              title={t("editMessage") || "Edit message"}
                              onClick={() => handleStartEdit(n)}
                            >
                              ✏️
                            </button>

                            {/* Delete Button (One by One) */}
                            {onDeleteNotification && (
                              <button
                                type="button"
                                className="notif-item-action-btn delete"
                                title={t("delete") || "Delete notification"}
                                onClick={() => onDeleteNotification(n.id)}
                              >
                                🗑️
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
                              <span>
                                {t("antiOverspendingAdviceTitle") ||
                                  "Advice to Stop Overspending:"}
                              </span>
                            </div>
                            <ul className="notif-advice-list">
                              {n.advice.map((adv, idx) => (
                                <li key={idx}>{adv}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="secondary-btn"
          style={{ width: "100%", marginTop: 14 }}
          onClick={onClose}
        >
          {t("cancel") || "Close"}
        </button>
      </div>
    </div>
  );
}

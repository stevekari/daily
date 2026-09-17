import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import { BADGES } from "../utils/gamification";

export default function AchievementsModal({
  isOpen,
  onClose,
  streakCount = 0,
  badges = [],
  onAction,
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("ALL"); // 'ALL' | 'UNLOCKED' | 'LOCKED'
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);

  if (!isOpen) return null;

  // Merge runtime progress with canonical BADGES metadata
  const enrichedBadges = BADGES.map((canonical) => {
    const live = badges.find((b) => b.id === canonical.id);
    return {
      ...canonical,
      progress: live?.progress ?? 0,
      unlocked: live?.unlocked ?? false,
    };
  });

  const unlockedCount = enrichedBadges.filter((b) => b.unlocked).length;
  const totalBadges = enrichedBadges.length;
  const lockedCount = totalBadges - unlockedCount;
  const progressPct = Math.round((unlockedCount / totalBadges) * 100);

  const filteredBadges = enrichedBadges.filter((b) => {
    if (filter === "UNLOCKED") return b.unlocked;
    if (filter === "LOCKED") return !b.unlocked;
    return true;
  });

  // Selected badge (or fallback if current selection filtered out)
  const selectedBadge =
    enrichedBadges.find((b) => b.id === selectedBadgeId) || null;

  const handleSelectBadge = (badgeId) => {
    setSelectedBadgeId((prev) => (prev === badgeId ? null : badgeId));
  };

  const handleExecuteAction = (actionType) => {
    if (onAction && actionType) {
      onAction(actionType);
    }
    onClose();
  };

  return (
    <div className="bs-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bs-modal modal-achievements" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#f97316", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🏆</span> {t("achievements")}
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "4px 0 0" }}>
              {unlockedCount} / {totalBadges} {t("badges")} {t("unlockedBadges") || "unlocked"} ({progressPct}%)
            </p>
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

        {/* Global Progress Bar */}
        <div className="achievements-global-meter-wrap">
          <div className="achievements-global-meter-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Streak Highlight Banner */}
        <div className="streak-hero-card">
          <div className="streak-hero-icon">🔥</div>
          <div style={{ flex: 1 }}>
            <div className="streak-hero-title">
              {streakCount} {t("dayStreak")}!
            </div>
            <p className="streak-hero-desc">
              {streakCount >= 3
                ? "You're on fire! Keep logging daily transactions to maintain your momentum."
                : "Log daily transactions to build and multiply your active streak."}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="badge-filter-tabs">
          <button
            type="button"
            className={`badge-filter-btn ${filter === "ALL" ? "active" : ""}`}
            onClick={() => setFilter("ALL")}
          >
            {t("allBadges") || "All"} ({totalBadges})
          </button>
          <button
            type="button"
            className={`badge-filter-btn ${filter === "UNLOCKED" ? "active" : ""}`}
            onClick={() => setFilter("UNLOCKED")}
          >
            ✓ {t("unlockedBadges") || "Unlocked"} ({unlockedCount})
          </button>
          <button
            type="button"
            className={`badge-filter-btn ${filter === "LOCKED" ? "active" : ""}`}
            onClick={() => setFilter("LOCKED")}
          >
            🔒 {t("lockedBadges") || "In Progress"} ({lockedCount})
          </button>
        </div>

        {/* Interactive Badge List / Grid */}
        <div className="badges-grid">
          {filteredBadges.map((b) => {
            const isSelected = selectedBadgeId === b.id;
            const completionRate = Math.min(100, Math.round((b.progress / b.maxProgress) * 100));

            return (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                className={`badge-card ${b.unlocked ? "badge-card--unlocked" : "badge-card--locked"} ${
                  isSelected ? "is-selected" : ""
                }`}
                onClick={() => handleSelectBadge(b.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectBadge(b.id);
                  }
                }}
                aria-pressed={isSelected}
              >
                <div className="badge-icon-wrap" style={{ borderColor: b.categoryColor ? `${b.categoryColor}55` : undefined }}>
                  <span className="badge-icon">{b.icon}</span>
                  {b.unlocked && <span className="badge-check">✓</span>}
                </div>

                <div className="badge-info">
                  <div className="badge-header-row">
                    <h4 className="badge-title">{b.title}</h4>
                    <span
                      className="badge-category-tag"
                      style={{
                        backgroundColor: `${b.categoryColor || "#f97316"}22`,
                        color: b.categoryColor || "#f97316",
                        borderColor: `${b.categoryColor || "#f97316"}44`,
                      }}
                    >
                      {b.category}
                    </span>
                  </div>

                  <p className="badge-desc">{b.description}</p>

                  <div className="badge-progress-wrap">
                    <div className="badge-progress-bar">
                      <div
                        className="badge-progress-fill"
                        style={{
                          width: `${completionRate}%`,
                          backgroundColor: b.unlocked ? "#22c55e" : b.categoryColor || "#f97316",
                        }}
                      />
                    </div>
                    <span className="badge-progress-label">
                      {b.unlocked ? "✓ Done" : `${b.progress}/${b.maxProgress}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Badge Inspector Panel */}
        {selectedBadge && (
          <div className="badge-inspector-card" style={{ borderLeftColor: selectedBadge.categoryColor || "#f97316" }}>
            <div className="badge-inspector-header">
              <div
                className={`badge-inspector-icon-wrap ${selectedBadge.unlocked ? "unlocked-glow" : ""}`}
                style={{
                  background: `${selectedBadge.categoryColor || "#f97316"}20`,
                  borderColor: selectedBadge.categoryColor || "#f97316",
                }}
              >
                <span>{selectedBadge.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <h3 className="badge-inspector-title">{selectedBadge.title}</h3>
                  <span
                    className="badge-status-pill"
                    style={{
                      backgroundColor: selectedBadge.unlocked ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)",
                      color: selectedBadge.unlocked ? "#4ade80" : "#fb923c",
                      borderColor: selectedBadge.unlocked ? "rgba(34, 197, 94, 0.4)" : "rgba(249, 115, 22, 0.4)",
                    }}
                  >
                    {selectedBadge.unlocked ? `🎉 ${t("badgeCompleted") || "Completed!"}` : `🔒 ${t("lockedBadges") || "In Progress"}`}
                  </span>
                </div>
                <p className="badge-inspector-desc">{selectedBadge.description}</p>
              </div>
            </div>

            {/* How to Unlock Box */}
            <div className="badge-unlock-guide">
              <div className="badge-unlock-guide-label">
                💡 {t("howToEarn") || "How to Unlock"}:
              </div>
              <div className="badge-unlock-guide-text">
                {selectedBadge.howToEarn || selectedBadge.description}
              </div>
            </div>

            {/* Detailed Progress Bar */}
            <div className="badge-inspector-progress-row">
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                {t("progress") || "Progress"}: {selectedBadge.progress} / {selectedBadge.maxProgress} (
                {Math.min(100, Math.round((selectedBadge.progress / selectedBadge.maxProgress) * 100))}%)
              </span>
            </div>
            <div className="badge-progress-bar" style={{ height: 6, marginTop: 4, marginBottom: 14 }}>
              <div
                className="badge-progress-fill"
                style={{
                  width: `${Math.min(100, (selectedBadge.progress / selectedBadge.maxProgress) * 100)}%`,
                  backgroundColor: selectedBadge.unlocked ? "#22c55e" : selectedBadge.categoryColor || "#f97316",
                }}
              />
            </div>

            {/* Action Buttons Row */}
            <div className="badge-inspector-actions">
              {selectedBadge.actionType && (
                <button
                  type="button"
                  className="badge-action-btn"
                  onClick={() => handleExecuteAction(selectedBadge.actionType)}
                >
                  <span>{selectedBadge.actionLabel || t("takeAction") || "Go to Feature"}</span>
                  <span style={{ fontSize: 16 }}>➔</span>
                </button>
              )}
              <button
                type="button"
                className="badge-dismiss-btn"
                onClick={() => setSelectedBadgeId(null)}
              >
                ✕ {t("dismiss") || "Close Details"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
          <button type="button" className="btn-submit" style={{ flex: 1 }} onClick={onClose}>
            {t("continue")}
          </button>
        </div>
      </div>
    </div>
  );
}

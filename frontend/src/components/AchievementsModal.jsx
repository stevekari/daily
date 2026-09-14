import { useLanguage } from "../LanguageContext";
import { BADGES } from "../utils/gamification";

export default function AchievementsModal({
  isOpen,
  onClose,
  streakCount = 0,
  badges = [],
}) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalBadges = BADGES.length;
  const progressPct = Math.round((unlockedCount / totalBadges) * 100);

  return (
    <div className="bs-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bs-modal modal-achievements" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#f97316", margin: 0 }}>
              🏆 {t("achievements")}
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
              {unlockedCount} / {totalBadges} {t("badges")} unlocked ({progressPct}%)
            </p>
          </div>
          <button type="button" className="sidebar-close-btn" style={{ display: "flex", position: "static" }} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Streak Highlight Banner */}
        <div className="streak-hero-card">
          <div className="streak-hero-icon">🔥</div>
          <div>
            <div className="streak-hero-title">
              {streakCount} {t("dayStreak")}!
            </div>
            <p className="streak-hero-desc">
              {streakCount >= 3 ? "You're on fire! Keep logging daily." : "Log transactions daily to build your streak."}
            </p>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="badges-grid">
          {badges.map((b) => (
            <div key={b.id} className={`badge-card ${b.unlocked ? "badge-card--unlocked" : "badge-card--locked"}`}>
              <div className="badge-icon-wrap">
                <span className="badge-icon">{b.icon}</span>
                {b.unlocked && <span className="badge-check">✓</span>}
              </div>
              <div className="badge-info">
                <h4 className="badge-title">{b.title}</h4>
                <p className="badge-desc">{b.description}</p>
                {!b.unlocked && (
                  <div className="badge-progress-bar">
                    <div
                      className="badge-progress-fill"
                      style={{ width: `${Math.min(100, (b.progress / b.maxProgress) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="btn-submit" style={{ marginTop: 20 }} onClick={onClose}>
          {t("continue")}
        </button>
      </div>
    </div>
  );
}


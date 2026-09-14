import { createContext, useContext, useState } from "react";
import { useLanguage } from "./LanguageContext";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem("budgetTheme") || "dark");

  const setTheme = (nextTheme) => {
    if (nextTheme !== "dark" && nextTheme !== "light") return;
    setThemeState(nextTheme);
    localStorage.setItem("budgetTheme", nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`app-theme app-theme--${theme}`} data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ compact = false, showLabel = false, className = "" }) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [animating, setAnimating] = useState(false);
  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  const handleToggle = () => {
    setAnimating(true);
    setTheme(nextTheme);
    setTimeout(() => setAnimating(false), 550);
  };

  return (
    <button
      type="button"
      className={`theme-mode-toggle theme-toggle ${isDark ? "theme-mode-toggle--dark" : "theme-mode-toggle--light"} ${compact ? "theme-mode-toggle--compact" : ""} ${animating ? "theme-mode-toggle--animating" : ""} ${className}`}
      onClick={handleToggle}
      aria-pressed={!isDark}
      title={isDark ? (t("lightMode") || "Switch to Light Mode") : (t("darkMode") || "Switch to Dark Mode")}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="mode-toggle-track">
        {/* Night celestial elements (stars) */}
        <span className="mode-star mode-star--1" aria-hidden="true">✦</span>
        <span className="mode-star mode-star--2" aria-hidden="true">⋆</span>
        <span className="mode-star mode-star--3" aria-hidden="true">·</span>

        {/* Day rays */}
        <span className="mode-day-ray mode-day-ray--1" aria-hidden="true" />
        <span className="mode-day-ray mode-day-ray--2" aria-hidden="true" />

        {/* Sliding Animated Celestial Disc */}
        <div className={`mode-toggle-thumb ${isDark ? "thumb--dark" : "thumb--light"}`}>
          <div className="mode-icon-disc">
            {isDark ? (
              <span className="mode-icon-moon" aria-hidden="true">🌙</span>
            ) : (
              <span className="mode-icon-sun" aria-hidden="true">☀️</span>
            )}
          </div>
        </div>
      </div>

      {showLabel && (
        <span className="mode-toggle-text">
          {isDark ? (t("lightMode") || "Light") : (t("darkMode") || "Dark")}
        </span>
      )}
    </button>
  );
}

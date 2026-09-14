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

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(nextTheme)}
      aria-pressed={theme === "light"}
      title={theme === "dark" ? t("lightMode") : t("darkMode")}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
      <span>{theme === "dark" ? t("lightMode") : t("darkMode")}</span>
    </button>
  );
}

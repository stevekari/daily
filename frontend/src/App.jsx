import { useState, useEffect } from "react";
import BudgetSetup from "./components/BudgetSetup";
import BudgetApp from "./components/BudgetApp";
import LoginRegister from "./components/LoginRegister";
import { LanguagePicker, LanguageProvider, useLanguage } from "./LanguageContext";
import { getUserBudgets, clearAuthSession } from "./dataApi";
import { ThemeProvider } from "./ThemeContext";

function AppContent() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUserId = localStorage.getItem("userId");
    if (savedUserId) {
      return {
        id: savedUserId,
        username: localStorage.getItem("username"),
      };
    }
    return null;
  });
  const [hasBudget, setHasBudget] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkBudget() {
      if (currentUser?.id) {
        const localBudget = localStorage.getItem(`budgetUser_budget_${currentUser.id}`);
        if (localBudget && parseFloat(localBudget) > 0) {
          if (isMounted) setHasBudget(true);
        }

        try {
          const numericUserId = parseInt(currentUser.id);
          if (!isNaN(numericUserId) && numericUserId > 0) {
            const budgets = await getUserBudgets(currentUser.id);
            if (isMounted) {
              if (budgets && budgets.length > 0) {
                setHasBudget(true);
              } else if (!localBudget) {
                setHasBudget(false);
              }
            }
          }
        } catch (err) {
          console.warn("Session check notice:", err.message);
          if (
            (err.message && err.message.toLowerCase().includes("unauthorized")) ||
            (err.message && err.message.toLowerCase().includes("user not found")) ||
            (err.message && err.message.toLowerCase().includes("access denied"))
          ) {
            clearAuthSession();
            if (isMounted) {
              setCurrentUser(null);
              setHasBudget(false);
            }
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    }

    checkBudget();

    const handleUnauthorized = () => {
      clearAuthSession();
      if (isMounted) {
        setCurrentUser(null);
        setHasBudget(false);
      }
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [currentUser]);

  const handleLoginSuccess = async (userId) => {
    const userObj = {
      id: userId,
      username: localStorage.getItem("username"),
    };
    setCurrentUser(userObj);

    const localBudget = localStorage.getItem(`budgetUser_budget_${userId}`);
    if (localBudget && parseFloat(localBudget) > 0) {
      setHasBudget(true);
      return;
    }

    try {
      const numericUserId = parseInt(userId);
      if (!isNaN(numericUserId) && numericUserId > 0) {
        const budgets = await getUserBudgets(userId);
        if (budgets && budgets.length > 0) {
          setHasBudget(true);
          return;
        }
      }
      setHasBudget(false);
    } catch {
      setHasBudget(Boolean(localBudget));
    }
  };

  const handleBudgetSetup = () => {
    setHasBudget(true);
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setHasBudget(false);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div>
          <div className="app-loading-icon">💰</div>
          <p className="app-loading-text">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login/register page
  if (!currentUser) {
    return <LoginRegister onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in but no budget - show budget setup
  if (!hasBudget) {
    return (
      <BudgetSetup
        userId={currentUser.id}
        username={currentUser.username}
        onBudgetCreated={handleBudgetSetup}
        onLogout={handleLogout}
      />
    );
  }

  // Logged in with budget - show main app with logout button
  return (
    <BudgetApp
      userId={currentUser.id}
      username={currentUser.username}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <LanguagePicker />
        <AppContent />
      </ThemeProvider>
    </LanguageProvider>
  );
}

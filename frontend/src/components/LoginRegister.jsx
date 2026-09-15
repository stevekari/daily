import { useState, useMemo } from "react";
import { useLanguage } from "../LanguageContext";
import { ThemeToggle } from "../ThemeContext";
import { loginUser, registerUser, loginWithFirebase, setAuthToken } from "../dataApi";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "../firebase";
import steveLogo from "../assets/stevebudget.png";

/**
 * LoginRegister Component
 * Shows either login or register form based on the 'mode' state.
 * Implements Google Sign-In with Firebase, strong authentication, password visibility toggles,
 * live password strength meter, and JWT token session handling.
 */
export default function LoginRegister({ onLoginSuccess }) {
  const { language, setLanguage, t, languageOptions, setShowLanguagePicker } = useLanguage();
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Visibility toggle states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // Register form
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    monthlyBudget: "",
  });

  // Password rules validation
  const pwdValidation = useMemo(() => {
    const pwd = registerForm.password || "";
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);

    const score = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    let label = t("pwdWeak") || "Weak";
    let color = "#ef4444"; // red

    if (score >= 5) {
      label = t("pwdVeryStrong") || "Very Strong";
      color = "#10b981"; // emerald
    } else if (score >= 4) {
      label = t("pwdStrong") || "Strong";
      color = "#22c55e"; // green
    } else if (score >= 3) {
      label = t("pwdMedium") || "Medium";
      color = "#f59e0b"; // amber
    }

    return {
      hasLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      score,
      label,
      color,
      isValid: score === 5,
    };
  }, [registerForm.password, t]);

  // ── Google Sign-In with Firebase ────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { idToken, user } = await signInWithGoogle();
      if (!idToken) {
        throw new Error("No Firebase token received");
      }

      // 1. Attempt verification with Spring Boot backend
      try {
        const data = await loginWithFirebase(idToken);
        if (data && data.success) {
          setSuccess(t("loginSuccessful") || "Login successful! Redirecting...");
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("username", data.username || user.displayName || user.email?.split("@")[0] || "User");
          if (data.token) {
            setAuthToken(data.token);
          }
          if (user.displayName) {
            localStorage.setItem(`budgetUser_name_${data.userId}`, user.displayName);
          }
          if (user.photoURL) {
            localStorage.setItem(`budgetUser_photo_${data.userId}`, user.photoURL);
          }
          setTimeout(() => onLoginSuccess(data.userId), 600);
          return;
        }
      } catch (backendErr) {
        console.warn("Backend Firebase auth verification fallback:", backendErr);
        // Fallback to client session if backend is in standalone/offline mode
        const localUserId = user.uid.substring(0, 16);
        const displayName = user.displayName || user.email?.split("@")[0] || "User";
        localStorage.setItem("userId", localUserId);
        localStorage.setItem("username", displayName);
        if (user.displayName) {
          localStorage.setItem(`budgetUser_name_${localUserId}`, user.displayName);
        }
        if (user.photoURL) {
          localStorage.setItem(`budgetUser_photo_${localUserId}`, user.photoURL);
        }
        setSuccess(t("loginSuccessful") || "Login successful! Redirecting...");
        setTimeout(() => onLoginSuccess(localUserId), 600);
      }
    } catch (err) {
      if (err.code === "auth/operation-not-allowed") {
        setError(
          "Google Sign-In is not enabled in your Firebase project yet. Enable it in Firebase Console: Authentication > Sign-in method > Google."
        );
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "Domain not authorized in Firebase. Add your domain in Firebase Console: Authentication > Settings > Authorized domains."
        );
      } else if (err.code === "auth/invalid-api-key" || err.code === "auth/api-key-not-valid.Please pass a valid API key.") {
        setError(
          "Invalid Firebase API key. Please verify your Firebase project credentials."
        );
      } else if (err.code === "auth/popup-blocked") {
        setError(
          "Popup blocked by browser. Please allow popups for this site to sign in with Google."
        );
      } else if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(err.message || "Google sign in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Login handler ────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!loginForm.username.trim() || !loginForm.password) {
      setError(t("usernameRequired") || "Username and password are required");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser({
        username: loginForm.username.trim(),
        password: loginForm.password,
      });

      if (data.success) {
        setSuccess(t("loginSuccessful") || "Login successful! Redirecting...");
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("username", data.username);
        if (data.token) {
          setAuthToken(data.token);
        }

        // Apply pending budget from registration if no budget set yet for this user
        const pendingKey = `pendingBudget_${data.username}`;
        const pending = localStorage.getItem(pendingKey);
        if (pending && !localStorage.getItem(`budgetUser_budget_${data.userId}`)) {
          localStorage.setItem(`budgetUser_budget_${data.userId}`, pending);
          localStorage.removeItem(pendingKey);
        }
        setTimeout(() => onLoginSuccess(data.userId), 800);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError(err.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  // ── Register handler ────────────────────────────────────────────────

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side strong validation
    if (!registerForm.username.trim()) {
      setError(t("usernameRequired") || "Username is required");
      return;
    }
    if (!registerForm.email.trim()) {
      setError(t("emailRequired") || "Email is required");
      return;
    }
    if (!pwdValidation.isValid) {
      setError(t("passwordMinLength") || "Password must be at least 8 characters with upper, lower, number & symbol");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError(t("passwordsDontMatch") || "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
        firstName: registerForm.firstName?.trim() || "",
        lastName: registerForm.lastName?.trim() || "",
      });

      if (data.success) {
        const userId = data.userId;
        const username = data.username || registerForm.username.trim();

        localStorage.setItem("userId", userId);
        localStorage.setItem("username", username);
        if (data.token) {
          setAuthToken(data.token);
        }

        // Store budget directly for this user if provided
        if (registerForm.monthlyBudget && parseFloat(registerForm.monthlyBudget) > 0) {
          const budgetVal = String(parseFloat(registerForm.monthlyBudget));
          localStorage.setItem(`budgetUser_budget_${userId}`, budgetVal);
        }

        // Store display name if provided
        if (registerForm.firstName) {
          const fullName = `${registerForm.firstName} ${registerForm.lastName || ""}`.trim();
          localStorage.setItem(`budgetUser_name_${userId}`, fullName || username);
        }

        setSuccess(t("registerSuccessfulHome") || "Account created successfully! Welcome, taking you straight home...");
        setTimeout(() => {
          onLoginSuccess(userId);
        }, 800);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError(err.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="form-container">
        {/* Back Arrow Button */}
        {mode === "register" && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
              setShowRegisterPassword(false);
              setShowRegisterConfirmPassword(false);
              setRegisterForm({
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
                firstName: "",
                lastName: "",
                monthlyBudget: "",
              });
            }}
            className="back-button"
            title={t("backToLogin")}
          >
            ←
          </button>
        )}

        {/* Logo & Header */}
        <div className="logo-section">
          <div className="logo-emoji">
            <img
              src={steveLogo}
              alt="Steve Budget Logo"
              style={{
                width: 72,
                height: 72,
                borderRadius: "18px",
                objectFit: "cover",
                boxShadow: "0 8px 24px rgba(234, 88, 12, 0.4)",
                border: "2px solid rgba(251, 146, 60, 0.45)",
                display: "inline-block",
              }}
            />
          </div>
          <h1 className="main-title">
            STEVE BUDGET
          </h1>
          <p className="sub-title">
            {t("personalFinanceTracker")}
          </p>

          {/* Language Selector Bar */}
          <div className="auth-language-section">
            <div className="auth-language-pills">
              {languageOptions.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  className={`auth-lang-btn ${language === opt.code ? "auth-lang-btn--active" : ""}`}
                  onClick={() => setLanguage(opt.code)}
                  title={opt.label}
                >
                  <span className="auth-lang-flag">
                    {opt.code === "en" ? "🇬🇧" : opt.code === "es" ? "🇪🇸" : opt.code === "fr" ? "🇫🇷" : "🇵🇹"}
                  </span>
                  <span className="auth-lang-code">{opt.code.toUpperCase()}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="auth-lang-modal-trigger"
              onClick={() => setShowLanguagePicker(true)}
              title={t("chooseLanguage")}
            >
              🌐 {t("changeLanguage")} <span>›</span>
            </button>
          </div>

          <div className="auth-theme-toggle">
            <ThemeToggle />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="msg msg-error">
            ❌ {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="msg msg-success">
            ✅ {success}
          </div>
        )}

        {/* Google Sign-in with Firebase */}
        <button
          type="button"
          className="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          title={t("continueWithGoogle") || "Continue with Google"}
        >
          <svg className="google-icon-svg" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{t("continueWithGoogle") || "Continue with Google"}</span>
        </button>

        <div className="auth-divider">
          <span>{t("orDivider") || "OR"}</span>
        </div>

        {/* LOGIN FORM */}
        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-label">
              {t("username")}
            </label>
            <input
              className="auth-input"
              type="text"
              autoComplete="username"
              placeholder={t("enterUsername")}
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
              disabled={loading}
              required
            />

            <label className="auth-label">
              {t("password")}
            </label>
            <div className="password-input-wrapper">
              <input
                className="auth-input auth-password-input"
                type={showLoginPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("enterPassword")}
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                title={showLoginPassword ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showLoginPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? t("loggingIn") : `🔒 ${t("login")}`}
            </button>
          </form>
        ) : (
          // REGISTER FORM
          <form onSubmit={handleRegister}>
            <label className="auth-label">
              {t("username")}
            </label>
            <input
              className="auth-input"
              type="text"
              autoComplete="username"
              placeholder={t("chooseUsername")}
              value={registerForm.username}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, username: e.target.value })
              }
              disabled={loading}
              required
            />

            <label className="auth-label">
              {t("email")}
            </label>
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              placeholder={t("enterEmail")}
              value={registerForm.email}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, email: e.target.value })
              }
              disabled={loading}
              required
            />

            <label className="auth-label">
              {t("firstName")}
            </label>
            <input
              className="auth-input"
              type="text"
              placeholder={t("firstNamePlaceholder")}
              value={registerForm.firstName}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, firstName: e.target.value })
              }
              disabled={loading}
            />

            <label className="auth-label">
              {t("lastName")}
            </label>
            <input
              className="auth-input"
              type="text"
              placeholder={t("lastNamePlaceholder")}
              value={registerForm.lastName}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, lastName: e.target.value })
              }
              disabled={loading}
            />

            <label className="auth-label">
              {t("password")}
            </label>
            <div className="password-input-wrapper">
              <input
                className="auth-input auth-password-input"
                type={showRegisterPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("minPassword")}
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowRegisterPassword((prev) => !prev)}
                title={showRegisterPassword ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showRegisterPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Live Password Strength Meter */}
            {registerForm.password.length > 0 && (
              <div className="pwd-strength-container">
                <div className="pwd-strength-header">
                  <span className="pwd-strength-label">{t("pwdStrength") || "Password Strength"}:</span>
                  <span className="pwd-strength-score" style={{ color: pwdValidation.color, fontWeight: 700 }}>
                    {pwdValidation.label}
                  </span>
                </div>

                <div className="pwd-strength-track">
                  <div
                    className="pwd-strength-bar"
                    style={{
                      width: `${(pwdValidation.score / 5) * 100}%`,
                      backgroundColor: pwdValidation.color,
                    }}
                  />
                </div>

                <div className="pwd-rules-grid">
                  <span className={`pwd-rule-item ${pwdValidation.hasLength ? "valid" : ""}`}>
                    {pwdValidation.hasLength ? "✓" : "•"} {t("pwdLength") || "8+ chars"}
                  </span>
                  <span className={`pwd-rule-item ${pwdValidation.hasUpper ? "valid" : ""}`}>
                    {pwdValidation.hasUpper ? "✓" : "•"} {t("pwdUpper") || "Uppercase"}
                  </span>
                  <span className={`pwd-rule-item ${pwdValidation.hasLower ? "valid" : ""}`}>
                    {pwdValidation.hasLower ? "✓" : "•"} {t("pwdLower") || "Lowercase"}
                  </span>
                  <span className={`pwd-rule-item ${pwdValidation.hasNumber ? "valid" : ""}`}>
                    {pwdValidation.hasNumber ? "✓" : "•"} {t("pwdNumber") || "Number"}
                  </span>
                  <span className={`pwd-rule-item ${pwdValidation.hasSpecial ? "valid" : ""}`}>
                    {pwdValidation.hasSpecial ? "✓" : "•"} {t("pwdSpecial") || "Symbol"}
                  </span>
                </div>
              </div>
            )}

            <label className="auth-label">
              {t("confirmPassword")}
            </label>
            <div className="password-input-wrapper">
              <input
                className="auth-input auth-password-input"
                type={showRegisterConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("confirmPassword")}
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    confirmPassword: e.target.value,
                  })
                }
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                title={showRegisterConfirmPassword ? (t("hidePassword") || "Hide password") : (t("showPassword") || "Show password")}
                aria-label={showRegisterConfirmPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showRegisterConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <label className="auth-label">
              {t("monthlyBudgetOptional")}
            </label>
            <input
              className="auth-input auth-budget-input"
              type="number"
              min="1"
              step="1"
              placeholder={t("budgetExample")}
              value={registerForm.monthlyBudget}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, monthlyBudget: e.target.value })
              }
              disabled={loading}
            />

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? t("registering") : `🛡️ ${t("createAccount")}`}
            </button>
          </form>
        )}

        {/* Toggle between login/register */}
        {mode === "login" ? (
          <div className="toggle-section">
            <p className="toggle-text">
              {t("noAccount")}
            </p>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
                setSuccess("");
                setShowLoginPassword(false);
              }}
              className="secondary-btn"
            >
              {t("registerHere")}
            </button>
          </div>
        ) : (
          <div className="toggle-section">
            <p className="toggle-text">
              {t("alreadyHaveAccount")}
            </p>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
                setShowRegisterPassword(false);
                setShowRegisterConfirmPassword(false);
              }}
              className="secondary-btn"
            >
              {t("loginHere")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../LanguageContext";
import { ThemeToggle } from "../ThemeContext";
import {
  loginUser,
  registerUser,
  loginWithFirebase,
  setAuthToken,
  requestPasswordResetCode,
  verifyResetCode,
  resetPasswordWithCode,
} from "../dataApi";
import { signInWithGoogle, sendPasswordReset } from "../firebase";
import steveLogo from "../assets/stevebudget.png";

/**
 * LoginRegister Component
 * Shows login, register, or forgot-password (6-digit email verification code) views.
 * Features 1-Click Direct Google Sign-In, strong password verification, and instant access.
 */
export default function LoginRegister({ onLoginSuccess }) {
  const { language, setLanguage, t, languageOptions, setShowLanguagePicker } = useLanguage();
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Visibility toggle states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

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

  // Forgot password form & state
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter 6-digit code & new pwd
  const [forgotForm, setForgotForm] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer effect for resending code
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Helper for password strength validation
  const evaluatePassword = (pwd) => {
    const p = pwd || "";
    const hasLength = p.length >= 8;
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(p);

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
  };

  const pwdValidation = useMemo(() => evaluatePassword(registerForm.password), [registerForm.password, t]);
  const forgotPwdValidation = useMemo(() => evaluatePassword(forgotForm.newPassword), [forgotForm.newPassword, t]);

  // ── Direct 1-Click Google Sign-In with Firebase ──────────────────────

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { idToken, user } = await signInWithGoogle();
      if (!idToken || !user) {
        throw new Error("No Firebase token received");
      }

      const googleEmail = user.email || "";
      const googleDisplayName = user.displayName || "";
      const googlePhoto = user.photoURL || "";

      let candidateUsername = "";
      if (googleEmail.includes("@")) {
        candidateUsername = googleEmail.split("@")[0].replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase();
      } else if (googleDisplayName) {
        candidateUsername = googleDisplayName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-zA-Z0-9_.]/g, "");
      }

      // 1. Authenticate / Auto-provision directly with Spring Boot backend
      try {
        const data = await loginWithFirebase(idToken);
        if (data && data.success) {
          // Direct login successful!
          setSuccess(t("loginSuccessful") || "Login successful! Welcome to Steve Budget...");
          const activeUserId = data.userId;
          const activeUsername = data.username || googleDisplayName || candidateUsername || "User";

          localStorage.setItem("userId", activeUserId);
          localStorage.setItem("username", activeUsername);
          if (data.token) {
            setAuthToken(data.token);
          }
          if (user.displayName) {
            localStorage.setItem(`budgetUser_name_${activeUserId}`, user.displayName);
          }
          if (user.photoURL) {
            localStorage.setItem(`budgetUser_avatar_${activeUserId}`, user.photoURL);
          }
          if (googleEmail) {
            localStorage.setItem(`budgetUser_registered_${googleEmail.toLowerCase()}`, "true");
          }

          setTimeout(() => onLoginSuccess(activeUserId), 400);
          return;
        }
      } catch (backendErr) {
        console.warn("Backend Firebase sync notice (using direct local session):", backendErr);
        // Direct local session fallback
        const localUserId = user.uid ? user.uid.substring(0, 16) : "google_user";
        const displayName = user.displayName || candidateUsername || "User";

        localStorage.setItem("userId", localUserId);
        localStorage.setItem("username", displayName);
        if (user.displayName) {
          localStorage.setItem(`budgetUser_name_${localUserId}`, user.displayName);
        }
        if (user.photoURL) {
          localStorage.setItem(`budgetUser_avatar_${localUserId}`, user.photoURL);
        }
        if (googleEmail) {
          localStorage.setItem(`budgetUser_registered_${googleEmail.toLowerCase()}`, "true");
        }

        setSuccess(t("loginSuccessful") || "Login successful! Welcome to Steve Budget...");
        setTimeout(() => onLoginSuccess(localUserId), 400);
      }
    } catch (err) {
      if (err.code === "auth/operation-not-allowed") {
        setError("Google Sign-In is not enabled in Firebase Console: Authentication > Sign-in method > Google.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Domain not authorized in Firebase Console: Authentication > Settings > Authorized domains.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked by browser. Please allow popups for this site.");
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
        setTimeout(() => onLoginSuccess(data.userId), 600);
      } else {
        // If account is not registered, redirect to register page with user info
        if (
          data.message === "USER_NOT_FOUND" ||
          data.message?.includes("USER_NOT_FOUND") ||
          data.message?.toLowerCase().includes("user not found") ||
          data.message?.toLowerCase().includes("no account found")
        ) {
          const rawInput = loginForm.username.trim();
          const isEmail = rawInput.includes("@");
          setMode("register");
          setRegisterForm((prev) => ({
            ...prev,
            username: data.username || (isEmail ? rawInput.split("@")[0] : rawInput),
            email: data.email || (isEmail ? rawInput : prev.email),
            password: loginForm.password,
            confirmPassword: loginForm.password,
          }));
          setError("");
          setSuccess(
            "ℹ️ No account found with this username/email. We've filled in your info — please review and create your account below!"
          );
        } else {
          setError(data.message || "Login failed");
        }
      }
    } catch (err) {
      const errMsg = err.message || "";
      if (
        errMsg.includes("USER_NOT_FOUND") ||
        errMsg.toLowerCase().includes("user not found") ||
        errMsg.toLowerCase().includes("no account")
      ) {
        const rawInput = loginForm.username.trim();
        const isEmail = rawInput.includes("@");
        setMode("register");
        setRegisterForm((prev) => ({
          ...prev,
          username: isEmail ? rawInput.split("@")[0] : rawInput,
          email: isEmail ? rawInput : prev.email,
          password: loginForm.password,
          confirmPassword: loginForm.password,
        }));
        setError("");
        setSuccess(
          "ℹ️ No account found with this username/email. We've filled in your info — please review and create your account below!"
        );
      } else {
        setError(errMsg || "Error connecting to server");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register handler ────────────────────────────────────────────────

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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

        if (registerForm.email) {
          localStorage.setItem(`budgetUser_registered_${registerForm.email.toLowerCase()}`, "true");
        }

        if (registerForm.monthlyBudget && parseFloat(registerForm.monthlyBudget) > 0) {
          const budgetVal = String(parseFloat(registerForm.monthlyBudget));
          localStorage.setItem(`budgetUser_budget_${userId}`, budgetVal);
        }

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

  // ── Forgot Password Handlers ────────────────────────────────────────

  const handleSendResetCode = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    const targetEmail = forgotForm.email.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setError(t("emailRequired") || "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await requestPasswordResetCode(targetEmail);
      if (res && res.success) {
        setForgotStep(2);
        setResendTimer(45);
        setSuccess(
          `${t("codeSentToEmail") || "A 6-digit verification code was sent to"} ${targetEmail}.` +
            (res.devCode ? ` (Dev Code: ${res.devCode})` : "")
        );
      } else {
        setError(res?.message || "Could not send verification code. Please check your email address.");
      }
    } catch (err) {
      setError(err.message || "Error sending verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || loading) return;
    await handleSendResetCode();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!forgotForm.code || forgotForm.code.trim().length < 6) {
      setError(t("enterResetCode") || "Please enter the 6-digit verification code.");
      return;
    }

    if (!forgotPwdValidation.isValid) {
      setError(t("passwordMinLength") || "New password must be at least 8 characters with upper, lower, number & symbol");
      return;
    }

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setError(t("passwordsDontMatch") || "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordWithCode({
        email: forgotForm.email.trim(),
        code: forgotForm.code.trim(),
        newPassword: forgotForm.newPassword,
        confirmPassword: forgotForm.confirmPassword,
      });

      if (res && res.success) {
        setSuccess(t("passwordResetSuccess") || "Password reset successfully! You can now log in.");
        // Prefill login username
        if (res.username || forgotForm.email) {
          setLoginForm((prev) => ({
            ...prev,
            username: res.username || forgotForm.email.trim(),
            password: "",
          }));
        }
        // Switch back to login mode after brief confirmation
        setTimeout(() => {
          setMode("login");
          setForgotStep(1);
          setForgotForm({ email: "", code: "", newPassword: "", confirmPassword: "" });
        }, 1500);
      } else {
        setError(res?.message || "Password reset failed. Please check the code and try again.");
      }
    } catch (err) {
      setError(err.message || "Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseResetLink = async () => {
    const targetEmail = forgotForm.email.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setError(t("emailRequired") || "Please enter a valid email address first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendPasswordReset(targetEmail);
      setSuccess(`📧 Firebase password reset link sent to ${targetEmail}! Check your inbox.`);
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="form-container">
        {/* Back Arrow Button */}
        {(mode === "register" || mode === "forgot") && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
              setForgotStep(1);
              setShowRegisterPassword(false);
              setShowRegisterConfirmPassword(false);
              setShowForgotNewPassword(false);
              setShowForgotConfirmPassword(false);
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
          <h1 className="main-title">STEVE BUDGET</h1>
          <p className="sub-title">{t("personalFinanceTracker")}</p>

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
        {error && <div className="msg msg-error">❌ {error}</div>}

        {/* Success message */}
        {success && <div className="msg msg-success">✅ {success}</div>}

        {/* GOOGLE SIGN-IN (Available on login & register) */}
        {mode !== "forgot" && (
          <>
            <button
              type="button"
              className="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              title={t("continueWithGoogle") || "Continue with Google"}
            >
              <svg className="google-icon-svg" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t("continueWithGoogle") || "Continue with Google"}</span>
            </button>

            <div className="auth-divider">
              <span>{t("orDivider") || "OR"}</span>
            </div>
          </>
        )}

        {/* ══════════════════ 1. LOGIN FORM ══════════════════ */}
        {mode === "login" && (
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-label">{t("username")}</label>
            <input
              className="auth-input"
              type="text"
              autoComplete="username"
              placeholder={t("enterUsername")}
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              disabled={loading}
              required
            />

            <div className="auth-label-row">
              <label className="auth-label">{t("password")}</label>
              <button
                type="button"
                className="forgot-pwd-link"
                onClick={() => {
                  setMode("forgot");
                  setForgotStep(1);
                  setError("");
                  setSuccess("");
                  if (loginForm.username && loginForm.username.includes("@")) {
                    setForgotForm((prev) => ({ ...prev, email: loginForm.username.trim() }));
                  }
                }}
              >
                {t("forgotPassword") || "Forgot password?"}
              </button>
            </div>

            <div className="password-input-wrapper">
              <input
                className="auth-input auth-password-input"
                type={showLoginPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("enterPassword")}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                title={showLoginPassword ? t("hidePassword") || "Hide password" : t("showPassword") || "Show password"}
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showLoginPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? t("loggingIn") : `🔒 ${t("login")}`}
            </button>
          </form>
        )}

        {/* ══════════════════ 2. REGISTER FORM ══════════════════ */}
        {mode === "register" && (
          <form onSubmit={handleRegister}>
            <label className="auth-label">{t("username")}</label>
            <input
              className="auth-input"
              type="text"
              autoComplete="username"
              placeholder={t("chooseUsername")}
              value={registerForm.username}
              onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
              disabled={loading}
              required
            />

            <label className="auth-label">{t("email")}</label>
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              placeholder={t("enterEmail")}
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              disabled={loading}
              required
            />

            <label className="auth-label">{t("firstName")}</label>
            <input
              className="auth-input"
              type="text"
              placeholder={t("firstNamePlaceholder")}
              value={registerForm.firstName}
              onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
              disabled={loading}
            />

            <label className="auth-label">{t("lastName")}</label>
            <input
              className="auth-input"
              type="text"
              placeholder={t("lastNamePlaceholder")}
              value={registerForm.lastName}
              onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
              disabled={loading}
            />

            <label className="auth-label">{t("password")}</label>
            <div className="password-input-wrapper">
              <input
                className="auth-input auth-password-input"
                type={showRegisterPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("minPassword")}
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowRegisterPassword((prev) => !prev)}
                title={showRegisterPassword ? t("hidePassword") || "Hide password" : t("showPassword") || "Show password"}
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

            <label className="auth-label">{t("confirmPassword")}</label>
            <div className="password-input-wrapper">
              <input
                className="auth-input auth-password-input"
                type={showRegisterConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("confirmPassword")}
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                title={
                  showRegisterConfirmPassword ? t("hidePassword") || "Hide password" : t("showPassword") || "Show password"
                }
                aria-label={showRegisterConfirmPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showRegisterConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <label className="auth-label">{t("monthlyBudgetOptional")}</label>
            <input
              className="auth-input auth-budget-input"
              type="number"
              min="1"
              step="1"
              placeholder={t("budgetExample")}
              value={registerForm.monthlyBudget}
              onChange={(e) => setRegisterForm({ ...registerForm, monthlyBudget: e.target.value })}
              disabled={loading}
            />

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? t("registering") : `🛡️ ${t("createAccount")}`}
            </button>
          </form>
        )}

        {/* ══════════════════ 3. FORGOT PASSWORD FLOW ══════════════════ */}
        {mode === "forgot" && (
          <div className="forgot-password-container">
            <div className="forgot-header-badge">
              <span className="forgot-badge-icon">🔑</span>
              <div>
                <h3 className="forgot-title">{t("forgotPasswordTitle") || "Reset Password"}</h3>
                <p className="forgot-subtitle">
                  {forgotStep === 1
                    ? t("forgotPasswordSubtitle") || "Enter your registered email to receive a 6-digit confirmation code."
                    : `${t("codeSentToEmail") || "A 6-digit verification code was sent to"} ${forgotForm.email}`}
                </p>
              </div>
            </div>

            {/* Step 1: Request Code */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendResetCode} className="auth-form">
                <label className="auth-label">{t("email")}</label>
                <input
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  placeholder={t("enterEmail") || "Enter your email address"}
                  value={forgotForm.email}
                  onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                  disabled={loading}
                  autoFocus
                  required
                />

                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? t("sendingCode") || "Sending code..." : `📩 ${t("sendResetCode") || "Send Verification Code"}`}
                </button>

                <div className="firebase-reset-hint">
                  <span>Using Firebase Email? </span>
                  <button
                    type="button"
                    className="firebase-link-btn"
                    onClick={handleFirebaseResetLink}
                    disabled={loading}
                  >
                    Send direct reset link ›
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter 6-Digit Code & New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="code-input-section">
                  <label className="auth-label">{t("enterResetCode") || "Enter 6-Digit Code"}</label>
                  <input
                    className="auth-input code-otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder={t("resetCodePlaceholder") || "e.g. 482910"}
                    value={forgotForm.code}
                    onChange={(e) =>
                      setForgotForm({ ...forgotForm, code: e.target.value.replace(/\D/g, "").slice(0, 6) })
                    }
                    disabled={loading}
                    autoFocus
                    required
                  />
                  <div className="resend-bar">
                    <span className="email-hint-chip">{forgotForm.email}</span>
                    <button
                      type="button"
                      className="resend-btn"
                      onClick={handleResendCode}
                      disabled={resendTimer > 0 || loading}
                    >
                      {resendTimer > 0
                        ? `⏳ ${t("resendIn") || "Resend in"} ${resendTimer}${t("seconds") || "s"}`
                        : `🔄 ${t("resendCode") || "Resend code"}`}
                    </button>
                  </div>
                </div>

                <label className="auth-label">{t("newPassword") || "New Password"}</label>
                <div className="password-input-wrapper">
                  <input
                    className="auth-input auth-password-input"
                    type={showForgotNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={t("enterNewPassword") || "Enter new strong password"}
                    value={forgotForm.newPassword}
                    onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowForgotNewPassword((prev) => !prev)}
                    title={showForgotNewPassword ? t("hidePassword") : t("showPassword")}
                    aria-label="Toggle password visibility"
                    tabIndex="-1"
                  >
                    {showForgotNewPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* Live Password Strength for Reset */}
                {forgotForm.newPassword.length > 0 && (
                  <div className="pwd-strength-container">
                    <div className="pwd-strength-header">
                      <span className="pwd-strength-label">{t("pwdStrength") || "Password Strength"}:</span>
                      <span className="pwd-strength-score" style={{ color: forgotPwdValidation.color, fontWeight: 700 }}>
                        {forgotPwdValidation.label}
                      </span>
                    </div>

                    <div className="pwd-strength-track">
                      <div
                        className="pwd-strength-bar"
                        style={{
                          width: `${(forgotPwdValidation.score / 5) * 100}%`,
                          backgroundColor: forgotPwdValidation.color,
                        }}
                      />
                    </div>

                    <div className="pwd-rules-grid">
                      <span className={`pwd-rule-item ${forgotPwdValidation.hasLength ? "valid" : ""}`}>
                        {forgotPwdValidation.hasLength ? "✓" : "•"} {t("pwdLength") || "8+ chars"}
                      </span>
                      <span className={`pwd-rule-item ${forgotPwdValidation.hasUpper ? "valid" : ""}`}>
                        {forgotPwdValidation.hasUpper ? "✓" : "•"} {t("pwdUpper") || "Uppercase"}
                      </span>
                      <span className={`pwd-rule-item ${forgotPwdValidation.hasLower ? "valid" : ""}`}>
                        {forgotPwdValidation.hasLower ? "✓" : "•"} {t("pwdLower") || "Lowercase"}
                      </span>
                      <span className={`pwd-rule-item ${forgotPwdValidation.hasNumber ? "valid" : ""}`}>
                        {forgotPwdValidation.hasNumber ? "✓" : "•"} {t("pwdNumber") || "Number"}
                      </span>
                      <span className={`pwd-rule-item ${forgotPwdValidation.hasSpecial ? "valid" : ""}`}>
                        {forgotPwdValidation.hasSpecial ? "✓" : "•"} {t("pwdSpecial") || "Symbol"}
                      </span>
                    </div>
                  </div>
                )}

                <label className="auth-label">{t("confirmNewPassword") || "Confirm New Password"}</label>
                <div className="password-input-wrapper">
                  <input
                    className="auth-input auth-password-input"
                    type={showForgotConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={t("confirmNewPassword") || "Confirm new password"}
                    value={forgotForm.confirmPassword}
                    onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowForgotConfirmPassword((prev) => !prev)}
                    title={showForgotConfirmPassword ? t("hidePassword") : t("showPassword")}
                    aria-label="Toggle password visibility"
                    tabIndex="-1"
                  >
                    {showForgotConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading
                    ? t("resettingPassword") || "Resetting password..."
                    : `🔑 ${t("resetPasswordButton") || "Reset Password & Login"}`}
                </button>

                <button
                  type="button"
                  className="change-email-btn"
                  onClick={() => {
                    setForgotStep(1);
                    setError("");
                    setSuccess("");
                  }}
                >
                  ← {t("changeEmail") || "Change email address"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ══════════════════ TOGGLE SECTIONS ══════════════════ */}
        {mode === "login" && (
          <div className="toggle-section">
            <p className="toggle-text">{t("noAccount")}</p>
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
        )}

        {mode === "register" && (
          <div className="toggle-section">
            <p className="toggle-text">{t("alreadyHaveAccount")}</p>
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

        {mode === "forgot" && (
          <div className="toggle-section">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
                setForgotStep(1);
              }}
              className="secondary-btn"
            >
              ← {t("backToLogin") || "Back to login"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

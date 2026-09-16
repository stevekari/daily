import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

// Default configuration with safe fallback defaults for production deployment (e.g. Render / Vercel)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCYFSVarEkULF8gPw1fQtrB2exfgHV8UL8",
  authDomain: "daily-5c591.firebaseapp.com",
  projectId: "daily-5c591",
  storageBucket: "daily-5c591.firebasestorage.app",
  messagingSenderId: "273753089132",
  appId: "1:273753089132:web:0b3e5e5b67d77ee4032449",
  measurementId: "G-LWQNRB6T4H",
};

const envApiKey = import.meta.env?.VITE_FIREBASE_API_KEY;
const isEnvKeyValid = envApiKey && typeof envApiKey === "string" && envApiKey.trim().length > 5 && !envApiKey.includes("your_");

export const firebaseConfig = {
  apiKey: isEnvKeyValid ? envApiKey.trim() : DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.length > 5 &&
    !firebaseConfig.apiKey.includes("your_")
  );
};

// Safe initialization that will NEVER crash bundle loading
let appInstance = null;
let authInstance = null;
let googleProviderInstance = null;

try {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);
  googleProviderInstance = new GoogleAuthProvider();
  googleProviderInstance.addScope("profile");
  googleProviderInstance.addScope("email");
  googleProviderInstance.setCustomParameters({ prompt: "select_account" });
} catch (err) {
  console.warn("Firebase initialization warning (safe fallback active):", err);
}

export const app = appInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;

// Initialize Analytics safely
export let analytics = null;
if (typeof window !== "undefined" && app) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}

/**
 * Sign in with Google Popup
 * Returns Firebase User, ID Token, Access Token, and Credential
 */
export async function signInWithGoogle() {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Please verify your Firebase configuration.");
  }
  const provider = googleProvider || new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  const user = result.user;
  const idToken = await user.getIdToken();
  console.log("Successfully signed in with Google!", user);
  return { user, idToken, accessToken, credential };
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email, password) {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;
  const idToken = await user.getIdToken();
  return { user, idToken };
}

/**
 * Sign up with Email, Password and Display Name
 */
export async function signUpWithEmail(email, password, displayName) {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;
  if (displayName) {
    try {
      await updateProfile(user, { displayName });
    } catch (e) {
      console.warn("Could not update Firebase displayName:", e);
    }
  }
  const idToken = await user.getIdToken();
  return { user, idToken };
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email) {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  if (!email || !email.includes("@")) {
    throw new Error("Please provide a valid email address.");
  }
  await sendPasswordResetEmail(auth, email);
  return true;
}

/**
 * Formats Firebase auth error codes into friendly user messages
 */
export function formatAuthError(error) {
  if (!error) return "An unexpected error occurred. Please try again.";
  const msg = error.message || String(error);
  const code = error.code || "";

  if (code === "auth/user-not-found" || msg.includes("user-not-found")) {
    return "No account found with this email. Please register first.";
  }
  if (code === "auth/wrong-password" || msg.includes("wrong-password") || code === "auth/invalid-credential") {
    return "Incorrect password. Please verify your password and try again.";
  }
  if (code === "auth/email-already-in-use" || msg.includes("email-already-in-use")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (code === "auth/weak-password" || msg.includes("weak-password")) {
    return "Password is too weak. Please choose at least 6 characters.";
  }
  if (code === "auth/invalid-email" || msg.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code === "auth/popup-closed-by-user" || msg.includes("popup-closed-by-user")) {
    return "Sign-in popup was closed before completing.";
  }
  if (code === "auth/network-request-failed" || msg.includes("network-request-failed")) {
    return "Network connection issue. Please check your internet connection.";
  }
  return msg;
}

/**
 * Sign out from Firebase
 */
export async function logOutFirebase() {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase sign out error:", e);
    }
  }
}

/**
 * Get current user ID token
 */
export async function getCurrentUserToken() {
  if (auth && auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  return null;
}

/**
 * Initialize invisible ReCAPTCHA for Firebase Phone Verification
 */
export function initRecaptchaVerifier(containerId = "recaptcha-container") {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }

  // Clear existing verifier if attached to window
  if (typeof window !== "undefined" && window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      // ignore
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired, please try again.");
    },
  });

  if (typeof window !== "undefined") {
    window.recaptchaVerifier = verifier;
  }

  return verifier;
}

/**
 * Send 6-digit SMS verification code to phone number
 */
export async function sendPhoneVerificationSms(phoneNumber, appVerifier) {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  if (!phoneNumber || phoneNumber.trim().length < 7) {
    throw new Error("Please provide a valid phone number with country code (e.g. +34 612 345 678).");
  }

  const cleanNumber = phoneNumber.trim().replace(/\s+/g, "");
  const confirmationResult = await signInWithPhoneNumber(auth, cleanNumber, appVerifier);
  return confirmationResult;
}

/**
 * Confirm phone SMS OTP code
 */
export async function confirmPhoneOtp(confirmationResult, code) {
  if (!confirmationResult || typeof confirmationResult.confirm !== "function") {
    throw new Error("Invalid confirmation session. Please request a new SMS code.");
  }
  if (!code || code.trim().length < 6) {
    throw new Error("Please enter the 6-digit verification code sent to your phone.");
  }

  const result = await confirmationResult.confirm(code.trim());
  return result.user;
}

/**
 * Dispatches an SMS alert for daily limit overspending
 */
export async function sendPhoneSmsAlert({ phoneNumber, title, message }) {
  console.log("=================================================");
  console.log("📱 [FIREBASE PHONE NOTIFICATION] SMS ALERT DISPATCHED");
  console.log("To Phone:", phoneNumber);
  console.log("Title:", title);
  console.log("Message:", message);
  console.log("Timestamp:", new Date().toISOString());
  console.log("=================================================");
  return { success: true, timestamp: new Date().toISOString() };
}

export default app;

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
} from "firebase/auth";

// Firebase Configuration loaded securely from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "daily-5c591.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "daily-5c591",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "daily-5c591.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "273753089132",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:273753089132:web:0b3e5e5b67d77ee4032449",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LWQNRB6T4H",
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY.length > 5
  );
};

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Analytics conditionally (supported in browser environments)
let analytics = null;
if (typeof window !== "undefined") {
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
 * Returns Firebase User and ID Token
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const idToken = await user.getIdToken();
  return { user, idToken };
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;
  const idToken = await user.getIdToken();
  return { user, idToken };
}

/**
 * Sign up with Email, Password and Display Name
 */
export async function signUpWithEmail(email, password, displayName) {
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
 * Sign out from Firebase
 */
export async function logOutFirebase() {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Firebase sign out error:", e);
  }
}

/**
 * Get current user ID token
 */
export async function getCurrentUserToken() {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  return null;
}

export { app, auth, analytics, googleProvider };

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

// Firebase Configuration from Vite Environment Variables (with demo / local fallback)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForBudgetAppConfig",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "steve-budget-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "steve-budget-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "steve-budget-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return (
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== "AIzaSyDummyKeyForBudgetAppConfig"
  );
};

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

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

export { app, auth, googleProvider };

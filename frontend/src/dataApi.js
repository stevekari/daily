const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? window.location.port === "5173" || window.location.port === "3000"
      ? "http://localhost:8080/api"
      : "/api"
    : "/api");

// Server connectivity tracking & circuit breaker
let isBackendAvailable = true;
let lastOfflineCheckTimestamp = 0;
const RETRY_INTERVAL_MS = 30000; // Retry backend every 30s when offline

export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken") || "";
  }
  return "";
}

export function setAuthToken(token) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
  }
}

function getStoredUserId() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("userId") || "local_user";
  }
  return "local_user";
}

// ── LOCAL STORAGE FALLBACK HELPERS ───────────────────────────────────────────
function getLocalTxs(userId) {
  if (typeof window === "undefined") return [];
  const uid = userId || getStoredUserId();
  try {
    const raw = localStorage.getItem(`budgetUser_txs_${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTxs(userId, txs) {
  if (typeof window === "undefined") return;
  const uid = userId || getStoredUserId();
  try {
    localStorage.setItem(`budgetUser_txs_${uid}`, JSON.stringify(txs));
  } catch {
    // ignore quota errors
  }
}

// ── HTTP REQUEST WRAPPER ────────────────────────────────────────────────────
async function request(path, options = {}) {
  const now = Date.now();
  // If backend was detected as unreachable recently, don't spam failed fetch requests
  if (!isBackendAvailable && now - lastOfflineCheckTimestamp < RETRY_INTERVAL_MS) {
    const err = new Error("Backend server unreachable (local mode)");
    err.isConnectionError = true;
    throw err;
  }

  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
    isBackendAvailable = true;
  } catch (netErr) {
    isBackendAvailable = false;
    lastOfflineCheckTimestamp = Date.now();
    const err = new Error(netErr.message || "Failed to fetch");
    err.isConnectionError = true;
    throw err;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) {
    if (!path.startsWith("/auth/")) {
      clearAuthSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ── AUTH ENDPOINTS ──────────────────────────────────────────────────────────
export function loginUser(credentials) {
  return request("/auth/login", jsonOptions("POST", credentials));
}

export function loginWithFirebase(idToken) {
  return request("/auth/firebase", jsonOptions("POST", { idToken }));
}

export function registerUser(user) {
  return request("/auth/register", jsonOptions("POST", user));
}

export function requestPasswordResetCode(email) {
  return request("/auth/forgot-password", jsonOptions("POST", { email }));
}

export function verifyResetCode(email, code) {
  return request("/auth/verify-reset-code", jsonOptions("POST", { email, code }));
}

export function resetPasswordWithCode({ email, code, newPassword, confirmPassword }) {
  return request("/auth/reset-password", jsonOptions("POST", { email, code, newPassword, confirmPassword }));
}

// ── BUDGET ENDPOINTS (WITH RESILIENT LOCAL FALLBACK) ────────────────────────
export async function getUserBudgets(userId) {
  const uid = userId || getStoredUserId();
  try {
    const data = await request("/budget/user/0");
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // fallback to local budget
  }
  const localBudget = typeof window !== "undefined" ? localStorage.getItem(`budgetUser_budget_${uid}`) : null;
  const localDaily = typeof window !== "undefined" ? localStorage.getItem(`budgetUser_dailyLimit_${uid}`) : null;
  if (localBudget) {
    return [
      {
        id: 1,
        name: "Main Budget",
        totalBudget: parseFloat(localBudget) || 1500,
        monthlyLimit: parseFloat(localBudget) || 1500,
        dailyLimit: parseFloat(localDaily) || (parseFloat(localBudget) / 30),
      },
    ];
  }
  return [];
}

export async function createBudget(budget) {
  const payload = { ...budget };
  const uid = payload.userId || getStoredUserId();
  if (payload.userId && (isNaN(parseInt(payload.userId, 10)) || Number(payload.userId) <= 0)) {
    delete payload.userId;
  }

  if (typeof window !== "undefined") {
    if (payload.totalBudget) localStorage.setItem(`budgetUser_budget_${uid}`, String(payload.totalBudget));
    if (payload.dailyLimit) localStorage.setItem(`budgetUser_dailyLimit_${uid}`, String(payload.dailyLimit));
  }

  try {
    return await request("/budget", jsonOptions("POST", payload));
  } catch {
    return { ...payload, id: payload.id || 1 };
  }
}

export async function createOrUpdateBudget(budget) {
  const payload = { ...budget };
  const uid = payload.userId || getStoredUserId();
  if (payload.userId && (isNaN(parseInt(payload.userId, 10)) || Number(payload.userId) <= 0)) {
    delete payload.userId;
  }

  if (typeof window !== "undefined") {
    if (payload.totalBudget) localStorage.setItem(`budgetUser_budget_${uid}`, String(payload.totalBudget));
    if (payload.dailyLimit) localStorage.setItem(`budgetUser_dailyLimit_${uid}`, String(payload.dailyLimit));
  }

  try {
    return await request("/budget/create-or-update", jsonOptions("POST", payload));
  } catch {
    return { ...payload, id: payload.id || 1 };
  }
}

export async function updateBudget(budgetId, budget) {
  const payload = { ...budget };
  const uid = payload.userId || getStoredUserId();
  if (typeof window !== "undefined") {
    if (payload.totalBudget) localStorage.setItem(`budgetUser_budget_${uid}`, String(payload.totalBudget));
    if (payload.dailyLimit) localStorage.setItem(`budgetUser_dailyLimit_${uid}`, String(payload.dailyLimit));
  }
  try {
    return await request(`/budget/${budgetId}`, jsonOptions("PUT", payload));
  } catch {
    return { ...payload, id: budgetId };
  }
}

export async function getBudgetSummary(budgetId) {
  try {
    return await request(`/budget/${budgetId}/summary`);
  } catch {
    return null;
  }
}

export async function deleteBudget(budgetId) {
  try {
    return await request(`/budget/${budgetId}`, { method: "DELETE" });
  } catch {
    return { success: true, id: budgetId };
  }
}

// ── TRANSACTION ENDPOINTS (WITH RESILIENT LOCAL FALLBACK) ───────────────────
export async function getUserTransactions(userId) {
  const uid = userId || getStoredUserId();
  try {
    if (uid && !isNaN(parseInt(uid, 10)) && Number(uid) > 0) {
      const data = await request(`/transactions/user/${uid}`);
      if (Array.isArray(data)) {
        saveLocalTxs(uid, data);
        return data;
      }
    } else {
      const data = await request("/transactions");
      if (Array.isArray(data)) {
        saveLocalTxs(uid, data);
        return data;
      }
    }
  } catch {
    // silent fallback to local storage
  }
  return getLocalTxs(uid);
}

export async function createTransaction(transaction) {
  const payload = { ...transaction };
  const uid = payload.userId || getStoredUserId();
  if (payload.userId && (isNaN(parseInt(payload.userId, 10)) || Number(payload.userId) <= 0)) {
    delete payload.userId;
  }

  // Generate fallback local record
  const localTx = {
    ...payload,
    id: payload.id || Date.now(),
    dateTime: payload.dateTime || payload.date || new Date().toISOString(),
  };

  try {
    const saved = await request("/transactions", jsonOptions("POST", payload));
    if (saved && (saved.id || saved.name)) {
      const existing = getLocalTxs(uid).filter((t) => t.id !== localTx.id && t.id !== saved.id);
      saveLocalTxs(uid, [saved, ...existing]);
      return saved;
    }
  } catch {
    // Save locally
    const existing = getLocalTxs(uid).filter((t) => t.id !== localTx.id);
    saveLocalTxs(uid, [localTx, ...existing]);
  }

  return localTx;
}

export async function deleteTransaction(transactionId) {
  const uid = getStoredUserId();
  try {
    await request(`/transactions/${transactionId}`, { method: "DELETE" });
  } catch {
    // ignore network error
  }
  const filtered = getLocalTxs(uid).filter((t) => String(t.id) !== String(transactionId));
  saveLocalTxs(uid, filtered);
  return { success: true, id: transactionId };
}

export async function updateTransaction(transactionId, changes) {
  const uid = getStoredUserId();
  let updatedRecord = { ...changes, id: transactionId };
  try {
    const res = await request(`/transactions/${transactionId}`, jsonOptions("PUT", changes));
    if (res && res.id) updatedRecord = res;
  } catch {
    // ignore network error
  }

  const updatedList = getLocalTxs(uid).map((t) =>
    String(t.id) === String(transactionId) ? { ...t, ...updatedRecord } : t
  );
  saveLocalTxs(uid, updatedList);
  return updatedRecord;
}

export async function importTransactionsBatch(transactionsList) {
  const uid = getStoredUserId();
  try {
    const res = await request("/transactions/batch", jsonOptions("POST", transactionsList));
    if (Array.isArray(res)) {
      const current = getLocalTxs(uid);
      saveLocalTxs(uid, [...res, ...current]);
      return res;
    }
  } catch {
    // fallback
  }

  const generated = transactionsList.map((tx, idx) => ({
    ...tx,
    id: Date.now() + idx,
  }));
  const current = getLocalTxs(uid);
  saveLocalTxs(uid, [...generated, ...current]);
  return generated;
}

// ── CATEGORIES ENDPOINTS ────────────────────────────────────────────────────
export async function getCategories() {
  try {
    return await request("/categories");
  } catch {
    return [];
  }
}

export async function createCategory(category) {
  try {
    return await request("/categories", jsonOptions("POST", category));
  } catch {
    return { ...category, id: Date.now() };
  }
}

export async function updateCategory(categoryId, category) {
  try {
    return await request(`/categories/${categoryId}`, jsonOptions("PUT", category));
  } catch {
    return { ...category, id: categoryId };
  }
}

export async function deleteCategory(categoryId) {
  try {
    return await request(`/categories/${categoryId}`, { method: "DELETE" });
  } catch {
    return { success: true, id: categoryId };
  }
}

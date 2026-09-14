const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? window.location.port === "5173" || window.location.port === "3000"
      ? "http://localhost:8080/api"
      : "/api"
    : "/api");

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

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) {
    // If not calling public auth endpoints, trigger unauthorized session event
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

export function loginUser(credentials) {
  return request("/auth/login", jsonOptions("POST", credentials));
}

export function registerUser(user) {
  return request("/auth/register", jsonOptions("POST", user));
}

export function getUserBudgets(userId) {
  return request(`/budget/user/${userId}`);
}

export function createBudget(budget) {
  return request("/budget", jsonOptions("POST", budget));
}

export function createOrUpdateBudget(budget) {
  return request("/budget/create-or-update", jsonOptions("POST", budget));
}

export function updateBudget(budgetId, budget) {
  return request(`/budget/${budgetId}`, jsonOptions("PUT", budget));
}

export function getBudgetSummary(budgetId) {
  return request(`/budget/${budgetId}/summary`);
}

export function getUserTransactions(userId) {
  return request(`/transactions/user/${userId}`);
}

export function createTransaction(transaction) {
  return request("/transactions", jsonOptions("POST", transaction));
}

export function deleteTransaction(transactionId) {
  return request(`/transactions/${transactionId}`, { method: "DELETE" });
}

export function updateTransaction(transactionId, changes) {
  return request(`/transactions/${transactionId}`, jsonOptions("PUT", changes));
}

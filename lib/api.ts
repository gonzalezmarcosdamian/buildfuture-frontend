import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

async function authHeaders(): Promise<HeadersInit> {
  // Dev mock: usa X-Mock-User header en lugar de JWT
  if (MOCK_AUTH && typeof window !== "undefined") {
    const mockUser = localStorage.getItem("bf_mock_user");
    return mockUser ? { "X-Mock-User": mockUser } : {};
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Solo para desarrollo — cambia la persona activa sin recargar */
export function setMockUser(alias: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("bf_mock_user", alias);
  }
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...opts,
    headers: { ...headers, ...(opts.headers ?? {}) },
  });
  return res;
}

export async function fetchFreedomScore() {
  const res = await apiFetch("/portfolio/freedom-score");
  if (!res.ok) throw new Error("Failed to fetch freedom score");
  return res.json();
}

export async function fetchPortfolio() {
  const res = await apiFetch("/portfolio/");
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json();
}

export async function fetchBudget() {
  const res = await apiFetch("/budget/");
  if (!res.ok) throw new Error("Failed to fetch budget");
  return res.json();
}

export async function fetchGamification() {
  const res = await apiFetch("/portfolio/gamification");
  if (!res.ok) throw new Error("Failed to fetch gamification");
  return res.json();
}

export async function fetchIntegrations() {
  const res = await apiFetch("/integrations/");
  if (!res.ok) throw new Error("Failed to fetch integrations");
  return res.json();
}

export async function fetchPortfolioHistory(period: "daily" | "monthly" | "annual" = "daily") {
  const res = await apiFetch(`/portfolio/history?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch portfolio history");
  return res.json();
}

export async function fetchNextGoal() {
  const res = await apiFetch("/portfolio/next-goal");
  if (!res.ok) return null;
  return res.json();
}

export async function fetchRecommendations(params: {
  capital_ars?: number;
  risk_profile?: string;
  use_ai?: boolean;
  force_refresh?: boolean;
}) {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await apiFetch(`/portfolio/recommendations?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
}

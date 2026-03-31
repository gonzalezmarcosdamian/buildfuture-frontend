/**
 * Server-side API client — reads Supabase session from cookies
 * and passes Bearer token to the FastAPI backend.
 */
import { getServerSession } from "./supabase-server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function serverFetch(path: string) {
  const session = await getServerSession();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", headers });
  return res;
}

export async function fetchFreedomScore() {
  const res = await serverFetch("/portfolio/freedom-score");
  if (!res.ok) throw new Error("Failed to fetch freedom score");
  return res.json();
}

export async function fetchPortfolio() {
  const res = await serverFetch("/portfolio/");
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json();
}

export async function fetchBudget() {
  const res = await serverFetch("/budget/");
  if (!res.ok) throw new Error("Failed to fetch budget");
  return res.json();
}

export async function fetchGamification() {
  const res = await serverFetch("/portfolio/gamification");
  if (!res.ok) throw new Error("Failed to fetch gamification");
  return res.json();
}

export async function fetchPortfolioHistory(period: "daily" | "monthly" | "annual" = "daily") {
  const res = await serverFetch(`/portfolio/history?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch portfolio history");
  return res.json();
}

export async function fetchNextGoal() {
  const res = await serverFetch("/portfolio/next-goal");
  if (!res.ok) return null;
  return res.json();
}

export async function fetchIntegrations() {
  const res = await serverFetch("/integrations/");
  if (!res.ok) throw new Error("Failed to fetch integrations");
  return res.json();
}

export async function fetchRecommendations(params: {
  capital_ars?: number;
  risk_profile?: string;
  use_ai?: boolean;
}) {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await serverFetch(`/portfolio/recommendations?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
}

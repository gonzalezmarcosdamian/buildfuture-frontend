const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchFreedomScore() {
  const res = await fetch(`${API_URL}/portfolio/freedom-score`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch freedom score");
  return res.json();
}

export async function fetchPortfolio() {
  const res = await fetch(`${API_URL}/portfolio/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json();
}

export async function fetchBudget() {
  const res = await fetch(`${API_URL}/budget/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch budget");
  return res.json();
}

export async function fetchGamification() {
  const res = await fetch(`${API_URL}/portfolio/gamification`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch gamification");
  return res.json();
}

export async function fetchIntegrations() {
  const res = await fetch(`${API_URL}/integrations/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch integrations");
  return res.json();
}

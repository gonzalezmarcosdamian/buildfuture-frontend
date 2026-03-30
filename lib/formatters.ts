export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function freedomColor(pct: number): string {
  if (pct < 0.25) return "#EF4444";
  if (pct < 0.50) return "#F97316";
  if (pct < 0.75) return "#EAB308";
  if (pct < 1.00) return "#22C55E";
  return "#10B981";
}

export function formatMonthsToDate(months: number): string {
  if (months === 0) return "Ya alcanzado";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${months} meses`;
  if (remainingMonths === 0) return `${years} años`;
  return `${years}a ${remainingMonths}m`;
}

/**
 * Constantes compartidas para labels y badges de tipos de activo.
 * Usar estas constantes en todos los componentes para evitar inconsistencias.
 */

export const ASSET_LABEL: Record<string, string> = {
  CEDEAR:      "CEDEAR",
  BOND:        "BONO",
  LETRA:       "LECAP",
  CRYPTO:      "Cripto",
  FCI:         "FCI",
  CASH:        "Efectivo",
  REAL_ESTATE: "Inmueble",
  ON:          "ON",
  STOCK:       "Acción",
  ETF:         "ETF",
  CAUCION:     "Caución",
  OPTION:      "Opción",
};

export const ASSET_EMOJI: Record<string, string> = {
  CEDEAR:      "🌎",
  BOND:        "📜",
  LETRA:       "📄",
  CRYPTO:      "₿",
  FCI:         "🏦",
  CASH:        "💵",
  REAL_ESTATE: "🏠",
  ON:          "🏢",
  STOCK:       "📈",
  ETF:         "🗂️",
  CAUCION:     "🔒",
};

/** Clases Tailwind para el chip de tipo de activo. */
export const ASSET_BADGE_CLASS: Record<string, string> = {
  CEDEAR:      "bg-blue-900 text-blue-300",
  BOND:        "bg-purple-900 text-purple-300",
  LETRA:       "bg-yellow-900 text-yellow-300",
  CRYPTO:      "bg-orange-900 text-orange-300",
  FCI:         "bg-green-900 text-green-300",
  CASH:        "bg-bf-surface-3 text-bf-text-2",
  REAL_ESTATE: "bg-amber-900/60 text-amber-300",
  ON:          "bg-violet-900 text-violet-300",
  STOCK:       "bg-sky-900 text-sky-300",
  ETF:         "bg-teal-900 text-teal-300",
  CAUCION:     "bg-slate-800 text-slate-300",
};

export function assetLabel(type: string): string {
  return ASSET_LABEL[type] ?? type;
}

export function assetEmoji(type: string): string {
  return ASSET_EMOJI[type] ?? "💼";
}

export function assetBadgeClass(type: string): string {
  return ASSET_BADGE_CLASS[type] ?? "bg-bf-surface-3 text-bf-text-2";
}

/** Label con emoji: "🏠 Inmueble", "₿ Cripto", etc. */
export function assetLabelWithEmoji(type: string): string {
  const emoji = assetEmoji(type);
  const label = assetLabel(type);
  return `${emoji} ${label}`;
}

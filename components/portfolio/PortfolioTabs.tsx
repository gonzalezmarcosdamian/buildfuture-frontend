"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, Trash2, Pencil, Check, X } from "lucide-react";
import { formatUSD, formatARS, formatPct } from "@/lib/formatters";
import { useCurrency } from "@/lib/currency-context";
import { SyncButton } from "@/components/portfolio/SyncButton";
import { supabase } from "@/lib/supabase";
import type { PositionDelta } from "./PortfolioClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function authFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

interface Position {
  id: number;
  ticker: string;
  description: string;
  asset_type: string;
  source: string | null;
  quantity: number;
  current_value_usd: number;
  cost_basis_usd: number;
  performance_pct: number;
  performance_ars_pct: number;
  ppc_ars: number;
  annual_yield_pct: number;
  current_price_usd: number;
  avg_purchase_price_usd: number;
  snapshot_date?: string | null;
}

// Instrumentos ARS: su rendimiento nativo (ARS vs VCP) es siempre correcto,
// independientemente del MEP histórico de compra.
const ARS_DENOMINATED = new Set(["FCI", "LETRA", "ON"]);

export type TabMode = "composicion" | "rendimientos";

const PERIOD_LABELS: Record<string, string> = {
  daily: "hoy vs ayer",
  monthly: "último mes",
  annual: "último año",
};

interface Props {
  positions: Position[];
  totalUsd: number;
  mep: number;
  activeTab: TabMode;
  connectedProviders?: string[];
  period?: string;
  positionDeltas?: PositionDelta[];
  deltasLoading?: boolean;
}

// Propósito de cada tipo de activo: renta (flujo mensual) | capital (apreciación)
const ASSET_JOB: Record<string, "renta" | "capital" | "ambos"> = {
  LETRA:  "renta",
  FCI:    "renta",
  ON:     "renta",
  BOND:   "ambos",
  CEDEAR: "capital",
  STOCK:  "capital",
  ETF:    "capital",
  CRYPTO: "capital",
  CASH:   "renta",
};

function jobIcon(asset_type: string): string {
  const job = ASSET_JOB[asset_type] ?? "renta";
  if (job === "capital") return "📈";
  if (job === "ambos")   return "⚖️";
  return "💰";
}

const ASSET_COLORS: Record<string, string> = {
  CEDEAR: "#3b82f6",
  BOND:   "#a855f7",
  LETRA:  "#eab308",
  CRYPTO: "#f97316",
  FCI:    "#22c55e",
  CASH:   "#64748b",
};

const ASSET_BADGES: Record<string, string> = {
  CEDEAR: "bf-chip-cedear",
  BOND:   "bf-chip-bond",
  LETRA:  "bf-chip-letra",
  CRYPTO: "bf-chip-crypto",
  FCI:    "bf-chip-fci",
  ETF:    "bf-chip-etf",
  CASH:   "bf-chip-cash",
};

const SOURCE_BADGES: Record<string, string> = {
  IOL:     "bf-chip-iol",
  PPI:     "bf-chip-ppi",
  COCOS:   "bf-chip-cocos",
  BINANCE: "bf-chip-binance",
  MANUAL:  "bf-chip-manual",
};

const SOURCE_LABELS: Record<string, string> = {
  IOL:     "InvertirOnline",
  PPI:     "Portfolio Personal",
  COCOS:   "Cocos Capital",
  BINANCE: "Binance",
  MANUAL:  "Manual",
};

const FLAG: Record<"USD" | "ARS", string> = { USD: "🇺🇸", ARS: "🇦🇷" };

function cashLabel(ticker: string): string {
  if (ticker.includes("USD")) return "Disponible USD";
  if (ticker.includes("ARS")) return "Disponible ARS";
  return "Disponible";
}

function cashSubtitle(ticker: string): string {
  if (ticker.includes("USD")) return "Dólares sin invertir";
  if (ticker.includes("ARS")) return "Pesos sin invertir";
  return "Sin invertir";
}

function SourceGroupHeader({
  source,
  collapsed,
  groupTotal,
  fmt,
  currency,
  onToggle,
}: {
  source: string;
  collapsed: boolean;
  groupTotal: number;
  fmt: (n: number) => string;
  currency: "USD" | "ARS";
  onToggle: () => void;
}) {
  const badgeCls = SOURCE_BADGES[source] ?? "bf-chip-manual";
  const label    = SOURCE_LABELS[source] ?? source;
  const flag     = FLAG[currency];
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-0.5 hover:opacity-80 transition-opacity"
    >
      <div className="flex items-center gap-2">
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${badgeCls}`}>
          {source}
        </span>
        <span className="text-[10px] text-bf-text-4">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {collapsed && (
          <span className="text-[10px] text-bf-text-3">{flag} {fmt(groupTotal)}</span>
        )}
        <ChevronDown
          size={12}
          className={`text-bf-text-4 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </div>
    </button>
  );
}

export function PortfolioTabs({ positions, totalUsd, mep, activeTab, connectedProviders = [], period = "daily", positionDeltas = [], deltasLoading = false }: Props) {
  const tab = activeTab;
  const { currency } = useCurrency();
  const router = useRouter();
  const [collapsedSources, setCollapsedSources] = useState<Record<string, boolean>>(() => {
    const sources = [...new Set(positions.map(p => p.source ?? "MANUAL"))];
    const initial: Record<string, boolean> = {};
    sources.forEach(src => { initial[src] = true; initial[`r_${src}`] = true; });
    return initial;
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function toggleSource(source: string) {
    setCollapsedSources((prev) => ({ ...prev, [source]: !prev[source] }));
  }

  async function deletePosition(id: number) {
    await authFetch(`/positions/manual/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function saveEdit(id: number, ticker: string) {
    const num = parseFloat(editAmount);
    if (!num || num <= 0) return;
    setSavingEdit(true);
    try {
    const isARS = ticker === "CASH_ARS";
    const mepRate = mep || 1430;
    const qtyUsd = isARS ? num / mepRate : num;
      await authFetch(`/positions/manual/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: qtyUsd, ppc_ars: isARS ? num : num * mepRate, purchase_fx_rate: mepRate }),
      });
    } finally {
      setSavingEdit(false);
      setEditingId(null);
      router.refresh();
    }
  }

  const fmt  = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);
  const hint = (usd: number) => currency === "USD"
    ? `≈ ${FLAG.ARS} ${formatARS(usd * mep)}`
    : `≈ ${FLAG.USD} ${formatUSD(usd)}`;

  const byType = positions.reduce((acc: Record<string, number>, p) => {
    acc[p.asset_type] = (acc[p.asset_type] || 0) + p.current_value_usd;
    return acc;
  }, {});

  // Subtotales renta vs capital
  const rentaTotal   = positions.filter(p => (ASSET_JOB[p.asset_type] ?? "renta") !== "capital").reduce((s, p) => s + p.current_value_usd, 0);
  const capitalTotal = positions.filter(p => ASSET_JOB[p.asset_type] === "capital").reduce((s, p) => s + p.current_value_usd, 0);
  const rentaMonthly = positions
    .filter(p => (ASSET_JOB[p.asset_type] ?? "renta") !== "capital" && p.asset_type !== "CASH")
    .reduce((s, p) => {
      const y = p.annual_yield_pct ?? 0;
      // BOND: 50% del valor va a renta (cupón), 50% a capital (apreciación)
      const monthly = p.asset_type === "BOND"
        ? (p.current_value_usd * y * 0.5) / 12
        : (p.current_value_usd * y) / 12;
      return s + monthly;
    }, 0);

  // Agrupar por fuente — NEXO se agrupa igual pero sin label ALYC especial
  const bySource = positions.reduce((acc: Record<string, Position[]>, p) => {
    const src = p.source ?? "MANUAL";
    if (!acc[src]) acc[src] = [];
    acc[src].push(p);
    return acc;
  }, {});

  // Para rendimientos: por fuente, sin CASH, ordenado por performance dentro de cada grupo
  const bySourceRendimientos: Record<string, Position[]> = Object.fromEntries(
    Object.entries(bySource)
      .map(([src, ps]): [string, Position[]] => [
        src,
        ps.filter((p) => p.asset_type !== "CASH").sort((a, b) => b.performance_pct - a.performance_pct),
      ])
      .filter(([, ps]) => (ps as Position[]).length > 0)
  );

  return (
    <div>
      {tab === "composicion" ? (
        <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border space-y-4">
          {/* Stacked bar */}
          <div className="h-3 rounded-full overflow-hidden flex gap-px">
            {Object.entries(byType).map(([type, value]) => (
              <div
                key={type}
                style={{
                  width: `${(value / totalUsd) * 100}%`,
                  backgroundColor: ASSET_COLORS[type] || "#64748b",
                }}
              />
            ))}
          </div>

          {/* Subtotales renta vs capital */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bf-gain-dim border border-bf-gain/20 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm leading-none">💰</span>
                <p className="text-[10px] text-bf-renta font-medium">Renta mensual</p>
              </div>
              <p className="text-xs font-semibold text-bf-text">
                +{FLAG[currency]} {fmt(rentaMonthly)}/mes
              </p>
              <p className="text-[10px] text-bf-text-3">
                {totalUsd > 0 ? ((rentaTotal / totalUsd) * 100).toFixed(0) : 0}% del portafolio
              </p>
            </div>
            <div className="bg-bf-surface-2 border border-bf-border rounded-xl px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm leading-none">📈</span>
                <p className="text-[10px] text-bf-capital font-medium">Capital USD</p>
              </div>
              <p className="text-xs font-semibold text-bf-text">
                {FLAG[currency]} {fmt(capitalTotal)}
              </p>
              <p className="text-[10px] text-bf-text-3">
                {totalUsd > 0 ? ((capitalTotal / totalUsd) * 100).toFixed(0) : 0}% del portafolio
              </p>
            </div>
          </div>

          {/* By-type legend */}
          <div className="space-y-2">
            {Object.entries(byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, value]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ASSET_COLORS[type] || "#64748b" }}
                    />
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${ASSET_BADGES[type] || "bf-chip-cash"}`}>
                      {type}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-bf-text-2">
                      {FLAG[currency]} {fmt(value)}
                    </span>
                    <span className="text-[10px] text-bf-text-3 ml-1.5">
                      {((value / totalUsd) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Position list — agrupado por ALYC */}
          <div className="pt-1 border-t border-bf-border space-y-3">
            {Object.entries(bySource).map(([source, sourcePositions]) => {
              const collapsed  = !!collapsedSources[source];
              const groupTotal = sourcePositions.reduce((s, p) => s + p.current_value_usd, 0);
              const isConnected = connectedProviders.includes(source);
              return (
                <div key={source}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <SourceGroupHeader
                        source={source}
                        collapsed={collapsed}
                        groupTotal={groupTotal}
                        fmt={fmt}
                        currency={currency as "USD" | "ARS"}
                        onToggle={() => toggleSource(source)}
                      />
                    </div>
                    {isConnected && (
                      <SyncButton connectedProviders={[source]} />
                    )}
                  </div>

                  {!collapsed && (
                    <div className="space-y-0.5 mt-1">
                      {sourcePositions.map((p) => {
                        if (p.asset_type === "CASH") {
                          const isManual = p.source === "MANUAL";
                          const isEditing = editingId === p.id;
                          return (
                            <div key={p.id} className="w-full py-2 px-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-base leading-none">💵</span>
                                    <span className="text-xs font-semibold text-bf-text-2">
                                      {cashLabel(p.ticker)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-bf-text-3 mt-0.5">
                                    {cashSubtitle(p.ticker)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <p className="text-xs font-medium text-bf-text-2">
                                      {FLAG[currency]} {fmt(p.current_value_usd)}
                                    </p>
                                    <p className="text-[10px] text-bf-text-4">{hint(p.current_value_usd)}</p>
                                    <p className="text-[10px] text-bf-text-3">
                                      {((p.current_value_usd / totalUsd) * 100).toFixed(2)}% del total
                                    </p>
                                  </div>
                                  {isManual && !isEditing && (
                                    <div className="flex flex-col gap-1 shrink-0">
                                      <button
                                        onClick={() => { setEditingId(p.id); setEditAmount(String(p.ticker === "CASH_ARS" ? Math.round(p.current_value_usd * mep) : p.current_value_usd)); }}
                                        className="p-1 text-bf-text-4 hover:text-bf-text-2 transition-colors"
                                        title="Editar"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        onClick={() => deletePosition(p.id)}
                                        className="p-1 text-bf-text-4 hover:text-red-400 transition-colors"
                                        title="Eliminar"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isEditing && (
                                <div className="flex items-center gap-2 mt-2">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9]*\.?[0-9]*"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    autoFocus
                                    placeholder="0"
                                    className="flex-1 bg-bf-surface-2 border border-bf-border-2 rounded-lg px-2 py-1.5 text-[16px] leading-tight text-bf-text focus:outline-none focus:border-blue-500"
                                  />
                                  <span className="text-[10px] text-bf-text-3 shrink-0">
                                    {p.ticker === "CASH_ARS" ? "ARS" : "USD"}
                                  </span>
                                  <button
                                    onClick={() => saveEdit(p.id, p.ticker)}
                                    disabled={savingEdit}
                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-40"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 text-bf-text-3 hover:text-bf-text-2 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <button
                            key={p.id}
                            onClick={() => router.push(`/portfolio/${encodeURIComponent(p.ticker)}`)}
                            className="w-full flex items-center justify-between py-2 px-1 rounded-xl hover:bg-bf-surface-2/60 transition-colors text-left"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs leading-none">{jobIcon(p.asset_type)}</span>
                                <span className="text-xs font-semibold text-bf-text-2">
                                  {p.asset_type === "REAL_ESTATE" ? p.description : p.ticker}
                                </span>
                                <span className={`text-[9px] px-1 py-0.5 rounded ${ASSET_BADGES[p.asset_type] || "bg-bf-surface-3 text-bf-text-2"}`}>
                                  {p.asset_type === "REAL_ESTATE" ? "🏠 Inmueble" : p.asset_type}
                                </span>
                              </div>
                              <p className="text-[10px] text-bf-text-3">
                                {p.asset_type === "REAL_ESTATE" ? "Inmueble manual" : `${p.quantity.toLocaleString("es-AR")} u.`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="text-right">
                                <p className="text-xs font-medium text-bf-text-2">
                                  {FLAG[currency]} {fmt(p.current_value_usd)}
                                </p>
                                <p className="text-[10px] text-bf-text-4">{hint(p.current_value_usd)}</p>
                                <p className="text-[10px] text-bf-text-3">
                                  {((p.current_value_usd / totalUsd) * 100).toFixed(2)}% del total
                                </p>
                              </div>
                              <ChevronRight size={12} className="text-bf-text-4 shrink-0 ml-1" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border space-y-3">
          {/* Period label — consistent with chart */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">
              Variación · {PERIOD_LABELS[period] ?? period}
            </p>
            {deltasLoading && (
              <span className="text-[9px] text-bf-text-4">Cargando…</span>
            )}
          </div>

          {Object.entries(bySourceRendimientos).map(([source, sourcePositions]) => {
            const collapsed  = !!collapsedSources[`r_${source}`];
            const groupTotal = sourcePositions.reduce((s, p) => s + p.current_value_usd, 0);

            // Build delta lookup for this render
            const deltaMap = Object.fromEntries(
              positionDeltas.map((d) => [d.ticker, d])
            );

            return (
              <div key={source}>
                <SourceGroupHeader
                  source={source}
                  collapsed={collapsed}
                  groupTotal={groupTotal}
                  fmt={fmt}
                  currency={currency as "USD" | "ARS"}
                  onToggle={() => toggleSource(`r_${source}`)}
                />

                {!collapsed && (
                  <div className="space-y-3 mt-2">
                    {sourcePositions.map((p) => {
                      const delta = deltaMap[p.ticker];
                      const weightPct = totalUsd > 0 ? (p.current_value_usd / totalUsd) * 100 : 0;

                      // When period delta is available: use it
                      // Fallback: desde-compra (performance_pct / pnlUsd)
                      const hasDelta = !!delta && !deltasLoading;
                      const useArs = !hasDelta && ARS_DENOMINATED.has(p.asset_type) && p.ppc_ars > 0;

                      const perfPct  = hasDelta
                        ? delta.delta_pct
                        : (useArs ? p.performance_ars_pct : p.performance_pct);
                      const pnlUsd   = hasDelta
                        ? delta.delta_usd
                        : (p.current_value_usd - p.cost_basis_usd);
                      const positive = perfPct >= 0 || pnlUsd >= 0;

                      return (
                        <button
                          key={p.id}
                          onClick={() => router.push(`/portfolio/${encodeURIComponent(p.ticker)}`)}
                          className="w-full text-left space-y-1 hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-bf-text-2">
                                {p.asset_type === "REAL_ESTATE" ? p.description : p.ticker}
                              </span>
                              <p className="text-[10px] text-bf-text-3">
                                {p.asset_type === "REAL_ESTATE" ? "🏠 Inmueble" : p.description.split(" ").slice(0, 3).join(" ")}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="text-right">
                                <div className={`flex items-center gap-0.5 text-xs ${positive ? "text-bf-gain" : "text-bf-loss"}`}>
                                  {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                  <span className="font-semibold">{formatPct(perfPct, 1, true)}</span>
                                  {!hasDelta && useArs && (
                                    <span className="text-[9px] text-bf-text-3 ml-0.5">ARS</span>
                                  )}
                                  {!hasDelta && (
                                    <span className="text-[9px] text-bf-text-4 ml-0.5">compra</span>
                                  )}
                                </div>
                                <p className={`text-[10px] ${positive ? "text-emerald-600" : "text-red-600"}`}>
                                  {positive ? "+" : ""}{FLAG[currency]} {fmt(pnlUsd)}
                                </p>
                              </div>
                              <ChevronRight size={12} className="text-bf-text-4 shrink-0 ml-1" />
                            </div>
                          </div>
                          <div className="h-1 bg-bf-surface-2/60 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-600 transition-all"
                              style={{ width: `${weightPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-bf-text-4">
                            <span>{weightPct.toFixed(1)}% del portafolio</span>
                            <span>{positive ? "+" : ""}{FLAG[currency]} {fmt(pnlUsd)} Δ</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown } from "lucide-react";
import { formatUSD, formatARS, formatPct } from "@/lib/formatters";
import { useCurrency } from "@/lib/currency-context";
import { SyncButton } from "@/components/portfolio/SyncButton";
import type { PositionDelta } from "./PortfolioClient";

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
  CEDEAR: "bg-blue-900 text-blue-300",
  BOND:   "bg-purple-900 text-purple-300",
  LETRA:  "bg-yellow-900 text-yellow-300",
  CRYPTO: "bg-orange-900 text-orange-300",
  FCI:    "bg-green-900 text-green-300",
  CASH:   "bg-slate-700 text-slate-300",
};

const SOURCE_BADGES: Record<string, string> = {
  IOL:     "bg-blue-900/60 text-blue-400",
  PPI:     "bg-purple-900/60 text-purple-400",
  COCOS:   "bg-orange-900/60 text-orange-400",
  BINANCE: "bg-yellow-900/60 text-yellow-400",
  MANUAL:  "bg-slate-700/60 text-slate-400",
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
  const badgeCls = SOURCE_BADGES[source] ?? "bg-slate-700/60 text-slate-400";
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
        <span className="text-[10px] text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {collapsed && (
          <span className="text-[10px] text-slate-500">{flag} {fmt(groupTotal)}</span>
        )}
        <ChevronDown
          size={12}
          className={`text-slate-600 transition-transform ${collapsed ? "-rotate-90" : ""}`}
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

  function toggleSource(source: string) {
    setCollapsedSources((prev) => ({ ...prev, [source]: !prev[source] }));
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
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4">
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
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm leading-none">💰</span>
                <p className="text-[10px] text-emerald-400 font-medium">Renta mensual</p>
              </div>
              <p className="text-xs font-semibold text-slate-200">
                +{FLAG[currency]} {fmt(rentaMonthly)}/mes
              </p>
              <p className="text-[10px] text-slate-500">
                {totalUsd > 0 ? ((rentaTotal / totalUsd) * 100).toFixed(0) : 0}% del portafolio
              </p>
            </div>
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm leading-none">📈</span>
                <p className="text-[10px] text-blue-400 font-medium">Capital USD</p>
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {FLAG[currency]} {fmt(capitalTotal)}
              </p>
              <p className="text-[10px] text-slate-500">
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
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ASSET_BADGES[type] || "bg-slate-700 text-slate-300"}`}>
                      {type}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-200">
                      {FLAG[currency]} {fmt(value)}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      {((value / totalUsd) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Position list — agrupado por ALYC */}
          <div className="pt-1 border-t border-slate-800 space-y-3">
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
                          return (
                            <div
                              key={p.id}
                              className="w-full flex items-center justify-between py-2 px-1"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base leading-none">💵</span>
                                  <span className="text-xs font-semibold text-slate-200">
                                    {cashLabel(p.ticker)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {cashSubtitle(p.ticker)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-medium text-slate-200">
                                  {FLAG[currency]} {fmt(p.current_value_usd)}
                                </p>
                                <p className="text-[10px] text-slate-600">{hint(p.current_value_usd)}</p>
                                <p className="text-[10px] text-slate-500">
                                  {((p.current_value_usd / totalUsd) * 100).toFixed(2)}% del total
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <button
                            key={p.id}
                            onClick={() => router.push(`/portfolio/${encodeURIComponent(p.ticker)}`)}
                            className="w-full flex items-center justify-between py-2 px-1 rounded-xl hover:bg-slate-800/60 transition-colors text-left"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs leading-none">{jobIcon(p.asset_type)}</span>
                                <span className="text-xs font-semibold text-slate-200">{p.ticker}</span>
                                <span className={`text-[9px] px-1 py-0.5 rounded ${ASSET_BADGES[p.asset_type] || "bg-slate-700 text-slate-300"}`}>
                                  {p.asset_type}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">{p.quantity.toLocaleString("es-AR")} u.</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="text-right">
                                <p className="text-xs font-medium text-slate-200">
                                  {FLAG[currency]} {fmt(p.current_value_usd)}
                                </p>
                                <p className="text-[10px] text-slate-600">{hint(p.current_value_usd)}</p>
                                <p className="text-[10px] text-slate-500">
                                  {((p.current_value_usd / totalUsd) * 100).toFixed(2)}% del total
                                </p>
                              </div>
                              <ChevronRight size={12} className="text-slate-600 shrink-0 ml-1" />
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
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
          {/* Period label — consistent with chart */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Variación · {PERIOD_LABELS[period] ?? period}
            </p>
            {deltasLoading && (
              <span className="text-[9px] text-slate-600">Cargando…</span>
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
                              <span className="text-xs font-semibold text-slate-200">{p.ticker}</span>
                              <p className="text-[10px] text-slate-500">{p.description.split(" ").slice(0, 3).join(" ")}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="text-right">
                                <div className={`flex items-center gap-0.5 text-xs ${positive ? "text-emerald-400" : "text-red-400"}`}>
                                  {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                  <span className="font-semibold">{formatPct(perfPct, 1, true)}</span>
                                  {!hasDelta && useArs && (
                                    <span className="text-[9px] text-slate-500 ml-0.5">ARS</span>
                                  )}
                                  {!hasDelta && (
                                    <span className="text-[9px] text-slate-600 ml-0.5">compra</span>
                                  )}
                                </div>
                                <p className={`text-[10px] ${positive ? "text-emerald-600" : "text-red-600"}`}>
                                  {positive ? "+" : ""}{FLAG[currency]} {fmt(pnlUsd)}
                                </p>
                              </div>
                              <ChevronRight size={12} className="text-slate-600 shrink-0 ml-1" />
                            </div>
                          </div>
                          <div className="h-1 bg-slate-800/60 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-600 transition-all"
                              style={{ width: `${weightPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-600">
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

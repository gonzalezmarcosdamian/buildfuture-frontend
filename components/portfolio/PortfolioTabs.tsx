"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { formatUSD, formatARS, formatPct } from "@/lib/formatters";
import { useCurrency } from "@/lib/currency-context";

interface Position {
  id: number;
  ticker: string;
  description: string;
  asset_type: string;
  source: string;
  quantity: number;
  current_value_usd: number;
  cost_basis_usd: number;
  performance_pct: number;
  annual_yield_pct: number;
  current_price_usd: number;
  avg_purchase_price_usd: number;
  snapshot_date?: string | null;
}

export type TabMode = "composicion" | "rendimientos";

interface Props {
  positions: Position[];
  totalUsd: number;
  mep: number;
  activeTab: TabMode;
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

const FLAG: Record<"USD" | "ARS", string> = { USD: "🇺🇸", ARS: "🇦🇷" };

const SOURCE_BADGES: Record<string, string> = {
  IOL:    "bg-blue-900/60 text-blue-400",
  PPI:    "bg-purple-900/60 text-purple-400",
  NEXO:   "bg-green-900/60 text-green-400",
  MANUAL: "bg-slate-700/60 text-slate-400",
};

function SourceBadge({ source }: { source: string }) {
  const cls = SOURCE_BADGES[source] ?? "bg-slate-700/60 text-slate-400";
  return (
    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${cls}`}>
      {source}
    </span>
  );
}

export function PortfolioTabs({ positions, totalUsd, mep, activeTab }: Props) {
  const tab = activeTab;
  const { currency } = useCurrency();
  const router = useRouter();

  const fmt  = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);
  const hint = (usd: number) => currency === "USD"
    ? `≈ ${FLAG.ARS} ${formatARS(usd * mep)}`
    : `≈ ${FLAG.USD} ${formatUSD(usd)}`;

  const byType = positions.reduce((acc: Record<string, number>, p) => {
    acc[p.asset_type] = (acc[p.asset_type] || 0) + p.current_value_usd;
    return acc;
  }, {});

  const sorted = [...positions]
    .filter((p) => p.asset_type !== "CASH")
    .sort((a, b) => b.performance_pct - a.performance_pct);

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
                      {((value / totalUsd) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Position list */}
          <div className="space-y-1 pt-1 border-t border-slate-800">
            {positions.map((p) => {
              if (p.asset_type === "CASH") {
                return (
                  <div
                    key={p.id}
                    className="w-full flex items-center justify-between py-2 px-1"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">💵</span>
                        <span className="text-xs font-semibold text-slate-200">Disponible</span>
                        <SourceBadge source={p.source} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Sin invertir</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-200">
                        {FLAG[currency]} {fmt(p.current_value_usd)}
                      </p>
                      <p className="text-[10px] text-slate-600">{hint(p.current_value_usd)}</p>
                      <p className="text-[10px] text-slate-500">
                        {((p.current_value_usd / totalUsd) * 100).toFixed(1)}% del total
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
                      <span className="text-xs font-semibold text-slate-200">{p.ticker}</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded ${ASSET_BADGES[p.asset_type] || "bg-slate-700 text-slate-300"}`}>
                        {p.asset_type}
                      </span>
                      <SourceBadge source={p.source} />
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
                        {((p.current_value_usd / totalUsd) * 100).toFixed(1)}% del total
                      </p>
                    </div>
                    <ChevronRight size={12} className="text-slate-600 shrink-0 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
          {sorted.map((p) => {
            const positive = p.performance_pct >= 0;
            const pnlUsd   = p.current_value_usd - p.cost_basis_usd;
            const barPct   = Math.min(Math.abs(p.performance_pct) * 100, 100);
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/portfolio/${encodeURIComponent(p.ticker)}`)}
                className="w-full text-left space-y-1 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200">{p.ticker}</span>
                      <SourceBadge source={p.source} />
                    </div>
                    <span className="text-[10px] text-slate-500">{p.description.split(" ").slice(0, 3).join(" ")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-right">
                      <div className={`flex items-center gap-0.5 text-xs ${positive ? "text-emerald-400" : "text-red-400"}`}>
                        {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        <span className="font-semibold">{formatPct(p.performance_pct, 1, true)}</span>
                      </div>
                      <p className={`text-[10px] ${positive ? "text-emerald-600" : "text-red-600"}`}>
                        {positive ? "+" : ""}{FLAG[currency]} {fmt(pnlUsd)}
                      </p>
                    </div>
                    <ChevronRight size={12} className="text-slate-600 shrink-0 ml-1" />
                  </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${positive ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>Costo {FLAG[currency]} {fmt(p.cost_basis_usd)}</span>
                  <span>Actual {FLAG[currency]} {fmt(p.current_value_usd)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";
import { supabase } from "@/lib/supabase";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useCurrency } from "@/lib/currency-context";

type Period = "daily" | "monthly" | "annual";
export type ChartMode = "tenencia" | "rendimiento";

interface HistoryPoint {
  label: string;
  date: string;
  total_usd: number;
  monthly_return_usd: number;
  delta_usd: number;
  pnl_usd: number;
  pnl_pct: number;
  fx_mep: number;
  displayTotal?: number;
  displayDelta?: number;
  displayPnl?: number;
}

interface Props {
  initialData: { period: Period; points: HistoryPoint[]; has_data: boolean };
  mep?: number;
  chartMode: ChartMode;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Diario",
  monthly: "Mensual",
  annual: "Anual",
};

const FLAG: Record<"USD" | "ARS", string> = { USD: "🇺🇸", ARS: "🇦🇷" };
const SYMBOL: Record<"USD" | "ARS", string> = { USD: "USD", ARS: "ARS" };

/** Compact number → axis label. No currency prefix — shown in footer. */
function compact(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(0)}k`;
  return `${sign}${abs.toFixed(0)}`;
}

/** Full formatted value with currency flag + amount */
function fmtFull(usd: number, currency: "USD" | "ARS", mep: number, signed = false): string {
  const val = currency === "ARS" ? usd * mep : usd;
  const abs = Math.abs(val);
  const sign = signed ? (usd >= 0 ? "+" : "−") : "";

  let num: string;
  if (currency === "ARS") {
    if (abs >= 1_000_000) num = `$${(abs / 1_000_000).toFixed(2)}M`;
    else num = `$${abs.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  } else {
    if (abs >= 1_000_000) num = `$${(abs / 1_000_000).toFixed(2)}M`;
    else num = `$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `${FLAG[currency]} ${sign}${num}`;
}

/** Secondary currency hint (opposite of active) */
function fmtHint(usd: number, currency: "USD" | "ARS", mep: number): string {
  const opp: "USD" | "ARS" = currency === "USD" ? "ARS" : "USD";
  const val = opp === "ARS" ? usd * mep : usd;
  const abs = Math.abs(val);
  let num: string;
  if (opp === "ARS") {
    num = abs >= 1_000_000
      ? `$${(abs / 1_000_000).toFixed(1)}M`
      : `$${abs.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  } else {
    num = `$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `${FLAG[opp]} ${num}`;
}

/** Estimate YAxis width from the longest tick label */
function yAxisWidth(values: number[]): number {
  if (!values.length) return 44;
  const longest = values.reduce((a, b) => (Math.abs(a) > Math.abs(b) ? a : b));
  const label = compact(longest);
  return Math.max(32, label.length * 7 + 8);
}

function TRow({ label, value, dim, color }: {
  label: string; value: string; dim?: boolean; color?: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={dim ? "text-[10px] text-slate-600" : color ?? "text-slate-100 font-semibold"}>
        {value}
      </span>
    </div>
  );
}

function TenenciaTooltip({ active, payload, currency, mep }: {
  active?: boolean; payload?: any[]; currency: "USD" | "ARS"; mep: number;
}) {
  if (!active || !payload?.length) return null;
  const p: HistoryPoint = payload[0].payload;
  const prevTotal = p.total_usd - p.delta_usd;
  const hasDelta = p.delta_usd !== 0;
  const gain = p.delta_usd >= 0;
  const pct = prevTotal > 0 ? (p.delta_usd / prevTotal) * 100 : 0;
  const usedMep = p.fx_mep > 0 ? p.fx_mep : mep;

  return (
    <div className="bg-slate-800/95 border border-slate-700 rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-[168px]">
      <p className="text-slate-400 mb-2 font-medium">{p.label}</p>
      <div className="space-y-1">
        <TRow label="Tenencia" value={fmtFull(p.total_usd, currency, usedMep)} />
        <TRow label="≈" value={fmtHint(p.total_usd, currency, usedMep)} dim />
        {hasDelta && (
          <div className="flex justify-between gap-4 pt-1 mt-0.5 border-t border-slate-700/50">
            <span className="text-slate-500">Variación</span>
            <span className={`font-medium ${gain ? "text-emerald-400" : "text-red-400"}`}>
              {fmtFull(p.delta_usd, currency, usedMep, true)}
              {prevTotal > 0 && (
                <span className="ml-1 text-[9px] opacity-60">({pct.toFixed(1)}%)</span>
              )}
            </span>
          </div>
        )}
        {p.fx_mep > 0 && (
          <p className="text-[9px] text-slate-600 pt-0.5">
            MEP ${p.fx_mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </p>
        )}
      </div>
    </div>
  );
}

function RendimientoTooltip({ active, payload, currency, mep }: {
  active?: boolean; payload?: any[]; currency: "USD" | "ARS"; mep: number;
}) {
  if (!active || !payload?.length) return null;
  const p: HistoryPoint = payload[0].payload;
  const pnl = p.pnl_usd ?? 0;
  const pnlPct = p.pnl_pct ?? 0;
  const gain = pnl >= 0;
  const usedMep = p.fx_mep > 0 ? p.fx_mep : mep;

  return (
    <div className="bg-slate-800/95 border border-slate-700 rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-[168px]">
      <p className="text-slate-400 mb-2 font-medium">{p.label}</p>
      <div className="space-y-1">
        <TRow label="Tenencia" value={fmtFull(p.total_usd, currency, usedMep)} />
        <div className="flex justify-between gap-4 pt-1 mt-0.5 border-t border-slate-700/50">
          <span className="text-slate-500">vs PPC</span>
          <span className={`font-semibold ${gain ? "text-emerald-400" : "text-red-400"}`}>
            {fmtFull(pnl, currency, usedMep, true)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">P&L %</span>
          <span className={`font-semibold ${gain ? "text-emerald-400" : "text-red-400"}`}>
            {gain ? "+" : ""}{pnlPct.toFixed(2)}%
          </span>
        </div>
        {p.fx_mep > 0 && (
          <p className="text-[9px] text-slate-600 pt-1 border-t border-slate-700/50 mt-1">
            MEP ${p.fx_mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </p>
        )}
      </div>
    </div>
  );
}

export function PerformanceChart({ initialData, mep = 1430, chartMode }: Props) {
  const mode = chartMode;
  const [period, setPeriod] = useState<Period>(initialData.period);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const { currency } = useCurrency();

  async function changePeriod(p: Period) {
    if (p === period) return;
    setPeriod(p);
    setLoading(true);
    try {
      const { data: _s } = await supabase.auth.getSession();
      const _tok = _s.session?.access_token;
      const res = await fetch(`${API_URL}/portfolio/history?period=${p}`, { headers: _tok ? { Authorization: `Bearer ${_tok}` } : {} });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const chartData: HistoryPoint[] = data.points.map((p) => ({
    ...p,
    displayTotal: currency === "ARS" ? p.total_usd * mep : p.total_usd,
    displayDelta: currency === "ARS" ? p.delta_usd * mep : p.delta_usd,
    displayPnl: currency === "ARS" ? (p.pnl_usd ?? 0) * mep : (p.pnl_usd ?? 0),
  }));

  // Symmetric domain for rendimiento (P&L vs PPC) so 0 is always centered
  const maxAbsPnl = Math.max(
    ...chartData.map((p) => Math.abs(p.displayPnl ?? 0)),
    0.01, // guard against all-zero
  );
  const rendPad = maxAbsPnl * 0.25;
  const rendDomain: [number, number] = [-(maxAbsPnl + rendPad), maxAbsPnl + rendPad];

  const totalValues = chartData.map((p) => p.displayTotal ?? 0);
  const pnlValues = chartData.map((p) => p.displayPnl ?? 0);
  const yWidthTenencia = yAxisWidth(totalValues);
  const yWidthRendimiento = yAxisWidth(pnlValues);

  const renderTenenciaTooltip = (props: any) => (
    <TenenciaTooltip {...props} currency={currency} mep={mep} />
  );
  const renderRendimientoTooltip = (props: any) => (
    <RendimientoTooltip {...props} currency={currency} mep={mep} />
  );

  const onlyOnePoint = chartData.length === 1;

  return (
    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">

      {/* Period chips */}
      <div className="flex justify-end gap-1">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => changePeriod(p)}
            className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${
              period === p
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-44 flex items-center justify-center text-slate-600 text-xs">Cargando…</div>
      ) : !data.has_data || chartData.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center gap-1">
          <p className="text-slate-600 text-xs">Sin historial aún</p>
          <p className="text-slate-700 text-[10px]">Los snapshots se acumulan automáticamente</p>
        </div>
      ) : mode === "tenencia" ? (
        <>
          {onlyOnePoint && (
            <p className="text-[10px] text-slate-600 text-center">
              Primer snapshot registrado — la curva crece con el tiempo
            </p>
          )}
          <ResponsiveContainer width="100%" height={164}>
            <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="tenenciaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.30} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={compact}
                width={yWidthTenencia}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={renderTenenciaTooltip}
                cursor={{ stroke: "#3b82f680", strokeWidth: 1, strokeDasharray: "4 2" }}
              />
              <Area
                type="monotone"
                dataKey="displayTotal"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#tenenciaGrad)"
                dot={onlyOnePoint ? { r: 5, fill: "#3b82f6", stroke: "#0f172a", strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: "#3b82f6", stroke: "#0f172a", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      ) : (
        <ResponsiveContainer width="100%" height={176}>
          <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={compact}
              width={yWidthRendimiento}
              domain={rendDomain}
            />
            {/* Eje central en 0 — bien visible */}
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
            <Tooltip
              content={renderRendimientoTooltip}
              cursor={{ fill: "#1e293b50" }}
            />
            <Bar dataKey="displayPnl" radius={[3, 3, 3, 3]} isAnimationActive={false}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={(entry.displayPnl ?? 0) >= 0 ? "#34d399" : "#f87171"}
                  fillOpacity={0.88}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Footer */}
      {data.has_data && chartData.length > 0 && (
        <div className="flex items-center gap-3 text-[9px] text-slate-600">
          {mode === "rendimiento" && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />
                Ganancia
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-red-400 inline-block" />
                Pérdida
              </span>
            </>
          )}
          <span className="ml-auto">{FLAG[currency]} {SYMBOL[currency]}{currency === "ARS" ? " (MEP)" : ""}</span>
        </div>
      )}
    </div>
  );
}

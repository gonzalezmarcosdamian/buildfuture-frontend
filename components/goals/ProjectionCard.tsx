"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/lib/currency-context";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { X, Info, TrendingUp, RefreshCw, Layers, ChevronDown, ChevronUp } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

interface ProjectionPoint {
  year: number;
  with_savings_usd: number;
  without_savings_usd: number;
  label: string;
}

interface ProjectionData {
  current_usd: number;
  monthly_savings_usd: number;
  annual_return_pct: number;
  extra_usd_10y: number;
  points: ProjectionPoint[];
}

interface CapitalGoal {
  id: number;
  name: string;
  emoji: string;
  target_usd: number;
}

function fmtK(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000)     return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function makeFmtK(currency: "USD" | "ARS", mep: number): (usd: number) => string {
  if (currency === "USD") return fmtK;
  return (usd: number) => {
    const ars = usd * mep;
    if (ars >= 1_000_000_000) return `$${(ars / 1_000_000_000).toFixed(1)}B`;
    if (ars >= 1_000_000) return `$${(ars / 1_000_000).toFixed(1)}M`;
    if (ars >= 1_000)     return `$${(ars / 1_000).toFixed(0)}K`;
    return `$${Math.round(ars)}`;
  };
}

function fmtFull(usd: number): string {
  return `$${Math.round(usd).toLocaleString("es-AR")}`;
}

function makeFmtFull(currency: "USD" | "ARS", mep: number): (usd: number) => string {
  if (currency === "USD") return fmtFull;
  return (usd: number) => `$${Math.round(usd * mep).toLocaleString("es-AR")}`;
}

const YEARS = [1, 5, 10, 20, 30, 60];
const GOAL_COLORS = ["#a78bfa", "#f472b6", "#fb923c", "#34d399", "#60a5fa"];

function computePoints(
  current: number,
  monthly: number,
  annualRate: number,
  maxYear: number,
): ProjectionPoint[] {
  const r = annualRate / 12;
  const pts: ProjectionPoint[] = [];
  for (let y = 1; y <= maxYear; y++) {
    const n = y * 12;
    const withSavings = r > 0
      ? current * Math.pow(1 + r, n) + monthly * (Math.pow(1 + r, n) - 1) / r
      : current + monthly * n;
    const withoutSavings = r > 0 ? current * Math.pow(1 + r, n) : current;
    pts.push({ year: y, with_savings_usd: withSavings, without_savings_usd: withoutSavings, label: `Año ${y}` });
  }
  return pts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, fmtTip }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bf-surface-2 border border-bf-border-2 rounded-xl px-3 py-2 text-xs space-y-1 shadow-xl">
      <p className="text-bf-text-3 font-medium">{label}</p>
      {payload.map((p: { color: string; name: string; value: number }) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-bf-text-2">{p.name}:</span>
          <span className="font-semibold text-bf-text">{(fmtTip ?? fmtK)(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Bottom sheet educativo ────────────────────────────────────────────────────

function InfoSheet({ data, onClose }: { data: ProjectionData; onClose: () => void }) {
  const yieldPct = (data.annual_return_pct * 100).toFixed(2);
  const monthly = data.monthly_savings_usd;
  const current = data.current_usd;

  // Puntos clave de la proyección para el modal
  const pt1  = data.points.find((p) => p.year === 1)!;
  const pt5  = data.points.find((p) => p.year === 5)!;
  const pt10 = data.points.find((p) => p.year === 10)!;

  // Cuánto viene de aportes vs cuánto de rendimientos al año 10
  const totalAportes10 = monthly * 12 * 10;
  const totalPortfolio10 = pt10.with_savings_usd;
  const totalRendimientos10 = totalPortfolio10 - current - totalAportes10;

  // Benchmark referencia
  const yieldNum = data.annual_return_pct * 100;
  const vsSnp = yieldNum < 10 ? "por debajo" : yieldNum <= 12 ? "en línea con" : "por encima de";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-bf-page rounded-t-3xl border-t border-bf-border max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + header */}
        <div className="sticky top-0 bg-bf-page pt-3 pb-2 px-5 border-b border-bf-border/60">
          <div className="w-10 h-1 bg-bf-surface-3 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-bf-text">¿Cómo se calcula tu proyección?</p>
            <button onClick={onClose} className="text-bf-text-3 hover:text-bf-text-2 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-6 pb-10">

          {/* ── 1. Rendimiento ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-950/60 border border-blue-900/50 flex items-center justify-center shrink-0">
                <TrendingUp size={14} className="text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-bf-text-2">Rendimiento de tu portafolio</p>
            </div>

            <div className="bg-bf-surface rounded-2xl border border-bf-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-bf-text-3">Tu rendimiento estimado</p>
                <p className="text-xl font-bold text-blue-400">{yieldPct}%<span className="text-xs font-normal text-bf-text-3"> / año</span></p>
              </div>

              <p className="text-[11px] text-bf-text-3 leading-relaxed">
                Calculado a partir del rendimiento histórico de tus posiciones actuales, {vsSnp} la media histórica del S&P 500 (~10% anual en USD). Usamos este número para proyectar cómo crece tu portafolio.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: "Conservador", pct: "6%", color: "text-bf-text-3" },
                  { label: "Moderado",    pct: "8–10%", color: "text-blue-400" },
                  { label: "Agresivo",    pct: "12–15%", color: "text-emerald-400" },
                ].map((r) => (
                  <div key={r.label} className="bg-bf-surface-2/60 rounded-xl p-2 text-center">
                    <p className={`text-xs font-bold ${r.color}`}>{r.pct}</p>
                    <p className="text-[9px] text-bf-text-3 mt-0.5">{r.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-bf-text-4 leading-snug">
                ⚠️ Rendimientos pasados no garantizan resultados futuros. Este número puede cambiar a medida que tu portafolio evoluciona.
              </p>
            </div>
          </section>

          {/* ── 2. DCA ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-violet-950/60 border border-violet-900/50 flex items-center justify-center shrink-0">
                <RefreshCw size={14} className="text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-bf-text-2">DCA — Aportes sistemáticos</p>
            </div>

            <div className="bg-bf-surface rounded-2xl border border-bf-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-bf-text-3">Tu aporte mensual</p>
                <p className="text-xl font-bold text-violet-400">
                  {fmtFull(monthly)}<span className="text-xs font-normal text-bf-text-3"> USD/mes</span>
                </p>
              </div>

              <p className="text-[11px] text-bf-text-3 leading-relaxed">
                <span className="text-bf-text-2 font-medium">DCA (Dollar Cost Averaging)</span> significa invertir una cantidad fija todos los meses, sin importar si el mercado sube o baja. Comprás más unidades cuando el precio es bajo y menos cuando es alto — promediando tu costo de entrada.
              </p>

              {/* Visual DCA */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">Impacto de aportar cada mes</p>
                {[
                  { label: "Año 1",  con: pt1.with_savings_usd,  sin: pt1.without_savings_usd },
                  { label: "Año 5",  con: pt5.with_savings_usd,  sin: pt5.without_savings_usd },
                  { label: "Año 10", con: pt10.with_savings_usd, sin: pt10.without_savings_usd },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <p className="text-[10px] text-bf-text-3 w-10 shrink-0">{row.label}</p>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <div
                          className="h-1.5 bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (row.con / pt10.with_savings_usd) * 100)}%` }}
                        />
                        <p className="text-[9px] text-emerald-400 font-medium shrink-0">{fmtK(row.con)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className="h-1.5 bg-slate-600 rounded-full"
                          style={{ width: `${Math.min(100, (row.sin / pt10.with_savings_usd) * 100)}%` }}
                        />
                        <p className="text-[9px] text-bf-text-3 shrink-0">{fmtK(row.sin)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1"><div className="w-3 h-1.5 bg-emerald-500 rounded-full" /><p className="text-[9px] text-bf-text-3">Aportando</p></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-1.5 bg-slate-600 rounded-full" /><p className="text-[9px] text-bf-text-3">Sin aportar</p></div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 3. Interés compuesto ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-950/60 border border-emerald-900/50 flex items-center justify-center shrink-0">
                <Layers size={14} className="text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-bf-text-2">Interés compuesto</p>
            </div>

            <div className="bg-bf-surface rounded-2xl border border-bf-border p-4 space-y-3">
              <p className="text-[11px] text-bf-text-3 leading-relaxed">
                El interés compuesto hace que tus rendimientos generen sus propios rendimientos. En 10 años, de {fmtFull(pt10.with_savings_usd)} totales proyectados:
              </p>

              {/* Desglose */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-bf-border">
                  <p className="text-xs text-bf-text-3">Portafolio inicial</p>
                  <p className="text-xs font-semibold text-bf-text-2">{fmtFull(current)}</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-bf-border">
                  <p className="text-xs text-bf-text-3">Tus aportes ({fmtFull(monthly)}/mes × 10 años)</p>
                  <p className="text-xs font-semibold text-violet-300">{fmtFull(totalAportes10)}</p>
                </div>
                <div className="flex items-center justify-between py-2">
                  <p className="text-xs text-bf-text-3">Rendimientos generados</p>
                  <p className="text-xs font-bold text-emerald-400">{fmtFull(Math.max(0, totalRendimientos10))}</p>
                </div>
              </div>

              {/* Barra composición */}
              {pt10.with_savings_usd > 0 && (
                <div>
                  <div className="h-3 rounded-full overflow-hidden flex gap-px">
                    <div className="bg-slate-600 rounded-l-full" style={{ width: `${(current / pt10.with_savings_usd) * 100}%` }} />
                    <div className="bg-violet-500" style={{ width: `${(Math.max(0, totalAportes10) / pt10.with_savings_usd) * 100}%` }} />
                    <div className="bg-emerald-500 rounded-r-full flex-1" />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-slate-600" /><p className="text-[9px] text-bf-text-3">Inicial</p></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-violet-500" /><p className="text-[9px] text-bf-text-3">Aportes</p></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><p className="text-[9px] text-bf-text-3">Rendimientos</p></div>
                  </div>
                </div>
              )}

              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-3 py-2">
                <p className="text-[11px] text-bf-text-2 leading-snug">
                  🌱 Sin interés compuesto, tus aportes de {fmtFull(totalAportes10)} más el portfolio inicial darían{" "}
                  <span className="text-bf-text-3">{fmtFull(current + totalAportes10)}</span>. El interés compuesto agrega{" "}
                  <span className="text-emerald-400 font-semibold">{fmtFull(Math.max(0, totalRendimientos10))} extra</span> — sin que hagas nada adicional.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function ProjectionCard({ mep = 1430 }: { mep?: number }) {
  const { currency } = useCurrency();
  const [data, setData] = useState<ProjectionData | null>(null);
  const [goals, setGoals] = useState<CapitalGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState(10);
  const [showInfo, setShowInfo] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [customRatePct, setCustomRatePct] = useState(8.0);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [projRes, goalsRes] = await Promise.all([
          fetch(`${API_URL}/portfolio/projection`, { headers }),
          fetch(`${API_URL}/portfolio/capital-goals`, { headers }),
        ]);
        if (projRes.ok) setData(await projRes.json());
        if (goalsRes.ok) setGoals(await goalsRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border animate-pulse h-48" />
  );

  if (!data) return (
    <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border text-center space-y-2">
      <p className="text-bf-text-3 text-xs">No hay datos de proyección disponibles</p>
      <p className="text-[10px] text-bf-text-4">Asegurate de tener posiciones y presupuesto configurados</p>
    </div>
  );

  const fmtC = makeFmtK(currency, mep);
  const fmtFullC = makeFmtFull(currency, mep);
  const currencyLabel = currency === "ARS" ? "ARS" : "USD";

  // Always compute up to 60 years so any selected horizon can filter from a single array
  const allPoints = computePoints(data.current_usd, data.monthly_savings_usd, customRatePct / 100, 60);
  const chartPoints = allPoints.filter((p) => p.year <= horizon);
  const last = chartPoints[chartPoints.length - 1];
  const extra = last.with_savings_usd - last.without_savings_usd;
  const yieldPct = customRatePct.toFixed(1);

  const maxChartValue = last.with_savings_usd;
  const visibleGoals = goals.filter(
    (g) => g.target_usd > data.current_usd && g.target_usd <= maxChartValue * 1.05
  );


  return (
    <>
      <div className="bg-bf-surface rounded-2xl border border-bf-border overflow-hidden">

        {/* Accordion trigger — always visible */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bf-surface-2/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base leading-none">📈</span>
            <div>
              <p className="text-xs font-semibold text-bf-text-2">Proyección a {horizon} años</p>
              <p className="text-[11px] text-emerald-400 font-medium">
                {fmtC(last.with_savings_usd)} con aportes mensuales
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp size={14} className="text-bf-text-3 shrink-0" /> : <ChevronDown size={14} className="text-bf-text-3 shrink-0" />}
        </button>

        {/* Expandable content */}
        {expanded && <div className="px-4 pb-4 space-y-4 border-t border-bf-border/60 pt-3">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-bf-text">
              Si seguís invirtiendo {fmtFullC(data.monthly_savings_usd)} {currencyLabel}/mes
            </p>
            <p className="text-[11px] text-bf-text-3 mt-0.5">
              En {horizon} años tenés{" "}
              <span className="text-emerald-400 font-semibold">{fmtC(extra)} más</span>
              {" "}que si no aportás nada
            </p>
          </div>
          {/* Tasa editable */}
          <div className="flex flex-col items-end shrink-0">
            <p className="text-[9px] text-bf-text-4 uppercase tracking-wider mb-1">Rendimiento</p>
            <div className="flex items-center gap-0.5 bg-bf-surface-2 rounded-lg px-1.5 py-1">
              <button
                onClick={() => setCustomRatePct((v) => Math.max(1, Math.round((v - 0.5) * 10) / 10))}
                className="w-5 h-5 flex items-center justify-center text-bf-text-3 hover:text-bf-text-2 transition-colors text-base leading-none"
              >−</button>
              <span className="text-[12px] font-bold text-blue-400 tabular-nums w-10 text-center">
                {yieldPct}%
              </span>
              <button
                onClick={() => setCustomRatePct((v) => Math.min(30, Math.round((v + 0.5) * 10) / 10))}
                className="w-5 h-5 flex items-center justify-center text-bf-text-3 hover:text-bf-text-2 transition-colors text-base leading-none"
              >+</button>
            </div>
            <p className="text-[9px] text-bf-text-5 mt-0.5">anual {currencyLabel}</p>
          </div>
        </div>

        {/* Selector de horizonte */}
        <div className="flex gap-1.5">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setHorizon(y)}
              className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
                horizon === y
                  ? "bg-blue-600 text-white"
                  : "bg-bf-surface-2 text-bf-text-3 hover:text-bf-text-2"
              }`}
            >
              {y}a
            </button>
          ))}
        </div>

        {/* Gráfico */}
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradWith" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradWithout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtC} tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip fmtTip={fmtC} />} />

              {visibleGoals.map((g, i) => (
                <ReferenceLine
                  key={g.id}
                  y={g.target_usd}
                  stroke={GOAL_COLORS[i % GOAL_COLORS.length]}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{
                    value: `${g.emoji} ${fmtC(g.target_usd)}`,
                    position: "insideTopRight",
                    fontSize: 9,
                    fill: GOAL_COLORS[i % GOAL_COLORS.length],
                    dy: i * 12,
                  }}
                />
              ))}

              <Area type="monotone" dataKey="without_savings_usd" name="Sin aportar" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#gradWithout)" dot={false} />
              <Area type="monotone" dataKey="with_savings_usd" name="Invirtiendo cada mes" stroke="#10b981" strokeWidth={2} fill="url(#gradWith)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda goals */}
        {visibleGoals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleGoals.map((g, i) => (
              <div key={g.id} className="flex items-center gap-1.5 text-[10px] bg-bf-surface-2/60 rounded-lg px-2 py-1">
                <div className="w-3 h-px border-t border-dashed" style={{ borderColor: GOAL_COLORS[i % GOAL_COLORS.length] }} />
                <span style={{ color: GOAL_COLORS[i % GOAL_COLORS.length] }}>{g.emoji} {g.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Insight + botón info */}
        <button
          onClick={() => setShowInfo(true)}
          className="w-full bg-bf-surface-2/40 hover:bg-bf-surface-2/70 rounded-xl px-3 py-2.5 flex items-center gap-2 transition-colors text-left"
        >
          <span className="text-base leading-none shrink-0">💡</span>
          <p className="text-[11px] text-bf-text-3 leading-snug flex-1">
            Con {yieldPct}% de rendimiento anual, cada mes que invertís genera más que el anterior —
            los rendimientos trabajan sobre los rendimientos anteriores.
          </p>
          <Info size={14} className="text-bf-text-4 shrink-0" />
        </button>
        </div>}
      </div>

      {/* Bottom sheet */}
      {showInfo && <InfoSheet data={data} onClose={() => setShowInfo(false)} />}
    </>
  );
}

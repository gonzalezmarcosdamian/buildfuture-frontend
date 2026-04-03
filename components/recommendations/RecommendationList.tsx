"use client";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Shield, TrendingUp, Zap, X, Info } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AgentSignal {
  agent: string;
  conviction: number;
  signal: string;
}

interface Rec {
  ticker: string;
  name: string;
  asset_type: string;
  job: string;               // "renta" | "capital" | "ambos"
  recommended_for: string[]; // ["conservador", "moderado", ...]
  logo_url: string;
  rationale: string;
  why_now: string;
  annual_yield_pct: number;
  yield_range_low?: number;
  yield_range_high?: number;
  yield_label?: string;
  risk_level: string;
  currency: string;
  amount_ars: number;
  amount_usd: number;
  monthly_return_usd: number;
  score: number;
  agents_agreed?: AgentSignal[];
}

interface SectionsData {
  renta: Rec[];
  capital: Rec[];
  context_summary: string;
  generated_at: string;
}

// ── Visual maps ────────────────────────────────────────────────────────────────

const riskIcon: Record<string, React.ReactNode> = {
  bajo:  <Shield size={9} />,
  medio: <TrendingUp size={9} />,
  alto:  <Zap size={9} />,
};

const riskColor: Record<string, string> = {
  bajo:  "text-emerald-400 bg-emerald-950/40 border-emerald-900/60",
  medio: "text-yellow-400 bg-yellow-950/40 border-yellow-900/60",
  alto:  "text-red-400 bg-red-950/40 border-red-900/60",
};

const profileColor: Record<string, string> = {
  conservador: "text-emerald-400 border-emerald-800/50",
  moderado:    "text-yellow-400 border-yellow-800/50",
  agresivo:    "text-red-400 border-red-800/50",
};

const assetBg: Record<string, string> = {
  LETRA:  "bg-purple-950/50 border-purple-800/40 text-purple-300",
  CEDEAR: "bg-blue-950/50 border-blue-800/40 text-blue-300",
  BOND:   "bg-orange-950/50 border-orange-800/40 text-orange-300",
  ON:     "bg-teal-950/50 border-teal-800/40 text-teal-300",
  FCI:    "bg-indigo-950/50 border-indigo-800/40 text-indigo-300",
};

const JOB_META: Record<string, { icon: string; label: string; sublabel: string; color: string }> = {
  renta:   { icon: "💰", label: "Para tu renta",        sublabel: "Flujo periódico en ARS o USD",          color: "text-emerald-400" },
  capital: { icon: "📈", label: "Para acumular capital", sublabel: "Crecimiento dolarizado a largo plazo", color: "text-blue-400"    },
};

// ── Yield range formatter ──────────────────────────────────────────────────────

function fmtRange(low: number, high: number, label: string, isCapital: boolean): { range: string; label: string } {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const prefix = isCapital && low > 0 ? "+" : "";
  return {
    range: `${prefix}${pct(low)} – ${prefix}${pct(high)}`,
    label,
  };
}

// ── Logo con fallback a iniciales ──────────────────────────────────────────────

function InstrumentLogo({ ticker, logoUrl }: { ticker: string; logoUrl?: string }) {
  const [err, setErr] = useState(false);
  if (logoUrl && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={ticker}
        onError={() => setErr(true)}
        className="w-8 h-8 rounded-full bg-bf-surface-2 object-contain p-0.5 shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-bf-surface-3 flex items-center justify-center text-[9px] font-bold text-bf-text-2 shrink-0">
      {ticker.slice(0, 2)}
    </div>
  );
}

// ── Educational content maps ───────────────────────────────────────────────────

const ASSET_DESCRIPTION: Record<string, string> = {
  LETRA:  "Letra del Tesoro Nacional. Deuda de corto plazo emitida por el Estado argentino en pesos, con tasa fija o ajustable. Ideal para estacionar pesos mientras el dinero trabaja a una tasa predecible.",
  LECAP:  "Letra del Tesoro Nacional. Deuda de corto plazo emitida por el Estado argentino en pesos, con tasa fija o ajustable. Ideal para estacionar pesos mientras el dinero trabaja a una tasa predecible.",
  FCI:    "Fondo Común de Inversión. Un vehículo colectivo que agrupa capital de muchos inversores para comprar instrumentos de renta fija. Lo gestiona un equipo profesional y podés entrar y salir con alta liquidez.",
  CEDEAR: "Certificado de Depósito Argentino. Representan acciones de empresas extranjeras —como Apple, Google o MELI— que cotizan en pesos en el mercado local con precio referenciado al dólar MEP. Permiten invertir en las mejores empresas del mundo desde Argentina.",
  ETF:    "Exchange Traded Fund cotizado como CEDEAR. Replica un índice o canasta de activos internacionales, ofreciendo diversificación global con precio en pesos referenciado al dólar.",
  BOND:   "Bono soberano argentino. El Estado emite deuda y paga cupones periódicos en dólares. Tienen mayor riesgo que la deuda corporativa, pero también mayor potencial de apreciación según el contexto macro.",
  ON:     "Obligación Negociable. Deuda emitida por empresas argentinas líderes que paga cupones en dólares hard. Ofrece flujo en USD con menor riesgo crediticio que los soberanos.",
  CRYPTO: "Activo digital descentralizado. No depende de ningún Estado ni empresa. Su precio se rige por oferta y demanda global, lo que genera alta volatilidad pero también potencial de apreciación significativo.",
};

const RISK_DESCRIPTION: Record<string, string> = {
  bajo:  "Riesgo controlado. La probabilidad de perder capital es baja y el instrumento tiene alta predictibilidad en sus flujos. Apto para cualquier perfil, especialmente si priorizás preservar valor por sobre maximizar rendimiento.",
  medio: "Riesgo moderado. Puede haber volatilidad de precio en el corto plazo, pero el activo tiene fundamentos sólidos y horizonte de recuperación razonable. Requiere cierta tolerancia a las fluctuaciones del mercado.",
  alto:  "Riesgo elevado. El precio puede oscilar significativamente. Requiere horizonte de inversión largo y tolerancia a la volatilidad. Solo para inversores que pueden mantener la posición sin necesitar el capital a corto plazo.",
};

// ── Modal de detalle ───────────────────────────────────────────────────────────

function RecModal({ rec, onClose }: { rec: Rec; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  const assetStyle = assetBg[rec.asset_type] || "bg-bf-surface-2/60 border-bf-border-2 text-bf-text-2";
  const isCapital  = rec.job === "capital";
  const hasRange   = rec.yield_range_low !== undefined && rec.yield_range_high !== undefined;
  const rangeData  = hasRange
    ? fmtRange(rec.yield_range_low!, rec.yield_range_high!, rec.yield_label ?? "", isCapital)
    : null;

  const modal = (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-bf-surface border border-bf-border-2 rounded-t-2xl w-full max-w-lg p-5 pb-8 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${assetStyle}`}>
              {rec.asset_type}
            </div>
            {rec.recommended_for.map((p) => (
              <span key={p} className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${profileColor[p] ?? ""}`}>
                {p}
              </span>
            ))}
          </div>
          <button onClick={onClose} className="text-bf-text-3 hover:text-bf-text-2 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Ticker + logo */}
        <div className="flex items-center gap-3">
          <InstrumentLogo ticker={rec.ticker} logoUrl={rec.logo_url} />
          <div>
            <p className="text-lg font-bold text-bf-text">{rec.ticker}</p>
            <p className="text-xs text-bf-text-3">{rec.name}</p>
          </div>
        </div>

        {/* Yield / range + risk */}
        <div className="flex items-center gap-3">
          {rangeData ? (
            <div>
              <p className={`text-2xl font-bold leading-tight tabular-nums ${isCapital ? "text-blue-400" : "text-emerald-400"}`}>
                {rangeData.range}
              </p>
              <p className="text-[10px] text-bf-text-3 mt-0.5">{rangeData.label}</p>
            </div>
          ) : (
            <p className="text-3xl font-bold text-emerald-400">
              {(rec.annual_yield_pct * 100).toFixed(1)}%
            </p>
          )}
          <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border w-fit ${riskColor[rec.risk_level]}`}>
            {riskIcon[rec.risk_level]}
            <span className="ml-0.5 capitalize">{rec.risk_level}</span>
          </span>
        </div>

        {/* Capital → retorno */}
        <div className="flex items-center justify-between bg-bf-surface-2/50 rounded-xl px-3 py-2.5">
          <div>
            <p className="text-[10px] text-bf-text-3">Invertir</p>
            <p className="text-sm font-semibold text-bf-text-2">
              ${rec.amount_usd.toLocaleString("es-AR", { maximumFractionDigits: 0 })} USD
            </p>
          </div>
          <div className="text-right">
            {isCapital ? (
              <>
                <p className="text-[10px] text-bf-text-3">Apreciación estimada</p>
                <p className="text-sm font-semibold text-blue-400">
                  {rangeData ? rangeData.range : `+${(rec.annual_yield_pct * 100).toFixed(1)}%`} USD/año
                </p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-bf-text-3">Genera</p>
                <p className="text-sm font-semibold text-emerald-400">
                  +${rec.monthly_return_usd.toFixed(2)} USD/mes
                </p>
              </>
            )}
          </div>
        </div>

        {/* ¿Qué es? */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-bf-text-3 uppercase tracking-wider">¿Qué es?</p>
          <p className="text-xs text-bf-text-2 leading-relaxed">
            {ASSET_DESCRIPTION[rec.asset_type] ?? `Instrumento financiero de tipo ${rec.asset_type}.`}
          </p>
        </div>

        {/* ¿Por qué ahora? */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-bf-text-3 uppercase tracking-wider">¿Por qué ahora?</p>
          <p className="text-xs text-bf-text-2 leading-relaxed">{rec.why_now || rec.rationale}</p>
        </div>

        {/* ¿Qué riesgo tiene? */}
        <div className={`rounded-xl border px-3 py-2.5 space-y-1 ${riskColor[rec.risk_level] ?? "border-bf-border-2 bg-bf-surface-2/40 text-bf-text-3"}`}>
          <div className="flex items-center gap-1.5">
            {riskIcon[rec.risk_level]}
            <p className="text-[10px] font-semibold uppercase tracking-wider">¿Qué riesgo tiene?</p>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {RISK_DESCRIPTION[rec.risk_level] ?? "Consultá con un asesor financiero para evaluar si este instrumento es adecuado para tu perfil."}
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Card ───────────────────────────────────────────────────────────────────────

function RecCard({ rec, onInfo }: { rec: Rec; onInfo: () => void }) {
  const assetStyle = assetBg[rec.asset_type] || "bg-bf-surface-2/60 border-bf-border-2 text-bf-text-2";
  const isCapital  = rec.job === "capital";
  const hasRange   = rec.yield_range_low !== undefined && rec.yield_range_high !== undefined;
  const rangeData  = hasRange
    ? fmtRange(rec.yield_range_low!, rec.yield_range_high!, rec.yield_label ?? "", isCapital)
    : null;

  return (
    <div className="snap-center shrink-0 w-[58vw] max-w-[210px] rounded-2xl border bg-bf-surface border-bf-border flex flex-col">
      <div className="p-3 flex flex-col gap-2.5">

        {/* Top: asset badge + info button */}
        <div className="flex items-center justify-between">
          <div className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold tracking-wide ${assetStyle}`}>
            {rec.asset_type}
          </div>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onInfo(); }}
            className="text-bf-text-4 hover:text-bf-text-3 transition-colors p-1 -m-1"
          >
            <Info size={13} />
          </button>
        </div>

        {/* Logo + ticker */}
        <div className="flex items-center gap-2">
          <InstrumentLogo ticker={rec.ticker} logoUrl={rec.logo_url} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-bf-text leading-tight">{rec.ticker}</p>
            <p className="text-[10px] text-bf-text-3 leading-tight mt-0.5 truncate">{rec.name}</p>
          </div>
        </div>

        {/* Yield range + risk */}
        <div className="space-y-1">
          <p className={`text-lg font-bold leading-tight tabular-nums ${isCapital ? "text-blue-400" : "text-emerald-400"}`}>
            {rangeData ? rangeData.range : `${(rec.annual_yield_pct * 100).toFixed(1)}%`}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] text-bf-text-4 leading-none">
              {rangeData ? rangeData.label : `${rec.currency}/año`}
            </p>
            <span className={`flex items-center gap-0.5 text-[8px] px-1 py-0.5 rounded-full border w-fit ${riskColor[rec.risk_level]}`}>
              {riskIcon[rec.risk_level]}
              <span className="ml-0.5 capitalize">{rec.risk_level}</span>
            </span>
          </div>
        </div>

        {/* Profile pills */}
        <div className="flex flex-wrap gap-1">
          {(rec.recommended_for ?? []).map((p) => (
            <span key={p} className={`text-[8px] px-1.5 py-0.5 rounded-md border font-medium ${profileColor[p] ?? "text-bf-text-3 border-bf-border-2"}`}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sección (renta o capital) ──────────────────────────────────────────────────

function RecSection({
  job,
  recs,
  onInfo,
  refreshing,
}: {
  job: "renta" | "capital";
  recs: Rec[];
  onInfo: (rec: Rec) => void;
  refreshing: boolean;
}) {
  if (recs.length === 0) return null;
  const meta = JOB_META[job];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{meta.icon}</span>
        <div>
          <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
          <p className="text-[10px] text-bf-text-4">{meta.sublabel}</p>
        </div>
      </div>

      {refreshing ? (
        <div className="flex gap-3 -mx-4 px-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[58vw] max-w-[210px] rounded-2xl border border-bf-border bg-bf-surface p-3 space-y-3 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-4 w-12 bg-bf-surface-2 rounded-md" />
                <div className="h-4 w-4 bg-bf-surface-2 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-bf-surface-2 rounded-full" />
                <div className="space-y-1">
                  <div className="h-3 w-14 bg-bf-surface-2 rounded" />
                  <div className="h-2 w-20 bg-bf-surface-2 rounded" />
                </div>
              </div>
              <div className="h-7 w-20 bg-bf-surface-2 rounded" />
              <div className="h-14 bg-bf-surface-2/50 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 -mx-4 px-4 pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {recs.map((rec) => (
            <RecCard key={rec.ticker} rec={rec} onInfo={() => onInfo(rec)} />
          ))}
          <div className="shrink-0 w-2" />
        </div>
      )}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function RecommendationList({
  capitalArs = 500000,
}: {
  capitalArs?: number;
  userProfile?: string | null; // mantenido para retrocompatibilidad, no usado
}) {
  const [data, setData]         = useState<SectionsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalRec, setModalRec] = useState<Rec | null>(null);

  const load = useCallback(async (force = false) => {
    if (force) { setRefreshing(true); } else { setLoading(true); }
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      const url = `${API_URL}/portfolio/recommendations/sections?capital_ars=${capitalArs}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [capitalArs]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        {["renta", "capital"].map((s) => (
          <div key={s} className="space-y-2">
            <div className="h-4 w-32 bg-bf-surface-2 rounded animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shrink-0 w-[58vw] max-w-[210px] h-52 bg-bf-surface-2/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {modalRec && <RecModal rec={modalRec} onClose={() => setModalRec(null)} />}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-bf-text">Dónde invertir</h2>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-bf-text-3 hover:text-blue-400 transition-colors"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Sección renta */}
        <RecSection job="renta" recs={data.renta} onInfo={setModalRec} refreshing={refreshing} />

        {data.renta.length > 0 && data.capital.length > 0 && (
          <div className="border-t border-bf-border" />
        )}

        {/* Sección capital */}
        <RecSection job="capital" recs={data.capital} onInfo={setModalRec} refreshing={refreshing} />

        <p className="text-[10px] text-bf-text-5 text-center">
          Datos en tiempo real · No es asesoramiento financiero
        </p>
      </div>
    </>
  );
}

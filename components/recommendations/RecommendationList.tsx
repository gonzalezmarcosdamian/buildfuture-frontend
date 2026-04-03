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
        className="w-8 h-8 rounded-full bg-slate-800 object-contain p-0.5 shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 shrink-0">
      {ticker.slice(0, 2)}
    </div>
  );
}

// ── Conviction bar ─────────────────────────────────────────────────────────────

function convictionBar(conviction: number) {
  const pct = Math.round(conviction * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-slate-500 w-6 text-right">{pct}%</span>
    </div>
  );
}

// ── Modal de detalle ───────────────────────────────────────────────────────────

function RecModal({ rec, onClose }: { rec: Rec; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  const yieldPct   = (rec.annual_yield_pct * 100).toFixed(2);
  const assetStyle = assetBg[rec.asset_type] || "bg-slate-800/60 border-slate-700 text-slate-300";
  const isCapital  = rec.job === "capital";

  const modal = (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl w-full max-w-lg p-5 pb-8 space-y-4"
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
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        {/* Ticker + logo */}
        <div className="flex items-center gap-3">
          <InstrumentLogo ticker={rec.ticker} logoUrl={rec.logo_url} />
          <div>
            <p className="text-lg font-bold text-slate-100">{rec.ticker}</p>
            <p className="text-xs text-slate-500">{rec.name}</p>
          </div>
        </div>

        {/* Yield + risk */}
        <div className="flex items-center gap-3">
          <p className="text-3xl font-bold text-emerald-400">{yieldPct}%</p>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-600">{rec.currency}/año</p>
            <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border w-fit ${riskColor[rec.risk_level]}`}>
              {riskIcon[rec.risk_level]}
              <span className="ml-0.5 capitalize">{rec.risk_level}</span>
            </span>
          </div>
        </div>

        {/* Capital → retorno */}
        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2.5">
          <div>
            <p className="text-[10px] text-slate-500">Invertir</p>
            <p className="text-sm font-semibold text-slate-200">
              ${rec.amount_usd.toLocaleString("es-AR", { maximumFractionDigits: 0 })} USD
            </p>
          </div>
          <div className="text-right">
            {isCapital ? (
              <>
                <p className="text-[10px] text-slate-500">Apreciación estimada</p>
                <p className="text-sm font-semibold text-blue-400">+{yieldPct}% USD/año</p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-slate-500">Genera</p>
                <p className="text-sm font-semibold text-emerald-400">
                  +${rec.monthly_return_usd.toFixed(2)} USD/mes
                </p>
              </>
            )}
          </div>
        </div>

        {/* Por qué ahora */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Por qué ahora</p>
          <p className="text-xs text-slate-300 leading-relaxed">{rec.why_now || rec.rationale}</p>
        </div>

        {/* Agentes */}
        {rec.agents_agreed && rec.agents_agreed.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Comité — {rec.agents_agreed.length} agente{rec.agents_agreed.length > 1 ? "s" : ""} de acuerdo
            </p>
            {rec.agents_agreed.map((a) => (
              <div key={a.agent} className="space-y-0.5">
                <p className="text-[11px] font-medium text-slate-300">{a.agent}</p>
                {convictionBar(a.conviction)}
                <p className="text-[10px] text-slate-500 leading-snug">{a.signal}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Card ───────────────────────────────────────────────────────────────────────

function RecCard({ rec, onInfo }: { rec: Rec; onInfo: () => void }) {
  const yieldPct   = (rec.annual_yield_pct * 100).toFixed(2);
  const assetStyle = assetBg[rec.asset_type] || "bg-slate-800/60 border-slate-700 text-slate-300";
  const isCapital  = rec.job === "capital";

  return (
    <div className="snap-center shrink-0 w-[58vw] max-w-[210px] rounded-2xl border bg-slate-900 border-slate-800 flex flex-col">
      <div className="p-3 flex flex-col gap-2.5">

        {/* Top: asset badge + info button */}
        <div className="flex items-center justify-between">
          <div className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold tracking-wide ${assetStyle}`}>
            {rec.asset_type}
          </div>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onInfo(); }}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1 -m-1"
          >
            <Info size={13} />
          </button>
        </div>

        {/* Logo + ticker */}
        <div className="flex items-center gap-2">
          <InstrumentLogo ticker={rec.ticker} logoUrl={rec.logo_url} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-100 leading-tight">{rec.ticker}</p>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">{rec.name}</p>
          </div>
        </div>

        {/* Yield */}
        <div className="flex items-end gap-1.5">
          <p className={`text-2xl font-bold leading-none ${isCapital ? "text-blue-400" : "text-emerald-400"}`}>
            {yieldPct}%
          </p>
          <div className="pb-0.5">
            <p className="text-[9px] text-slate-600 leading-none">{rec.currency}/año</p>
            <span className={`flex items-center gap-0.5 text-[8px] px-1 py-0.5 rounded-full border w-fit mt-0.5 ${riskColor[rec.risk_level]}`}>
              {riskIcon[rec.risk_level]}
            </span>
          </div>
        </div>

        {/* Retorno */}
        <div className="bg-slate-800/50 rounded-lg px-2.5 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-slate-500">Invertir</p>
            <p className="text-[11px] font-semibold text-slate-200">
              ${rec.amount_usd.toLocaleString("es-AR", { maximumFractionDigits: 0 })} USD
            </p>
          </div>
          <div className="flex items-center justify-between">
            {isCapital ? (
              <>
                <p className="text-[9px] text-slate-500">Apreciación</p>
                <p className="text-[11px] font-semibold text-blue-400">+{yieldPct}%/año</p>
              </>
            ) : (
              <>
                <p className="text-[9px] text-slate-500">Retorno</p>
                <p className="text-[11px] font-semibold text-emerald-400">
                  +${rec.monthly_return_usd.toFixed(2)}/mes
                </p>
              </>
            )}
          </div>
        </div>

        {/* Profile pills */}
        <div className="flex flex-wrap gap-1">
          {(rec.recommended_for ?? []).map((p) => (
            <span key={p} className={`text-[8px] px-1.5 py-0.5 rounded-md border font-medium ${profileColor[p] ?? "text-slate-400 border-slate-700"}`}>
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
          <p className="text-[10px] text-slate-600">{meta.sublabel}</p>
        </div>
      </div>

      {refreshing ? (
        <div className="flex gap-3 -mx-4 px-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[58vw] max-w-[210px] rounded-2xl border border-slate-800 bg-slate-900 p-3 space-y-3 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-4 w-12 bg-slate-800 rounded-md" />
                <div className="h-4 w-4 bg-slate-800 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-800 rounded-full" />
                <div className="space-y-1">
                  <div className="h-3 w-14 bg-slate-800 rounded" />
                  <div className="h-2 w-20 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-7 w-20 bg-slate-800 rounded" />
              <div className="h-14 bg-slate-800/50 rounded-lg" />
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
            <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shrink-0 w-[58vw] max-w-[210px] h-52 bg-slate-800/60 rounded-2xl animate-pulse" />
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
          <h2 className="text-sm font-semibold text-slate-100">Dónde invertir</h2>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-slate-500 hover:text-blue-400 transition-colors"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Sección renta */}
        <RecSection job="renta" recs={data.renta} onInfo={setModalRec} refreshing={refreshing} />

        {data.renta.length > 0 && data.capital.length > 0 && (
          <div className="border-t border-slate-800" />
        )}

        {/* Sección capital */}
        <RecSection job="capital" recs={data.capital} onInfo={setModalRec} refreshing={refreshing} />

        <p className="text-[10px] text-slate-700 text-center">
          Datos en tiempo real · No es asesoramiento financiero
        </p>
      </div>
    </>
  );
}

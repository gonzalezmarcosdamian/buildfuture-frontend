"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Shield, TrendingUp, Zap, X, Info } from "lucide-react";

interface AgentSignal {
  agent: string;
  conviction: number;
  signal: string;
}

interface Rec {
  rank: number;
  ticker: string;
  name: string;
  asset_type: string;
  rationale: string;
  why_now: string;
  annual_yield_pct: number;
  risk_level: string;
  currency: string;
  allocation_pct: number;
  amount_ars: number;
  amount_usd: number;
  monthly_return_usd: number;
  is_hero: boolean;
  agents_agreed?: AgentSignal[];
}

interface RecsData {
  generated_at: string;
  valid_until: string;
  context_summary: string;
  recommendations: Rec[];
}

const RISK_PROFILES = [
  { id: "conservador", label: "Conservador" },
  { id: "moderado",    label: "Moderado"    },
  { id: "agresivo",    label: "Agresivo"    },
];

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

const assetBg: Record<string, string> = {
  LETRA:  "bg-purple-950/50 border-purple-800/40 text-purple-300",
  CEDEAR: "bg-blue-950/50 border-blue-800/40 text-blue-300",
  BOND:   "bg-orange-950/50 border-orange-800/40 text-orange-300",
  ON:     "bg-teal-950/50 border-teal-800/40 text-teal-300",
  FCI:    "bg-indigo-950/50 border-indigo-800/40 text-indigo-300",
};

function convictionBar(conviction: number) {
  const pct = Math.round(conviction * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[9px] text-slate-500 w-6 text-right">{pct}%</span>
    </div>
  );
}

function RecModal({ rec, onClose }: { rec: Rec; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  const yieldPct = (rec.annual_yield_pct * 100).toFixed(0);
  const assetStyle = assetBg[rec.asset_type] || "bg-slate-800/60 border-slate-700 text-slate-300";

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
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${assetStyle}`}>
              {rec.asset_type}
            </div>
            {rec.is_hero && (
              <span className="text-[9px] bg-blue-600 text-white font-semibold px-1.5 py-0.5 rounded-full">
                top pick
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        <div>
          <p className="text-lg font-bold text-slate-100">{rec.ticker}</p>
          <p className="text-xs text-slate-500">{rec.name}</p>
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
            <p className="text-[10px] text-slate-500">Genera</p>
            <p className="text-sm font-semibold text-emerald-400">
              +${rec.monthly_return_usd.toFixed(1)} USD/mes
            </p>
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
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-300">{a.agent}</p>
                </div>
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

function RecCard({ rec, onInfo }: { rec: Rec; onInfo: () => void }) {
  const yieldPct = (rec.annual_yield_pct * 100).toFixed(0);
  const assetStyle = assetBg[rec.asset_type] || "bg-slate-800/60 border-slate-700 text-slate-300";

  return (
    <div
      className={`snap-center shrink-0 w-[58vw] max-w-[210px] rounded-2xl border flex flex-col ${
        rec.is_hero
          ? "bg-gradient-to-br from-blue-950/60 to-slate-900 border-blue-800/50"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      <div className="p-3 flex flex-col gap-2.5">
        {/* Top: badge + info button */}
        <div className="flex items-center justify-between">
          <div className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold tracking-wide ${assetStyle}`}>
            {rec.asset_type}
          </div>
          <button
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onInfo(); }}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1 -m-1"
          >
            <Info size={13} />
          </button>
        </div>

        {/* Ticker */}
        <div>
          <p className="text-sm font-bold text-slate-100 leading-tight">{rec.ticker}</p>
          <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-1">{rec.name}</p>
        </div>

        {/* Yield */}
        <div className="flex items-end gap-1.5">
          <p className="text-2xl font-bold text-emerald-400 leading-none">{yieldPct}%</p>
          <div className="pb-0.5">
            <p className="text-[9px] text-slate-600 leading-none">{rec.currency}/año</p>
            <span className={`flex items-center gap-0.5 text-[8px] px-1 py-0.5 rounded-full border w-fit mt-0.5 ${riskColor[rec.risk_level]}`}>
              {riskIcon[rec.risk_level]}
            </span>
          </div>
        </div>

        {/* Capital → retorno */}
        <div className="bg-slate-800/50 rounded-lg px-2.5 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-slate-500">Invertir</p>
            <p className="text-[11px] font-semibold text-slate-200">
              ${rec.amount_usd.toLocaleString("es-AR", { maximumFractionDigits: 0 })} USD
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-slate-500">Retorno</p>
            <p className="text-[11px] font-semibold text-emerald-400">
              +${rec.monthly_return_usd.toFixed(1)}/mes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecommendationList({
  capitalArs = 500000,
  userProfile,
}: {
  capitalArs?: number;
  userProfile?: string | null;
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";
  const [data, setData] = useState<RecsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskProfile, setRiskProfile] = useState(userProfile || "moderado");
  const [modalRec, setModalRec] = useState<Rec | null>(null);
  // Fallback a "moderado" si el endpoint de perfil no devuelve un valor
  const effectiveUserProfile = userProfile || "moderado";

  async function load(force = false, profile = riskProfile) {
    force ? setRefreshing(true) : setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      const url = `${API_URL}/portfolio/recommendations?capital_ars=${capitalArs}&risk_profile=${profile}${force ? "&force_refresh=true" : ""}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [capitalArs]);

  function changeProfile(profile: string) {
    setRiskProfile(profile);
    load(true, profile);
  }

  if (loading) return (
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3].map(i => (
        <div key={i} className="shrink-0 w-[58vw] max-w-[210px] h-44 bg-slate-800/60 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  if (!data) return null;

  const sorted = [...data.recommendations].sort((a, b) => (b.is_hero ? 1 : 0) - (a.is_hero ? 1 : 0));

  return (
    <>
      {modalRec && <RecModal rec={modalRec} onClose={() => setModalRec(null)} />}

      <div className="space-y-3">
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

        {/* Risk profile tabs */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          {RISK_PROFILES.map((p) => {
            const isSelected = riskProfile === p.id;
            const isUser = effectiveUserProfile === p.id;
            return (
              <button
                key={p.id}
                onClick={() => changeProfile(p.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5
                  ${isSelected && isUser
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                    : isSelected
                    ? "bg-slate-700 text-slate-100"
                    : isUser
                    ? "bg-blue-950/60 border border-blue-700/70 text-blue-300"
                    : "text-slate-500 hover:text-slate-300"
                  }`}
              >
                <span>{p.label}</span>
                {isUser && (
                  <span className={`text-[8px] font-bold leading-none ${isSelected ? "text-blue-100" : "text-blue-400"}`}>
                    para vos ✦
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Carousel */}
        <div
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 -mx-4 px-4 pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {sorted.map((rec) => (
            <RecCard key={rec.ticker} rec={rec} onInfo={() => setModalRec(rec)} />
          ))}
          <div className="shrink-0 w-2" />
        </div>

        <p className="text-[10px] text-slate-700 text-center">
          Datos en tiempo real · No es asesoramiento financiero
        </p>
      </div>
    </>
  );
}

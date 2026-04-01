"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { RefreshCw, Shield, TrendingUp, Zap, ChevronDown, ChevronUp } from "lucide-react";

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

function RecCard({ rec }: { rec: Rec }) {
  const [expanded, setExpanded] = useState(false);
  const yieldPct = (rec.annual_yield_pct * 100).toFixed(0);
  const assetStyle = assetBg[rec.asset_type] || "bg-slate-800/60 border-slate-700 text-slate-300";

  return (
    <div
      className={`snap-center shrink-0 w-[75vw] max-w-[260px] rounded-2xl border flex flex-col ${
        rec.is_hero
          ? "bg-gradient-to-br from-blue-950/60 to-slate-900 border-blue-800/50"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      <div className="p-4 flex flex-col gap-3 h-full">
        {/* Top: asset badge + hero */}
        <div className="flex items-center justify-between">
          <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold tracking-wide ${assetStyle}`}>
            {rec.asset_type}
          </div>
          {rec.is_hero && (
            <span className="text-[9px] bg-blue-600 text-white font-semibold px-1.5 py-0.5 rounded-full">
              top pick
            </span>
          )}
        </div>

        {/* Ticker + name */}
        <div>
          <p className="text-base font-bold text-slate-100 leading-tight">{rec.ticker}</p>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{rec.name}</p>
        </div>

        {/* Yield big number */}
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-emerald-400 leading-none">{yieldPct}%</p>
          <div className="pb-0.5 space-y-1">
            <p className="text-[9px] text-slate-600 leading-none">{rec.currency}/año</p>
            <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border w-fit ${riskColor[rec.risk_level]}`}>
              {riskIcon[rec.risk_level]}
              <span className="ml-0.5 capitalize">{rec.risk_level}</span>
            </span>
          </div>
        </div>

        {/* Allocation + return row */}
        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2">
          <div>
            <p className="text-[10px] text-slate-500">Asignar</p>
            <p className="text-xs font-semibold text-slate-200">
              {(rec.allocation_pct * 100).toFixed(0)}% del capital
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Retorno est.</p>
            <p className="text-xs font-semibold text-emerald-400">
              +${rec.monthly_return_usd.toFixed(1)}/mes
            </p>
          </div>
        </div>

        {/* Expandable why_now */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {expanded ? "Menos" : "Por qué ahora"}
        </button>
        {expanded && (
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {rec.why_now || rec.rationale}
          </p>
        )}
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
    <div className="space-y-2">
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="shrink-0 w-[75vw] max-w-[260px] h-52 bg-slate-800/60 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (!data) return null;

  const sorted = [...data.recommendations].sort((a, b) => (b.is_hero ? 1 : 0) - (a.is_hero ? 1 : 0));

  return (
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
        {RISK_PROFILES.map((p) => (
          <button
            key={p.id}
            onClick={() => changeProfile(p.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
              riskProfile === p.id
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>{p.label}</span>
            {userProfile === p.id && (
              <span className="text-[8px] text-blue-400 font-semibold leading-none">para vos</span>
            )}
          </button>
        ))}
      </div>

      {/* Carousel */}
      <div
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 -mx-4 px-4 pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sorted.map((rec) => (
          <RecCard key={rec.ticker} rec={rec} />
        ))}
        {/* Spacer so last card isn't flush with edge */}
        <div className="shrink-0 w-4" />
      </div>

      <p className="text-[10px] text-slate-700 text-center">
        Datos en tiempo real · No es asesoramiento financiero
      </p>
    </div>
  );
}

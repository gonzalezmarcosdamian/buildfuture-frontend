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
  bajo:  <Shield size={10} />,
  medio: <TrendingUp size={10} />,
  alto:  <Zap size={10} />,
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

function RecCard({ rec, expanded, onToggle }: { rec: Rec; expanded: boolean; onToggle: () => void }) {
  const yieldPct = (rec.annual_yield_pct * 100).toFixed(0);
  const assetStyle = assetBg[rec.asset_type] || "bg-slate-800/60 border-slate-700 text-slate-300";

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        rec.is_hero
          ? "bg-gradient-to-br from-blue-950/40 to-slate-900 border-blue-800/50"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* Main row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Asset type badge */}
        <div className={`shrink-0 px-2 py-1 rounded-lg border text-[10px] font-bold tracking-wide ${assetStyle}`}>
          {rec.asset_type}
        </div>

        {/* Ticker + name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-100">{rec.ticker}</span>
            {rec.is_hero && (
              <span className="text-[9px] bg-blue-600 text-white font-semibold px-1.5 py-0.5 rounded-full">
                top pick
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate">{rec.name}</p>
        </div>

        {/* Yield + risk */}
        <div className="shrink-0 text-right flex items-center gap-2">
          <div>
            <p className="text-base font-bold text-emerald-400">{yieldPct}%</p>
            <p className="text-[9px] text-slate-600">{rec.currency}/año</p>
          </div>
          <span className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border ${riskColor[rec.risk_level]}`}>
            {riskIcon[rec.risk_level]}
          </span>
          {expanded
            ? <ChevronUp size={13} className="text-slate-600" />
            : <ChevronDown size={13} className="text-slate-600" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800/60 pt-3">
          <p className="text-xs text-slate-400 leading-relaxed">{rec.why_now || rec.rationale}</p>
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
                +${rec.monthly_return_usd.toFixed(1)} USD/mes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RecommendationList({ capitalArs = 500000 }: { capitalArs?: number }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";
  const [data, setData] = useState<RecsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskProfile, setRiskProfile] = useState("moderado");
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

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
    setExpandedTicker(null);
    load(true, profile);
  }

  if (loading) return (
    <div className="space-y-2">
      {[1,2,3].map(i => (
        <div key={i} className="h-16 bg-slate-800/60 rounded-2xl animate-pulse" />
      ))}
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
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              riskProfile === p.id
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {sorted.map((rec) => (
        <RecCard
          key={rec.ticker}
          rec={rec}
          expanded={expandedTicker === rec.ticker}
          onToggle={() => setExpandedTicker(expandedTicker === rec.ticker ? null : rec.ticker)}
        />
      ))}

      <p className="text-[10px] text-slate-700 text-center">
        Datos en tiempo real · No es asesoramiento financiero
      </p>
    </div>
  );
}

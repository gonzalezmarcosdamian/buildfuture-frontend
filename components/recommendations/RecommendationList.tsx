"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, Shield, TrendingUp, Zap } from "lucide-react";
import { formatARS } from "@/lib/formatters";

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

const riskIcon: Record<string, React.ReactNode> = {
  bajo:  <Shield size={11} />,
  medio: <TrendingUp size={11} />,
  alto:  <Zap size={11} />,
};

const riskColor: Record<string, string> = {
  bajo:  "text-emerald-400 bg-emerald-950/40 border-emerald-900",
  medio: "text-yellow-400 bg-yellow-950/40 border-yellow-900",
  alto:  "text-red-400 bg-red-950/40 border-red-900",
};

const assetColor: Record<string, string> = {
  LETRA:  "text-purple-400",
  CEDEAR: "text-blue-400",
  BOND:   "text-orange-400",
  ON:     "text-teal-400",
};

// Perfil recomendado para el usuario (basado en su perfil configurado)
const RECOMMENDED_PROFILE = "moderado";

const RISK_PROFILES = [
  { id: "conservador", label: "Conservador", color: "text-emerald-400 border-emerald-800 bg-emerald-950/30" },
  { id: "moderado",    label: "Moderado",    color: "text-yellow-400 border-yellow-800 bg-yellow-950/30" },
  { id: "agresivo",    label: "Agresivo",    color: "text-red-400 border-red-800 bg-red-950/30" },
];

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function RecommendationList({ capitalArs = 500000 }: { capitalArs?: number }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";
  const [data, setData] = useState<RecsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskProfile, setRiskProfile] = useState(RECOMMENDED_PROFILE);

  async function load(force = false, profile = riskProfile) {
    force ? setRefreshing(true) : setLoading(true);
    try {
      const url = `${API_URL}/portfolio/recommendations?capital_ars=${capitalArs}&risk_profile=${profile}${force ? "&force_refresh=true" : ""}`;
      const { data: _s } = await supabase.auth.getSession();
      const _tok = _s.session?.access_token;
      const res = await fetch(url, { headers: _tok ? { Authorization: `Bearer ${_tok}` } : {} });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
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
    <div className="space-y-3">
      <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="h-32 bg-slate-800 rounded-2xl animate-pulse" />
      <div className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
      <div className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
    </div>
  );

  if (!data) return null;

  const hero = data.recommendations.find(r => r.is_hero);
  const rest = data.recommendations.filter(r => !r.is_hero);
  const days = daysUntil(data.valid_until);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-100">Recomendaciones</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Válido {days}d</span>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-slate-500 hover:text-blue-400 transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Selector perfil de riesgo */}
      <div className="flex gap-2">
        {RISK_PROFILES.map((p) => (
          <button
            key={p.id}
            onClick={() => changeProfile(p.id)}
            className={`relative flex-1 py-1.5 rounded-xl text-[11px] font-medium border transition-all ${
              riskProfile === p.id ? p.color : "text-slate-500 border-slate-800 bg-slate-900"
            }`}
          >
            {p.label}
            {p.id === RECOMMENDED_PROFILE && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] bg-yellow-500 text-black font-bold px-1.5 py-px rounded-full leading-tight whitespace-nowrap">
                para vos
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Context summary */}
      <p className="text-xs text-slate-400 leading-relaxed">{data.context_summary}</p>

      {/* Market data pill */}
      {(data as any).market_data && (
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
          <span>MEP ${(data as any).market_data.mep}</span>
          <span>·</span>
          <span>Spread {(data as any).market_data.spread_pct}%</span>
          <span>·</span>
          <span>Inflación {(data as any).market_data.inflation_monthly}%/mes</span>
          <span>·</span>
          <span>Tasa real {(data as any).market_data.tasa_real_mensual > 0 ? "+" : ""}{(data as any).market_data.tasa_real_mensual}pp</span>
        </div>
      )}

      {/* Hero card */}
      {hero && (
        <div className="bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-800/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded-full font-medium">
              Mejor match para vos ahora
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${riskColor[hero.risk_level]}`}>
              {riskIcon[hero.risk_level]} riesgo {hero.risk_level}
            </span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <p className={`text-lg font-bold ${assetColor[hero.asset_type] || "text-slate-100"}`}>
                {hero.ticker}
              </p>
              <p className="text-xs text-slate-400">{hero.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400">{(hero.annual_yield_pct * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-slate-500">anual en {hero.currency}</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{hero.rationale}</p>

          <div className="bg-blue-950/40 rounded-xl px-3 py-2 border border-blue-900/30">
            <p className="text-[10px] text-blue-300 font-medium mb-0.5">Por qué ahora</p>
            <p className="text-[11px] text-slate-400">{hero.why_now}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-semibold text-slate-200">{formatARS(hero.amount_ars)}</p>
              <p className="text-[10px] text-slate-500">{(hero.allocation_pct * 100).toFixed(0)}% del capital</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-emerald-400">+USD {hero.monthly_return_usd.toFixed(1)}/mes</p>
              <p className="text-[10px] text-slate-500">retorno estimado</p>
            </div>
          </div>
        </div>
      )}

      {/* Resto rankeado */}
      {rest.map((rec) => (
        <div key={rec.ticker} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-slate-400">#{rec.rank}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-bold ${assetColor[rec.asset_type] || "text-slate-100"}`}>
                  {rec.ticker}
                  <span className="text-slate-500 font-normal text-xs ml-1.5">{rec.name}</span>
                </p>
                <p className="text-sm font-bold text-emerald-400 shrink-0">
                  {(rec.annual_yield_pct * 100).toFixed(0)}%
                </p>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{rec.rationale}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border ${riskColor[rec.risk_level]}`}>
                    {riskIcon[rec.risk_level]} {rec.risk_level}
                  </span>
                  <span className="text-[10px] text-slate-500">{rec.currency}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">{formatARS(rec.amount_ars)}</span>
                  <span className="text-[10px] text-slate-500 ml-1">→ +${rec.monthly_return_usd.toFixed(1)}/mes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <p className="text-[10px] text-slate-600 text-center">
        Datos en tiempo real · No es asesoramiento financiero formal
      </p>
    </div>
  );
}

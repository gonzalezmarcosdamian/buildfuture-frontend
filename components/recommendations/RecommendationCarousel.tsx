"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { TrendingUp, Shield, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { formatARS } from "@/lib/formatters";

interface Recommendation {
  ticker: string;
  name: string;
  asset_type: string;
  market: string;
  allocation_pct: number;
  amount_ars: number;
  amount_usd: number;
  annual_yield_pct: number;
  monthly_return_usd: number;
  rationale: string;
  risk_level: string;
  currency: string;
  already_in_portfolio: boolean;
  job: string;
  recommended_for: string[];
}

const riskColors: Record<string, string> = {
  bajo: "text-emerald-400 bg-emerald-950/40 border-emerald-900",
  medio: "text-yellow-400 bg-yellow-950/40 border-yellow-900",
  alto: "text-red-400 bg-red-950/40 border-red-900",
};

const assetColors: Record<string, string> = {
  LETRA: "text-purple-400",
  CEDEAR: "text-blue-400",
  BOND: "text-orange-400",
  ON: "text-teal-400",
  CRYPTO: "text-yellow-400",
};

const riskIcons: Record<string, React.ReactNode> = {
  bajo: <Shield size={11} />,
  medio: <TrendingUp size={11} />,
  alto: <Zap size={11} />,
};

const profileColors: Record<string, string> = {
  conservador: "text-emerald-400 bg-emerald-950/60 border-emerald-900",
  moderado: "text-yellow-400 bg-yellow-950/60 border-yellow-900",
  agresivo: "text-red-400 bg-red-950/60 border-red-900",
};

const jobLabel: Record<string, string> = {
  renta: "Renta",
  capital: "Capital",
  ambos: "Renta + Capital",
};

const jobColors: Record<string, string> = {
  renta: "text-teal-400 bg-teal-950/40 border-teal-900",
  capital: "text-blue-400 bg-blue-950/40 border-blue-900",
  ambos: "text-purple-400 bg-purple-950/40 border-purple-900",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

export function RecommendationCarousel({ capitalArs = 500000, fxRate = 1320 }: { capitalArs?: number; fxRate?: number }) {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: _s }) => fetch(`${API_URL}/portfolio/recommendations?capital_ars=${capitalArs}&fx_rate=${fxRate}&risk_profile=moderado`, { headers: _s.session?.access_token ? { Authorization: `Bearer ${_s.session.access_token}` } : {} }))
      .then((r) => r.json())
      .then((data) => { setRecs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [capitalArs, fxRate]);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 220 : -220, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-40 bg-slate-800 rounded animate-pulse" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 w-52 shrink-0 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Para vos mañana</h2>
          <p className="text-xs text-slate-500">{formatARS(capitalArs)} a invertir · objetivo libertad financiera</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll("left")} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => scroll("right")} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {recs.map((rec) => (
          <div
            key={rec.ticker}
            className="shrink-0 w-52 snap-start bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs font-bold ${assetColors[rec.asset_type] || "text-slate-300"}`}>
                  {rec.ticker}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{rec.name}</p>
              </div>
              {rec.already_in_portfolio && (
                <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">ya tenés</span>
              )}
            </div>

            {/* Yield */}
            <div className="bg-slate-800 rounded-xl px-3 py-2">
              <p className="text-[10px] text-slate-500">Rendimiento anual est.</p>
              <p className="text-lg font-bold text-emerald-400">{(rec.annual_yield_pct * 100).toFixed(2)}%</p>
              <p className="text-[10px] text-slate-500">{rec.currency === "USD" ? "en USD" : "en ARS"}</p>
            </div>

            {/* Allocation */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Monto sugerido</span>
                <span className="text-slate-300">{(rec.allocation_pct * 100).toFixed(2)}%</span>
              </div>
              <p className="text-xs font-medium text-slate-200">{formatARS(rec.amount_ars)}</p>
              <p className="text-[10px] text-slate-500">≈ USD {rec.amount_usd} → +${rec.monthly_return_usd}/mes</p>
            </div>

            {/* Job + Risk badges */}
            <div className="flex flex-wrap gap-1">
              <div className={`flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded-md border ${jobColors[rec.job] || jobColors.renta}`}>
                {jobLabel[rec.job] || rec.job}
              </div>
              <div className={`flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md border ${riskColors[rec.risk_level]}`}>
                {riskIcons[rec.risk_level]}
                {rec.risk_level}
              </div>
            </div>

            {/* Perfil suitability */}
            <div className="flex flex-wrap gap-1">
              {(rec.recommended_for ?? []).map((p) => (
                <span key={p} className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${profileColors[p]}`}>
                  {p}
                </span>
              ))}
            </div>

            {/* Rationale */}
            <p className="text-[10px] text-slate-500 leading-relaxed">{rec.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

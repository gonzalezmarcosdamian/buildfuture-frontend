import { fetchGamification, fetchFreedomScore, fetchBudget } from "@/lib/api-server";
import { PortfolioCovers } from "@/components/goals/PortfolioCovers";
import { InvestmentStreak } from "@/components/goals/InvestmentStreak";
import { CurrencyValue } from "@/components/ui/CurrencyValue";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { Target, Lock, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Goals() {
  const [gamification, score, budget] = await Promise.all([
    fetchGamification(),
    fetchFreedomScore(),
    fetchBudget().catch(() => null),
  ]);

  const mep = budget?.fx_rate ?? 1430;
  const covers: any[] = gamification.portfolio_covers;
  const covered = covers.filter((c) => c.status === "covered");
  const pending = covers.filter((c) => c.status === "pending");

  const monthlyReturn = gamification.monthly_return_usd;
  const annualReturnPct = score.monthly_return_usd > 0
    ? (score.monthly_return_usd / score.portfolio_total_usd) * 12
    : 0.10;

  const unlockRoadmap = covers
    .filter((c) => c.status !== "covered")
    .map((c) => {
      const needed = c.amount_usd * (1 - (c.status === "partial" ? c.covered_pct : 0));
      const capitalNeeded = annualReturnPct > 0
        ? Math.round((needed * 12) / annualReturnPct)
        : null;
      return { ...c, monthly_needed: needed, capital_needed: capitalNeeded };
    });

  return (
    <div className="px-4 pt-8 pb-24 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-blue-400" />
          <h1 className="text-xl font-bold text-slate-100">Metas</h1>
        </div>
        <CurrencyToggle />
      </div>

      {/* Resumen */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-300">Categorías desbloqueadas</p>
          <span className="text-xs font-bold text-emerald-400">{covered.length}/{covers.length}</span>
        </div>

        <div className="flex gap-1 mb-3">
          {covers.map((c, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all ${
                c.status === "covered"  ? "bg-emerald-500" :
                c.status === "partial" ? "bg-yellow-500/60" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">
            Genera{" "}
            <span className="text-emerald-400 font-semibold">
              +<CurrencyValue usd={monthlyReturn} mep={mep} />/mes
            </span>
          </span>
          <span className="text-slate-500">
            Gastos: <CurrencyValue usd={score.monthly_expenses_usd} mep={mep} />/mes
          </span>
        </div>
      </div>

      {/* Categorías */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <PortfolioCovers monthly_return_usd={monthlyReturn} items={covers} mep={mep} />
      </div>

      {/* Roadmap */}
      {unlockRoadmap.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" />
            <p className="text-xs font-semibold text-slate-300">Para desbloquear</p>
          </div>

          {unlockRoadmap.map((c, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl p-3 border ${
                i === 0
                  ? "bg-blue-950/20 border-blue-900/40"
                  : "bg-slate-800/40 border-slate-800 opacity-60"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0">
                {c.status === "partial" ? c.icon : <Lock size={14} className="text-slate-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-300">{c.icon} {c.name}</p>
                  <p className="text-[10px] text-slate-500">
                    <CurrencyValue usd={c.amount_usd} mep={mep} />/mes
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Necesitás{" "}
                  <span className="text-slate-300 font-medium">
                    +<CurrencyValue usd={c.monthly_needed} mep={mep} />/mes
                  </span>{" "}
                  más
                  {c.capital_needed && (
                    <span>
                      {" "}≈ invertir{" "}
                      <span className="text-slate-300">
                        <CurrencyValue usd={c.capital_needed} mep={mep} />
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Racha */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <InvestmentStreak streak={gamification.streak} />
      </div>

    </div>
  );
}

import { fetchGamification, fetchFreedomScore, fetchBudget } from "@/lib/api-server";
import { GoalsClient } from "@/components/goals/GoalsClient";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Goals() {
  const [gamification, score, budget] = await Promise.all([
    fetchGamification(),
    fetchFreedomScore(),
    fetchBudget().catch(() => null),
  ]);

  const mep = budget?.fx_rate ?? 1430;
  const covers = gamification.portfolio_covers ?? [];
  const monthlyReturn = gamification.monthly_return_usd;

  // Yield del bucket renta para calcular capital necesario por categoría
  const annualReturnPct = score.renta_monthly_usd > 0 && score.portfolio_total_usd > 0
    ? (score.renta_monthly_usd / score.portfolio_total_usd) * 12
    : 0.08;

  const unlockRoadmap = covers
    .filter((c: { status: string }) => c.status !== "covered")
    .map((c: { status: string; amount_usd: number; covered_pct: number; name: string; icon: string }) => {
      const needed = c.amount_usd * (1 - (c.status === "partial" ? c.covered_pct : 0));
      const capitalNeeded = annualReturnPct > 0
        ? Math.round((needed * 12) / annualReturnPct)
        : null;
      return { ...c, monthly_needed: needed, capital_needed: capitalNeeded };
    });

  const budgetSavingsUSD = budget && budget.fx_rate > 0
    ? budget.savings_monthly_ars / budget.fx_rate
    : null;

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-blue-400" />
          <h1 className="text-xl font-bold text-bf-text">Metas</h1>
        </div>
        <CurrencyToggle />
      </div>

      <GoalsClient
        monthlyReturn={monthlyReturn}
        monthlyExpenses={score.monthly_expenses_usd}
        mep={mep}
        covers={covers}
        unlockRoadmap={unlockRoadmap}
        budgetSavingsUSD={budgetSavingsUSD}
        budget={budget}
      />
    </div>
  );
}

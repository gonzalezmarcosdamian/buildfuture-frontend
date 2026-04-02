import Link from "next/link";
import { fetchFreedomScore, fetchBudget, fetchGamification, fetchPortfolio, fetchProfile, fetchIntegrations } from "@/lib/api-server";
import { formatUSD, formatARS } from "@/lib/formatters";
import { RecommendationList } from "@/components/recommendations/RecommendationList";
import { DashboardHero } from "@/components/portfolio/DashboardHero";
import { FTUFlow } from "@/components/ftu/FTUFlow";
import { InvestmentStreak } from "@/components/goals/InvestmentStreak";
import { ProjectionCard } from "@/components/goals/ProjectionCard";
import { SyncButton } from "@/components/portfolio/SyncButton";

export const dynamic = "force-dynamic";

function BudgetFlow({
  income,
  expenses,
  savings,
  savingsUSD,
}: {
  income: number;
  expenses: number;
  savings: number;
  savingsUSD: number;
}) {
  const expPct = income > 0 ? (expenses / income) * 100 : 0;
  const savPct = income > 0 ? (savings / income) * 100 : 0;
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Presupuesto del mes</p>
      <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
        <div className="bg-red-500/70 rounded-l-full" style={{ width: `${expPct}%` }} />
        <div className="bg-emerald-500 rounded-r-full" style={{ width: `${savPct}%` }} />
        <div className="flex-1 bg-slate-700" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Ingreso</p>
          <p className="text-xs font-semibold text-slate-200">{formatARS(income)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Gastos</p>
          <p className="text-xs font-semibold text-red-400">{formatARS(expenses)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">A invertir</p>
          <p className="text-xs font-semibold text-emerald-400">{formatARS(savings)}</p>
          <p className="text-[9px] text-emerald-600">≈ {formatUSD(savingsUSD)}</p>
        </div>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const [score, budget, gamification, portfolio, profile, integrations] = await Promise.all([
    fetchFreedomScore().catch(() => ({ portfolio_total_usd: 0, monthly_expenses_usd: 0 })),
    fetchBudget().catch(() => null),
    fetchGamification().catch(() => ({ monthly_return_usd: 0, portfolio_covers: 0 })),
    fetchPortfolio().catch(() => []),
    fetchProfile().catch(() => ({ risk_profile: null, available: false })),
    fetchIntegrations().catch(() => []),
  ]);
  const connectedALYCs: string[] = Array.isArray(integrations)
    ? integrations
        .filter((i: { provider_type: string; is_connected: boolean }) => i.provider_type === "ALYC" && i.is_connected)
        .map((i: { provider: string }) => i.provider)
    : [];

  const hasBudget = !!(budget && (budget.income_monthly_ars ?? 0) > 0);
  const hasPortfolio = !!(score.portfolio_total_usd > 0) ||
    (Array.isArray(portfolio?.positions) && portfolio.positions.length > 0);
  const hasRiskProfile = !!(profile?.risk_profile);
  // Solo bloquear por risk profile si el endpoint ya existe en el backend
  const blockOnRisk = profile.available && !hasRiskProfile;

  if (!hasBudget || !hasPortfolio || blockOnRisk) {
    return (
      <FTUFlow
        hasBudget={hasBudget}
        hasPortfolio={hasPortfolio}
        hasRiskProfile={hasRiskProfile}
      />
    );
  }

  const mep = budget?.fx_rate ?? 1430;
  const incomeARS = budget?.income_monthly_ars ?? 0;
  const expensesARS = budget?.total_monthly_ars ?? 0;
  const savingsARS = budget?.savings_monthly_ars ?? 0;
  const savingsUSD = budget?.savings_monthly_usd ?? 0;

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">BuildFuture</h1>
          <p className="text-xs text-slate-500">Tu camino a la libertad financiera</p>
        </div>
        <div className="flex items-center gap-2">
          {connectedALYCs.length > 0 && <SyncButton connectedProviders={connectedALYCs} />}
          <Link href="/settings" className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white hover:bg-blue-500 transition-colors">
            M
          </Link>
        </div>
      </div>

      {/* 1 — Principal */}
      <DashboardHero
        monthlyReturn={gamification.monthly_return_usd}
        monthlyExpenses={score.monthly_expenses_usd}
        covers={gamification.portfolio_covers}
        portfolioTotal={score.portfolio_total_usd}
        portfolioTotalArs={portfolio?.summary?.total_ars ?? null}
        mep={mep}
        capitalTotalUsd={score.capital_total_usd ?? null}
      />

      {/* 2 — Presupuesto */}
      {incomeARS > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <BudgetFlow
            income={incomeARS}
            expenses={expensesARS}
            savings={savingsARS}
            savingsUSD={savingsUSD}
          />
        </div>
      )}

      {/* 3 — Racha */}
      {gamification.streak && (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <InvestmentStreak
            streak={gamification.streak}
            currentMonthInvested={gamification.current_month_invested ?? false}
          />
        </div>
      )}

      {/* 4 — Proyección interés compuesto */}
      <ProjectionCard />

      {/* 5 — Recomendaciones */}
      <RecommendationList
        capitalArs={savingsARS > 0 ? Math.round(savingsARS) : 500000}
        userProfile={profile?.risk_profile ?? null}
      />

    </div>
  );
}

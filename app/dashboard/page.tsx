import Link from "next/link";
import { fetchFreedomScore, fetchBudget, fetchGamification, fetchPortfolio, fetchProfile, fetchCapitalGoals } from "@/lib/api-server";
import { RecommendationList } from "@/components/recommendations/RecommendationList";
import { DashboardHero } from "@/components/portfolio/DashboardHero";
import { FTUFlow } from "@/components/ftu/FTUFlow";
import { ValuePropsScreen } from "@/components/ftu/ValuePropsScreen";
import { ProjectionCard } from "@/components/goals/ProjectionCard";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [score, budget, gamification, portfolio, profile, capitalGoals] = await Promise.all([
    fetchFreedomScore().catch(() => ({ portfolio_total_usd: 0, monthly_expenses_usd: 0 })),
    fetchBudget().catch(() => null),
    fetchGamification().catch(() => ({ monthly_return_usd: 0, portfolio_covers: 0 })),
    fetchPortfolio().catch(() => []),
    fetchProfile().catch(() => ({ risk_profile: null, available: false })),
    fetchCapitalGoals().catch(() => []),
  ]);

  const goalsTargetTotal = capitalGoals.reduce((sum: number, g: { target_usd: number }) => sum + g.target_usd, 0);

  const hasBudget = !!(budget && (budget.income_monthly_ars ?? 0) > 0);
  const hasPortfolio = !!(score.portfolio_total_usd > 0) ||
    (Array.isArray(portfolio?.positions) && portfolio.positions.length > 0);
  const hasRiskProfile = !!(profile?.risk_profile);
  const blockOnRisk = profile.available && !hasRiskProfile;

  // Usuario brand new: no tiene nada → value props antes del setup
  if (!hasPortfolio && !hasRiskProfile) {
    return <ValuePropsScreen />;
  }

  // Tiene portfolio pero falta perfil de riesgo → FTU abreviado
  // Budget es opcional: no bloquea el acceso al dashboard
  if (!hasPortfolio || blockOnRisk) {
    return (
      <FTUFlow
        hasBudget={hasBudget}
        hasPortfolio={hasPortfolio}
        hasRiskProfile={hasRiskProfile}
      />
    );
  }

  const mep = budget?.fx_rate ?? 1430;
  const savingsARS = budget?.savings_monthly_ars ?? 0;

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">BuildFuture</h1>
          <p className="text-xs text-slate-500">Tu camino a la libertad financiera</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white hover:bg-blue-500 transition-colors">
            M
          </Link>
        </div>
      </div>

      {/* 1 — Hero: renta + capital + metas + racha */}
      <DashboardHero
        monthlyReturn={gamification.monthly_return_usd}
        monthlyExpenses={score.monthly_expenses_usd}
        covers={gamification.portfolio_covers}
        portfolioTotal={score.portfolio_total_usd}
        portfolioTotalArs={portfolio?.summary?.total_ars ?? null}
        capitalNumeratorUsd={portfolio?.summary?.capital_numerator_usd ?? null}
        mep={mep}
        goalsTargetTotal={goalsTargetTotal > 0 ? goalsTargetTotal : null}
        goalsCount={capitalGoals.length}
        streak={gamification.streak ?? null}
      />

      {/* 2 — Recomendaciones */}
      <RecommendationList
        capitalArs={savingsARS > 0 ? Math.round(savingsARS) : 500000}
        userProfile={profile?.risk_profile ?? null}
      />

      {/* 3 — Proyección DCA / interés compuesto (colapsada) */}
      <ProjectionCard />

    </div>
  );
}

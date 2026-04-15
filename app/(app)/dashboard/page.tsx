import { fetchBudget, fetchGamification, fetchPortfolio, fetchProfile, fetchCapitalGoals } from "@/lib/api-server";
import { RecommendationList } from "@/components/recommendations/RecommendationList";
import { DashboardHero } from "@/components/portfolio/DashboardHero";
import { FTUFlow } from "@/components/ftu/FTUFlow";
import { ValuePropsScreen } from "@/components/ftu/ValuePropsScreen";
import { ProjectionCard } from "@/components/goals/ProjectionCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [budget, gamification, portfolio, profile, capitalGoals] = await Promise.all([
    fetchBudget().catch(() => null),
    fetchGamification().catch(() => ({ portfolio_covers: [], streak: null })),
    fetchPortfolio().catch(() => ({ positions: [], summary: null })),
    fetchProfile().catch(() => ({ risk_profile: null, available: false })),
    fetchCapitalGoals().catch(() => []),
  ]);

  const goalsTargetTotal = capitalGoals.reduce((sum: number, g: { target_usd: number }) => sum + g.target_usd, 0);

  const hasBudget = !!(budget && (budget.income_monthly_ars ?? 0) > 0);
  const hasPortfolio = !!((portfolio?.summary?.total_usd ?? 0) > 0) ||
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

  // MEP: fuente única — summary del backend (calculado junto con total_ars).
  // Fallback a budget.fx_rate si el backend aún no expone summary.mep.
  const mep = portfolio?.summary?.mep ?? budget?.fx_rate ?? 1430;
  const savingsARS = budget?.savings_monthly_ars ?? 0;

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-bf-text">BuildFuture</h1>
          <p className="text-xs text-bf-text-3">Tu camino a la libertad financiera</p>
        </div>
        <div className="flex items-center gap-2">
          <UserAvatar />
        </div>
      </div>

      {/* 1 — Hero: renta + capital + metas + racha */}
      {/* Hero: fuente única portfolio.summary — mismo endpoint que PortfolioHeader.
          monthly_return_usd, capital_total_usd, mep y total_ars vienen todos
          del mismo GET /portfolio/ para garantizar consistencia. */}
      <DashboardHero
        monthlyReturn={portfolio?.summary?.monthly_return_usd ?? 0}
        monthlyExpenses={portfolio?.summary?.monthly_expenses_usd ?? budget?.total_monthly_usd ?? 2000}
        covers={gamification.portfolio_covers}
        portfolioTotal={portfolio?.summary?.total_usd ?? 0}
        portfolioTotalArs={portfolio?.summary?.total_ars ?? null}
        capitalNumeratorUsd={portfolio?.summary?.capital_total_usd ?? null}
        mep={mep}
        goalsTargetTotal={goalsTargetTotal > 0 ? goalsTargetTotal : null}
        goalsCount={capitalGoals.length}
        streak={gamification.streak ?? null}
      />

      {/* 2 — Sugerencias */}
      <RecommendationList
        capitalArs={savingsARS > 0 ? Math.round(savingsARS) : 500000}
        userProfile={profile?.risk_profile ?? null}
      />

      {/* 3 — Proyección DCA / interés compuesto (colapsada) */}
      <ProjectionCard mep={mep} />

    </div>
  );
}

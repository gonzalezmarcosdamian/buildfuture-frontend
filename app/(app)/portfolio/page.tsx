import { fetchPortfolio, fetchPortfolioHistory, fetchBudget, fetchIntegrations } from "@/lib/api-server";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";

export const dynamic = "force-dynamic";

export default async function Portfolio() {
  const [data, history, budget, integrations] = await Promise.all([
    fetchPortfolio(),
    fetchPortfolioHistory("daily"),
    fetchBudget().catch(() => null),
    fetchIntegrations().catch(() => []),
  ]);
  const connectedALYCs: string[] = Array.isArray(integrations)
    ? integrations
        .filter((i: { provider_type: string; is_connected: boolean; auto_sync_enabled: boolean }) =>
          i.provider_type === "ALYC" && i.is_connected && i.auto_sync_enabled)
        .map((i: { provider: string }) => i.provider)
    : [];

  const { positions, summary } = data;
  const mep = budget?.fx_rate ?? 1430;

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">
      <h1 className="text-xl font-bold text-bf-text">Portafolio</h1>

      <PortfolioHeader
        totalUsd={summary.total_usd}
        totalArs={summary.total_ars ?? null}
        monthlyReturnUsd={summary.monthly_return_usd}
        annualReturnPct={summary.annual_return_pct}
        freedomPct={summary.freedom_pct}
        mep={mep}
        positions={positions}
        capitalTotalUsd={summary.capital_total_usd ?? null}
        cashTotalUsd={summary.cash_total_usd ?? null}
        expectedDevaluationPct={summary.expected_devaluation_pct ?? 0.20}
      />

      <PortfolioClient
        positions={positions}
        totalUsd={summary.total_usd}
        mep={mep}
        history={history}
        connectedProviders={connectedALYCs}
        expectedDevaluationPct={summary.expected_devaluation_pct ?? 0.20}
      />
    </div>
  );
}

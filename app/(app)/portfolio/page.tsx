import { fetchPortfolio, fetchPortfolioHistory } from "@/lib/api-server";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";

export const dynamic = "force-dynamic";

export default async function Portfolio() {
  const [data, history] = await Promise.all([
    fetchPortfolio(),
    fetchPortfolioHistory("daily"),
  ]);

  const { positions, summary } = data;
  const mep = summary?.mep ?? 1430;

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
        lastSyncedDate={summary.last_synced_date ?? null}
      />

      <PortfolioClient
        positions={positions}
        totalUsd={summary.total_usd}
        mep={mep}
        history={history}
        connectedProviders={[]}
        expectedDevaluationPct={summary.expected_devaluation_pct ?? 0.20}
      />
    </div>
  );
}

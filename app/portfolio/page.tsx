import { fetchPortfolio, fetchPortfolioHistory, fetchBudget } from "@/lib/api-server";
import { PerformanceChart } from "@/components/portfolio/PerformanceChart";
import { PortfolioTabs } from "@/components/portfolio/PortfolioTabs";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";

export const dynamic = "force-dynamic";

export default async function Portfolio() {
  const [data, history, budget] = await Promise.all([
    fetchPortfolio(),
    fetchPortfolioHistory("daily"),
    fetchBudget().catch(() => null),
  ]);

  const { positions, summary } = data;
  const mep = budget?.fx_rate ?? 1430;

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Portafolio</h1>

      <PortfolioHeader
        totalUsd={summary.total_usd}
        monthlyReturnUsd={summary.monthly_return_usd}
        annualReturnPct={summary.annual_return_pct}
        freedomPct={summary.freedom_pct}
        mep={mep}
        positions={positions}
      />

      <PerformanceChart initialData={history} mep={mep} />

      <PortfolioTabs positions={positions} totalUsd={summary.total_usd} mep={mep} />

      <div className="pb-4 text-center text-xs text-slate-700">
        Snapshot diario · cierre 17:30 ART
      </div>
    </div>
  );
}

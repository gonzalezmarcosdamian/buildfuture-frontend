import { fetchPortfolio, fetchPortfolioHistory, fetchBudget } from "@/lib/api-server";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";
import Link from "next/link";
import { Plus } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Portafolio</h1>
        <Link
          href="/portfolio/add-manual"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-colors"
        >
          <Plus size={12} />
          Agregar manual
        </Link>
      </div>

      <PortfolioHeader
        totalUsd={summary.total_usd}
        monthlyReturnUsd={summary.monthly_return_usd}
        annualReturnPct={summary.annual_return_pct}
        freedomPct={summary.freedom_pct}
        mep={mep}
        positions={positions}
      />

      <PortfolioClient
        positions={positions}
        totalUsd={summary.total_usd}
        mep={mep}
        history={history}
      />
    </div>
  );
}

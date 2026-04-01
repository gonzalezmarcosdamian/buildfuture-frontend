import { fetchPortfolio, fetchPortfolioHistory, fetchBudget, fetchIntegrations } from "@/lib/api-server";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";
import { SyncButton } from "@/components/portfolio/SyncButton";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Portfolio() {
  const [data, history, budget, integrations] = await Promise.all([
    fetchPortfolio(),
    fetchPortfolioHistory("daily"),
    fetchBudget().catch(() => null),
    fetchIntegrations().catch(() => []),
  ]);
  const hasIOL = Array.isArray(integrations) && integrations.some((i: any) => i.provider === "IOL" && i.is_connected);

  const { positions, summary } = data;
  const mep = budget?.fx_rate ?? 1430;

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Portafolio</h1>
        <div className="flex items-center gap-2">
          {hasIOL && <SyncButton />}
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800/50 border border-slate-800 rounded-xl text-slate-600 cursor-not-allowed opacity-50">
            <Plus size={12} />
            Agregar manual
          </span>
        </div>
      </div>

      <PortfolioHeader
        totalUsd={summary.total_usd}
        totalArs={summary.total_ars ?? null}
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

import { fetchPortfolio } from "@/lib/api";
import { formatUSD, formatPct } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

const assetColors: Record<string, string> = {
  CEDEAR: "bg-blue-900 text-blue-300",
  BOND: "bg-purple-900 text-purple-300",
  LETRA: "bg-yellow-900 text-yellow-300",
  CRYPTO: "bg-orange-900 text-orange-300",
  FCI: "bg-green-900 text-green-300",
  CASH: "bg-slate-700 text-slate-300",
};

const sourceColors: Record<string, string> = {
  IOL: "bg-slate-800 text-slate-400",
  NEXO: "bg-blue-950 text-blue-400",
  BITSO: "bg-orange-950 text-orange-400",
  MANUAL: "bg-slate-800 text-slate-500",
};

export default async function Portfolio() {
  const data = await fetchPortfolio();
  const { positions, summary } = data;

  const byType = positions.reduce((acc: Record<string, number>, p: any) => {
    acc[p.asset_type] = (acc[p.asset_type] || 0) + p.current_value_usd;
    return acc;
  }, {});

  return (
    <div className="px-4 pt-8 space-y-5">
      <h1 className="text-xl font-bold text-slate-100">Portafolio</h1>

      {/* Resumen */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-3xl font-extrabold text-slate-100">{formatUSD(summary.total_usd)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Renta mensual</p>
            <p className="text-lg font-semibold text-emerald-400">{formatUSD(summary.monthly_return_usd)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(byType).map(([type, value]) => (
            <div key={type} className="text-xs bg-slate-800 rounded-lg px-2 py-1">
              <span className="text-slate-400">{type} </span>
              <span className="text-slate-200 font-medium">{formatUSD(value as number)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de posiciones */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Posiciones</p>
        {positions.map((p: any) => {
          const positive = p.performance_pct >= 0;
          return (
            <div key={p.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-100 text-sm">{p.ticker}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${assetColors[p.asset_type] || "bg-slate-700 text-slate-300"}`}>
                        {p.asset_type}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${sourceColors[p.source] || ""}`}>
                        {p.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-100 text-sm">{formatUSD(p.current_value_usd)}</p>
                  <div className={`flex items-center justify-end gap-0.5 text-xs mt-0.5 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                    {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    <span>{formatPct(Math.abs(p.performance_pct))}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{p.quantity.toLocaleString("es-AR")} unidades</span>
                <span>Yield anual: <span className="text-slate-400">{formatPct(p.annual_yield_pct)}</span></span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pb-4 text-center text-xs text-slate-600">
        Datos mock — conectá tu cuenta IOL para ver datos reales
      </div>
    </div>
  );
}

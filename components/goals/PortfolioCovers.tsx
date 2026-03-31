"use client";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import { formatUSD, formatARS } from "@/lib/formatters";

interface CoverItem {
  name: string;
  icon: string;
  amount_usd: number;
  status: "covered" | "partial" | "pending";
  covered_pct: number;
}

export function PortfolioCovers({
  monthly_return_usd,
  items,
  mep,
}: {
  monthly_return_usd: number;
  items: CoverItem[];
  mep: number;
}) {
  const { currency } = useCurrency();
  const fmt = (usd: number) =>
    currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);

  const covered = items.filter((i) => i.status === "covered").length;
  const total = items.length;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">¿Qué paga tu portafolio?</p>
          <p className="text-[11px] text-slate-400">
            Rendimiento mensual:{" "}
            <span className="text-emerald-400 font-semibold">+{fmt(monthly_return_usd)}/mes</span>
          </p>
        </div>
        <span className="text-xs text-slate-500">{covered}/{total} categorías</span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${
              item.status === "covered"
                ? "bg-emerald-950/20 border-emerald-900/50"
                : item.status === "partial"
                ? "bg-yellow-950/20 border-yellow-900/50"
                : "bg-slate-900 border-slate-800 opacity-50"
            }`}
          >
            <span className="text-base shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-200 truncate">{item.name}</p>
                <p className="text-[10px] text-slate-500 shrink-0">{fmt(item.amount_usd)}/mes</p>
              </div>
              {item.status === "partial" && (
                <div className="mt-1.5">
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${item.covered_pct * 100}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-yellow-500 mt-0.5">
                    {(item.covered_pct * 100).toFixed(0)}% cubierto
                  </p>
                </div>
              )}
            </div>
            <div className="shrink-0">
              {item.status === "covered" && <CheckCircle2 size={16} className="text-emerald-400" />}
              {item.status === "partial" && <span className="text-yellow-400 text-xs font-bold">~</span>}
              {item.status === "pending" && <CircleDashed size={16} className="text-slate-600" />}
            </div>
          </div>
        ))}
      </div>

      {covered === total && total > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-emerald-400 font-medium">
            Tu portafolio cubre todos tus gastos del mes
          </p>
        </div>
      )}
    </div>
  );
}

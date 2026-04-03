import { Target, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatUSD, formatARS } from "@/lib/formatters";

interface NextGoalData {
  all_unlocked?: boolean;
  next_category?: {
    name: string;
    icon: string;
    target_monthly_usd: number;
    current_monthly_usd: number;
    missing_monthly_usd: number;
  };
  capital_needed_usd?: number;
  capital_needed_ars?: number;
  savings_monthly_usd?: number;
  savings_monthly_ars?: number;
  months_to_unlock?: number | null;
  recommended_ticker?: string;
  recommended_name?: string;
  recommended_yield_pct?: number;
  mep?: number;
}


export function NextGoalCard({ data }: { data: NextGoalData }) {
  if (!data || data.all_unlocked) {
    return (
      <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <div>
          <p className="text-sm font-semibold text-emerald-400">¡Todo desbloqueado!</p>
          <p className="text-[10px] text-bf-text-3">Tu portafolio cubre todos los gastos</p>
        </div>
      </div>
    );
  }

  const cat = data.next_category!;
  const months = data.months_to_unlock;

  return (
    <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border space-y-3">
      <div className="flex items-center gap-2">
        <Target size={13} className="text-blue-400" />
        <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">Próxima meta</p>
      </div>

      {/* Category to unlock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cat.icon}</span>
          <div>
            <p className="text-sm font-semibold text-bf-text">{cat.name}</p>
            <p className="text-[10px] text-bf-text-3">
              {formatUSD(cat.current_monthly_usd)}/{formatUSD(cat.target_monthly_usd)} por mes
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-blue-400">
            {months !== null && months !== undefined ? `${months} ${months === 1 ? "mes" : "meses"}` : "—"}
          </p>
          <p className="text-[10px] text-bf-text-3">desde hoy</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 bg-bf-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{
              width: `${Math.min((cat.current_monthly_usd / cat.target_monthly_usd) * 100, 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-bf-text-4">
          <span>Actual {formatUSD(cat.current_monthly_usd)}/mes</span>
          <span>Meta {formatUSD(cat.target_monthly_usd)}/mes</span>
        </div>
      </div>

      {/* Capital needed */}
      <div className="bg-bf-surface-2/60 rounded-xl px-3 py-2.5 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-bf-text-3">Capital necesario</span>
          <span className="text-bf-text font-medium">
            {formatUSD(data.capital_needed_usd!)}
            <span className="text-bf-text-3 ml-1 text-[10px]">
              ({formatARS(data.capital_needed_ars!)} ARS)
            </span>
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-bf-text-3">Tu ahorro mensual</span>
          <span className="text-emerald-400 font-medium">
            {formatUSD(data.savings_monthly_usd!)}
          </span>
        </div>
        {data.recommended_ticker && (
          <div className="flex justify-between text-[10px] pt-1 border-t border-bf-border-2 mt-1">
            <span className="text-bf-text-3">Invertir en</span>
            <span className="text-yellow-400 font-medium">
              {data.recommended_ticker} · {((data.recommended_yield_pct ?? 0) * 100).toFixed(2)}% TNA
            </span>
          </div>
        )}
      </div>

      <Link
        href="/goals"
        className="flex items-center justify-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
      >
        Ver roadmap completo <ChevronRight size={12} />
      </Link>
    </div>
  );
}

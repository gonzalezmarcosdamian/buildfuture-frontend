"use client";
import { freedomColor, formatUSD, formatPct } from "@/lib/formatters";

interface FreedomBarProps {
  freedomPct: number;
  monthlyReturnUSD: number;
  monthlyExpensesUSD: number;
  portfolioTotalUSD: number;
}

export function FreedomBar({
  freedomPct,
  monthlyReturnUSD,
  monthlyExpensesUSD,
  portfolioTotalUSD,
}: FreedomBarProps) {
  const pct = Math.min(freedomPct, 1);
  const color = freedomColor(freedomPct);
  const displayPct = (freedomPct * 100).toFixed(2);

  const milestones = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-bf-text-3 uppercase tracking-widest mb-1">Libertad Financiera</p>
          <p className="text-5xl font-extrabold tracking-tight" style={{ color }}>
            {displayPct}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-bf-text-3">Portafolio</p>
          <p className="text-lg font-semibold text-bf-text-2">{formatUSD(portfolioTotalUSD)}</p>
        </div>
      </div>

      {/* Barra principal */}
      <div className="relative h-4 bg-bf-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(pct * 100, 1)}%`, backgroundColor: color }}
        />
        {/* Markers de milestones */}
        {milestones.map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 w-px bg-bf-surface opacity-60"
            style={{ left: `${m * 100}%` }}
          />
        ))}
      </div>

      {/* Labels de milestones */}
      <div className="relative h-4">
        {milestones.map((m) => (
          <span
            key={m}
            className="absolute text-[10px] text-bf-text-3 -translate-x-1/2"
            style={{ left: `${m * 100}%` }}
          >
            {m * 100}%
          </span>
        ))}
      </div>

      {/* Detalle */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-bf-surface-2 rounded-xl p-3">
          <p className="text-xs text-bf-text-3 mb-1">Tu portafolio genera</p>
          <p className="text-base font-semibold text-emerald-400">
            {formatUSD(monthlyReturnUSD)}<span className="text-xs text-bf-text-3 font-normal">/mes</span>
          </p>
        </div>
        <div className="bg-bf-surface-2 rounded-xl p-3">
          <p className="text-xs text-bf-text-3 mb-1">Tus gastos son</p>
          <p className="text-base font-semibold text-bf-text-2">
            {formatUSD(monthlyExpensesUSD)}<span className="text-xs text-bf-text-3 font-normal">/mes</span>
          </p>
        </div>
      </div>
    </div>
  );
}

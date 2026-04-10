"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { freedomColor, formatUSD } from "@/lib/formatters";

const SEEN_KEY = "bf_freedom_bar_explained";

function hasSeenTooltip() {
  try { return !!localStorage.getItem(SEEN_KEY); } catch { return true; }
}

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
  const [showTooltip, setShowTooltip] = useState(() => !hasSeenTooltip());

  function dismissTooltip() {
    setShowTooltip(false);
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* noop */ }
  }

  const milestones = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="space-y-4">
      {/* Tooltip educativo — primera vez */}
      {showTooltip && (
        <div className="bg-blue-950/50 border border-blue-800/60 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-base leading-none shrink-0 mt-0.5">💡</span>
          <div className="flex-1 space-y-1">
            <p className="text-xs font-semibold text-blue-200">¿Qué es esta barra?</p>
            <p className="text-[11px] text-blue-300/80 leading-snug">
              Muestra cuánto de tus gastos mensuales ya cubrís con las rentas de tus inversiones.
              Cuando llegue al <span className="font-semibold text-blue-200">100%</span>, no necesitás más el sueldo para vivir.
            </p>
            <p className="text-[11px] text-blue-400/70 leading-snug">
              Para subirla: invertí más cada mes o reducí tus gastos fijos — ambas palancas la mueven.
            </p>
          </div>
          <button onClick={dismissTooltip} className="text-blue-500 hover:text-blue-300 shrink-0 mt-0.5">
            <X size={14} />
          </button>
        </div>
      )}

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

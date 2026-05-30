import Link from "next/link";
import { Flame, ChevronRight } from "lucide-react";

interface StreakRisk {
  at_risk: boolean;
  days_left: number;
  streak_to_keep: number;
}

/**
 * Banner de alerta cuando la racha mensual está por romperse: hay una racha
 * viva, todavía no se registró inversión este mes y quedan pocos días.
 * No renderiza nada si la racha no está en riesgo.
 */
export function StreakRiskBanner({ risk }: { risk: StreakRisk | null | undefined }) {
  if (!risk?.at_risk) return null;

  const { days_left: daysLeft, streak_to_keep: streakToKeep } = risk;
  const daysLabel = daysLeft === 1 ? "1 día" : `${daysLeft} días`;
  const streakLabel = streakToKeep === 1 ? "1 mes" : `${streakToKeep} meses`;

  return (
    <Link
      href="/portfolio"
      className="flex items-center gap-3 bg-amber-950/40 border border-amber-800/60 rounded-2xl px-4 py-3 hover:bg-amber-950/60 transition-colors"
    >
      <div className="shrink-0 w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
        <Flame size={16} className="text-amber-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-200">
          Tu racha de {streakLabel} está en riesgo
        </p>
        <p className="text-xs text-amber-300/70 mt-0.5">
          Te {daysLeft === 1 ? "queda" : "quedan"} {daysLabel} para invertir este mes y no perderla.
        </p>
      </div>
      <ChevronRight size={16} className="text-amber-400/60 shrink-0" />
    </Link>
  );
}

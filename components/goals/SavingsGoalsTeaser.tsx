import { Clock, TrendingUp } from "lucide-react";

const GOALS = [
  { icon: "🏠", name: "Casa propia", amount: "$80,000 USD" },
  { icon: "🚗", name: "Auto", amount: "$15,000 USD" },
  { icon: "✈️", name: "Viaje soñado", amount: "$3,000 USD" },
  { icon: "🛡️", name: "Fondo emergencia", amount: "6 meses gastos" },
];

export function SavingsGoalsTeaser() {
  return (
    <div className="rounded-2xl p-4 border border-dashed border-slate-700/60 bg-slate-900/50 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-violet-400">Objetivos de capital</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Metas que requieren capital acumulado, no renta mensual
          </p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-700/80 border border-slate-600 px-2 py-0.5 rounded-full shrink-0">
          <Clock size={10} />
          Próximamente
        </span>
      </div>

      {/* Grid de ejemplos */}
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map((g) => (
          <div
            key={g.name}
            className="bg-slate-800/50 border border-dashed border-slate-700 rounded-xl p-3 space-y-2 opacity-70"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{g.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-300 truncate">{g.name}</p>
                <p className="text-[10px] text-slate-500">{g.amount}</p>
              </div>
            </div>
            {/* Barra fantasma */}
            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-0 bg-violet-500 rounded-full" />
            </div>
            <p className="text-[9px] text-slate-600">0% acumulado</p>
          </div>
        ))}
      </div>

      {/* Propuesta de valor */}
      <div className="bg-violet-950/20 border border-violet-900/30 rounded-xl px-3 py-2.5 flex items-start gap-2">
        <TrendingUp size={14} className="text-violet-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400">
          Conectá tus metas con tu portafolio:{" "}
          <span className="text-slate-300">¿cuánto capital necesitás acumular para llegar en N años?</span>
        </p>
      </div>

    </div>
  );
}

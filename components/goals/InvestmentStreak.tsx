"use client";

interface StreakData {
  current: number;
  longest: number;
  calendar: { month: string; invested: boolean }[];
}

interface Props {
  streak: StreakData;
  currentMonthInvested?: boolean;
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTH_NAMES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function badge(months: number): { label: string; emoji: string } | null {
  if (months >= 12) return { label: "1 año", emoji: "🌳" };
  if (months >= 6)  return { label: "6 meses", emoji: "🌿" };
  if (months >= 3)  return { label: "3 meses", emoji: "🌱" };
  return null;
}

export function InvestmentStreak({ streak, currentMonthInvested = false }: Props) {
  const currentBadge = badge(streak.current);
  const longestBadge = badge(streak.longest);
  const now          = new Date();
  const monthName    = MONTH_NAMES[now.getMonth()];

  return (
    <div className="space-y-3">
      <p className="text-xs text-bf-text-3 uppercase tracking-wider">Racha de inversión</p>

      {/* Estado del mes actual — el feedback loop principal */}
      <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between ${
        currentMonthInvested
          ? "bg-emerald-950/30 border-emerald-800/60"
          : "bg-bf-surface border-bf-border-2"
      }`}>
        <div>
          <p className="text-xs font-semibold text-bf-text-2">{monthName}</p>
          {currentMonthInvested ? (
            <p className="text-[11px] text-emerald-400 mt-0.5">Invertiste este mes ✓</p>
          ) : (
            <p className="text-[11px] text-bf-text-3 mt-0.5">Todavía no invertiste este mes</p>
          )}
        </div>
        <div className="text-2xl leading-none">
          {currentMonthInvested ? "✅" : "⏳"}
        </div>
      </div>

      {/* Stats racha */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bf-surface border border-bf-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{streak.current}</p>
          <p className="text-[10px] text-bf-text-3 mt-0.5">meses seguidos</p>
          {currentBadge && (
            <p className="text-xs mt-1">{currentBadge.emoji} {currentBadge.label}</p>
          )}
        </div>
        <div className="bg-bf-surface border border-bf-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-bf-text-2">{streak.longest}</p>
          <p className="text-[10px] text-bf-text-3 mt-0.5">mejor racha</p>
          {longestBadge && (
            <p className="text-xs mt-1">{longestBadge.emoji} {longestBadge.label}</p>
          )}
        </div>
      </div>

      {/* Calendario estilo GitHub */}
      <div className="bg-bf-surface border border-bf-border rounded-xl p-3">
        <div className="grid grid-cols-12 gap-1">
          {streak.calendar.map((entry, i) => {
            const d = new Date(entry.month + "T00:00:00");
            const monthLabel = MONTH_LABELS[d.getMonth()];
            const isCurrentMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-full aspect-square rounded-sm transition-colors ${
                    entry.invested
                      ? "bg-emerald-500"
                      : isCurrentMonth
                      ? "bg-slate-600 ring-1 ring-slate-400"
                      : "bg-bf-surface-2"
                  }`}
                  title={`${monthLabel} ${d.getFullYear()}`}
                />
                <span className={`text-[8px] ${isCurrentMonth ? "text-bf-text-3" : "text-bf-text-4"}`}>
                  {monthLabel[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Próximos badges */}
      <div className="flex gap-2">
        {[
          { months: 3, emoji: "🌱", label: "3 meses" },
          { months: 6, emoji: "🌿", label: "6 meses" },
          { months: 12, emoji: "🌳", label: "1 año" },
        ].map((b) => {
          const reached    = streak.longest >= b.months;
          const inProgress = !reached && streak.current > 0 && streak.current < b.months;
          return (
            <div
              key={b.months}
              className={`flex-1 rounded-xl p-2 text-center border transition-all ${
                reached
                  ? "bg-emerald-950/30 border-emerald-800"
                  : inProgress
                  ? "bg-blue-950/20 border-blue-900/50"
                  : "bg-bf-surface border-bf-border opacity-40"
              }`}
            >
              <p className="text-base">{b.emoji}</p>
              <p className={`text-[9px] mt-0.5 ${reached ? "text-emerald-400" : "text-bf-text-3"}`}>
                {b.label}
              </p>
              {inProgress && (
                <p className="text-[8px] text-blue-400 mt-0.5">{b.months - streak.current}m más</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { Flame } from "lucide-react";

interface StreakData {
  current: number;
  longest: number;
  calendar: { month: string; invested: boolean }[];
}

const MONTH_LABELS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export function StreakCard({ streak }: { streak: StreakData }) {
  const now = new Date();
  const currentMonthInvested = streak.calendar.some((e) => {
    const d = new Date(e.month + "T00:00:00");
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.invested;
  });

  return (
    <div className="bg-bf-surface border border-bf-border rounded-2xl px-4 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame size={14} className="text-orange-400" />
          <span className="text-xs font-semibold text-bf-text-2">Racha de inversión</span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          currentMonthInvested
            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50"
            : "bg-bf-surface-2 text-bf-text-3 border border-bf-border"
        }`}>
          {currentMonthInvested ? "✓" : "⏳"}{" "}
          {streak.current} {streak.current === 1 ? "mes" : "meses"}
        </div>
      </div>

      {/* Calendario 12 meses */}
      <div className="grid grid-cols-12 gap-1">
        {streak.calendar.map((entry, i) => {
          const d = new Date(entry.month + "T00:00:00");
          const isCurrentMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-full aspect-square rounded-sm ${
                  entry.invested
                    ? "bg-emerald-500"
                    : isCurrentMonth
                    ? "bg-slate-600 ring-1 ring-slate-400"
                    : "bg-bf-surface-2"
                }`}
                title={entry.month}
              />
              <span className="text-[8px] text-bf-text-4">
                {MONTH_LABELS[d.getMonth()]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

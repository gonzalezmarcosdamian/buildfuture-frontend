"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

interface CapitalGoalData {
  id: number;
  name: string;
  emoji: string;
  target_usd: number;
  target_years: number;
  portfolio_usd: number;
  progress_pct: number;
  months_to_goal: number | null;
  monthly_savings_usd: number;
}

function fmtK(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function arrivalLabel(months: number): string {
  const now = new Date();
  now.setMonth(now.getMonth() + months);
  return now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function yearsLabel(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} mes${m !== 1 ? "es" : ""}`;
  if (m === 0) return `${y} año${y !== 1 ? "s" : ""}`;
  return `${y}a ${m}m`;
}

type Status = "achieved" | "on_track" | "delayed" | "no_savings";

function getStatus(goal: CapitalGoalData): Status {
  if (goal.progress_pct >= 100) return "achieved";
  if (goal.monthly_savings_usd === 0 || goal.months_to_goal === null) return "no_savings";
  const targetMonths = goal.target_years * 12;
  return goal.months_to_goal <= targetMonths ? "on_track" : "delayed";
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  achieved:  { label: "¡Llegaste!",   color: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-800/60" },
  on_track:  { label: "En camino",    color: "text-blue-400",    bg: "bg-blue-950/20",    border: "border-blue-900/40" },
  delayed:   { label: "Con retraso",  color: "text-yellow-400",  bg: "bg-yellow-950/20",  border: "border-yellow-900/40" },
  no_savings:{ label: "Sin datos",    color: "text-bf-text-3",   bg: "bg-bf-surface-2/30",   border: "border-bf-border-2" },
};

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function GoalCompliance({ showEmptyState = false }: { showEmptyState?: boolean }) {
  const [goals, setGoals] = useState<CapitalGoalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/portfolio/capital-goals`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setGoals(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="h-24 bg-bf-surface rounded-2xl border border-bf-border animate-pulse" />;

  if (goals.length === 0) {
    if (!showEmptyState) return null;
    return (
      <div className="bg-bf-surface rounded-2xl border border-dashed border-bf-border-2 p-4 flex items-center gap-4">
        <span className="text-3xl shrink-0">🎯</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-bf-text-2">Sin metas de capital</p>
          <p className="text-[11px] text-bf-text-3 mt-0.5">
            Definí objetivos como tu casa o auto y te mostramos cuándo llegás a cada uno.
          </p>
          <Link href="/goals" className="inline-block mt-2 text-[11px] font-medium text-violet-400 hover:text-violet-300 underline">
            Agregar primera meta →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-bf-text-3 uppercase tracking-wider px-1">Cumplimiento de metas</p>

      {goals.map((goal) => {
        const status = getStatus(goal);
        const cfg = STATUS_CONFIG[status];
        const targetMonths = goal.target_years * 12;
        const isDelayed = status === "delayed" && goal.months_to_goal !== null;
        const delayMonths = isDelayed ? (goal.months_to_goal! - targetMonths) : 0;

        return (
          <div
            key={goal.id}
            className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: emoji + info */}
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-2xl leading-none shrink-0 mt-0.5">{goal.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-bf-text-2">{goal.name}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-bf-surface/60 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {status === "achieved" && (
                    <p className="text-[11px] text-emerald-400 mt-1">
                      Tu portafolio ({fmtK(goal.portfolio_usd)}) ya superó el objetivo de {fmtK(goal.target_usd)} 🎉
                    </p>
                  )}

                  {(status === "on_track" || status === "delayed") && goal.months_to_goal !== null && (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[11px] text-bf-text-2">
                        Llegás en{" "}
                        <span className={`font-semibold ${cfg.color}`}>
                          {arrivalLabel(goal.months_to_goal)}
                        </span>
                        {" "}({yearsLabel(goal.months_to_goal)})
                      </p>
                      {status === "on_track" && (
                        <p className="text-[10px] text-bf-text-3">
                          Objetivo: {goal.target_years} año{goal.target_years !== 1 ? "s" : ""} · {yearsLabel(targetMonths - goal.months_to_goal)} antes del plazo
                        </p>
                      )}
                      {isDelayed && (
                        <p className="text-[10px] text-yellow-600">
                          {yearsLabel(delayMonths)} después de tu objetivo de {goal.target_years} año{goal.target_years !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  )}

                  {status === "no_savings" && (
                    <p className="text-[11px] text-bf-text-3 mt-1">
                      <Link href="/settings" className="text-blue-400 hover:text-blue-300 underline">
                        Configurá tu presupuesto
                      </Link>{" "}para ver cuándo llegás
                    </p>
                  )}
                </div>
              </div>

              {/* Right: progress ring / pct */}
              <div className="shrink-0 text-right">
                <p className={`text-lg font-bold leading-none ${cfg.color}`}>{goal.progress_pct}%</p>
                <p className="text-[10px] text-bf-text-3 mt-0.5">{fmtK(goal.portfolio_usd)}</p>
                <p className="text-[10px] text-bf-text-4">de {fmtK(goal.target_usd)}</p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3 h-1.5 bg-bf-surface/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  status === "achieved" ? "bg-emerald-500" :
                  status === "on_track" ? "bg-blue-500" :
                  status === "delayed"  ? "bg-yellow-500" : "bg-slate-600"
                }`}
                style={{ width: `${Math.max(2, Math.min(100, goal.progress_pct))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

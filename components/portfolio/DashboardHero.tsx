"use client";
import { useState, useEffect } from "react";
import { Lock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency-context";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { formatUSD, formatARS } from "@/lib/formatters";
import { supabase } from "@/lib/supabase";

interface CoverItem {
  name: string;
  icon: string;
  status: "covered" | "partial" | "pending";
  amount_usd: number;
  covered_pct?: number;
}

interface Props {
  monthlyReturn: number;
  monthlyExpenses: number;
  covers: CoverItem[];
  portfolioTotal: number;
  portfolioTotalArs?: number | null;
  mep: number;
  capitalTotalUsd?: number | null;
}

const VISIBLE_DEFAULT = 3;

// ── Capital Goals Mini (inline en el hero) ────────────────────────────────────

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

type GoalStatus = "achieved" | "on_track" | "delayed" | "no_savings";

function goalStatus(g: CapitalGoalData): GoalStatus {
  if (g.progress_pct >= 100) return "achieved";
  if (!g.monthly_savings_usd || g.months_to_goal === null) return "no_savings";
  return g.months_to_goal <= g.target_years * 12 ? "on_track" : "delayed";
}

const STATUS_LABEL: Record<GoalStatus, string> = {
  achieved:   "¡Llegaste!",
  on_track:   "En camino",
  delayed:    "Con retraso",
  no_savings: "Sin datos",
};
const STATUS_COLOR: Record<GoalStatus, string> = {
  achieved:   "text-emerald-400",
  on_track:   "text-blue-400",
  delayed:    "text-yellow-400",
  no_savings: "text-slate-500",
};
const BAR_COLOR: Record<GoalStatus, string> = {
  achieved:   "bg-emerald-500",
  on_track:   "bg-blue-500",
  delayed:    "bg-yellow-500",
  no_savings: "bg-slate-600",
};
function fmtK(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function CapitalGoalsMini() {
  const [goals, setGoals] = useState<CapitalGoalData[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_URL}/portfolio/capital-goals`, { headers });
        if (res.ok) setGoals(await res.json());
      } finally {
        setReady(true);
      }
    }
    load();
  }, []);

  if (!ready) return (
    <div className="px-5 pb-4 pt-3 border-t border-slate-800/80 space-y-2">
      <div className="h-3 w-28 bg-slate-800 rounded animate-pulse" />
      <div className="h-8 bg-slate-800/60 rounded-lg animate-pulse" />
    </div>
  );

  return (
    <div className="border-t border-slate-800/80">
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <p className="text-[9px] text-slate-500 uppercase tracking-wider">📈 Metas de capital</p>
        <Link href="/goals" className="text-[10px] text-violet-400 hover:text-violet-300">
          {goals.length > 0 ? "Ver todas →" : "Agregar →"}
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="px-5 pb-4 flex items-center gap-2">
          <span className="text-slate-600 text-sm">🎯</span>
          <p className="text-[11px] text-slate-500">
            Sin metas todavía —{" "}
            <Link href="/goals" className="text-violet-400 hover:text-violet-300 underline">
              agregá tu primera meta
            </Link>
          </p>
        </div>
      ) : (
        <div className="px-5 pb-4 space-y-2">
          {goals.map((g) => {
            const st = goalStatus(g);
            return (
              <div key={g.id} className="flex items-center gap-2.5">
                <span className="text-sm shrink-0">{g.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] text-slate-300 truncate font-medium">{g.name}</p>
                    <span className={`text-[9px] font-semibold shrink-0 ml-2 ${STATUS_COLOR[st]}`}>
                      {STATUS_LABEL[st]}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${BAR_COLOR[st]}`}
                      style={{ width: `${Math.max(2, Math.min(100, g.progress_pct))}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right w-12">
                  <p className={`text-[11px] font-bold leading-none ${STATUS_COLOR[st]}`}>{g.progress_pct}%</p>
                  <p className="text-[9px] text-slate-600 mt-0.5">{fmtK(g.target_usd)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardHero({ monthlyReturn, monthlyExpenses, covers, portfolioTotal, portfolioTotalArs, mep, capitalTotalUsd }: Props) {
  const { currency } = useCurrency();
  const [expanded, setExpanded] = useState(false);

  const fmt = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);
  const fmtTotal = (usd: number) =>
    currency === "USD" ? formatUSD(usd) : formatARS(portfolioTotalArs ?? usd * mep);

  const coveragePct = monthlyExpenses > 0 ? Math.min(monthlyReturn / monthlyExpenses, 1) : 0;
  const coveredCount = covers.filter((c) => c.status === "covered").length;
  const partial = covers.find((c) => c.status === "partial");

  // Markers for the progress bar
  const markers = covers.reduce<number[]>((acc, c) => {
    acc.push((acc[acc.length - 1] ?? 0) + c.amount_usd);
    return acc;
  }, []);

  // Next unlock
  const nextTarget = partial ?? covers.find((c) => c.status === "pending");
  const amountNeeded = nextTarget
    ? nextTarget.amount_usd * (1 - (partial?.covered_pct ?? 0))
    : 0;

  const visibleCovers = expanded ? covers : covers.slice(0, VISIBLE_DEFAULT);
  const hiddenCount = covers.length - VISIBLE_DEFAULT;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">

      {/* ── Encabezado global ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tu portafolio trabaja por vos</p>
        <CurrencyToggle />
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN RENTA
          ══════════════════════════════════════════════════════════ */}
      <div className="border-t border-slate-800/80">
        {/* Header renta */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-emerald-500 rounded-full" />
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Renta mensual</p>
          </div>
          <div className="flex items-end gap-1 leading-none">
            <span className="font-extrabold text-emerald-400" style={{ fontSize: "clamp(1.1rem, 6vw, 1.75rem)" }}>
              +{fmt(monthlyReturn)}
            </span>
            <span className="text-xs text-slate-500 pb-0.5">/mes</span>
          </div>
        </div>

        {/* Barra de cobertura */}
        <div className="px-5 pb-2 space-y-1">
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(coveragePct * 100, 0.4)}%`,
                background: "linear-gradient(90deg, #059669, #34d399)",
              }}
            />
            {markers.map((m, i) => {
              const pct = (m / monthlyExpenses) * 100;
              if (pct >= 100) return null;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-slate-900/60"
                  style={{ left: `${pct}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-slate-600">
            <span>$0</span>
            <span className="text-emerald-700 font-medium">{coveredCount}/{covers.length} categorías cubiertas</span>
            <span>{fmt(monthlyExpenses)}/mes</span>
          </div>
        </div>

        {/* Categorías de gasto */}
        <div className="divide-y divide-slate-800/60">
          {visibleCovers.map((c, i) => (
            <GoalRow key={i} item={c} fmt={fmt} />
          ))}
        </div>

        {/* Expandir / colapsar */}
        {covers.length > VISIBLE_DEFAULT && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors border-t border-slate-800/60"
          >
            {expanded ? (
              <><ChevronUp size={13} /> Mostrar menos</>
            ) : (
              <><ChevronDown size={13} /> Ver {hiddenCount} más</>
            )}
          </button>
        )}

        {/* Próximo a desbloquear */}
        {nextTarget && (
          <div className="mx-4 mb-3 mt-1 border-t border-slate-800/60 pt-2">
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-emerald-600 font-medium">
                  Próximo: {nextTarget.icon} {nextTarget.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Faltan <span className="text-white font-semibold">{fmt(amountNeeded)}/mes</span> de renta
                </p>
              </div>
              <Link href="/budget" className="text-[10px] text-emerald-500 hover:text-emerald-400 shrink-0 ml-3">
                Presupuesto →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN CAPITAL
          ══════════════════════════════════════════════════════════ */}
      <div className="border-t-2 border-slate-700/60">
        {/* Header capital */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-violet-500 rounded-full" />
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Capital acumulado</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-violet-300 whitespace-nowrap" style={{ fontSize: "clamp(1rem, 5vw, 1.375rem)" }}>
              {fmt(capitalTotalUsd ?? portfolioTotal)}
            </p>
            <p className="text-[9px] text-slate-600">total {fmtTotal(portfolioTotal)}</p>
          </div>
        </div>

        {/* Metas de largo plazo */}
        <CapitalGoalsMini />
      </div>

    </div>
  );
}

function GoalRow({ item, fmt }: { item: CoverItem; fmt: (n: number) => string }) {
  const isCovered = item.status === "covered";
  const isPartial = item.status === "partial";
  const isPending = item.status === "pending";

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 transition-colors ${
        isCovered
          ? "bg-emerald-950/10"
          : isPending
          ? "opacity-50"
          : ""
      }`}
    >
      {/* Icono estado */}
      <div className="shrink-0 w-6 flex justify-center">
        {isCovered && <CheckCircle2 size={15} className="text-emerald-500" />}
        {isPartial && (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          </div>
        )}
        {isPending && <Lock size={13} className="text-slate-600" />}
      </div>

      {/* Emoji categoría */}
      <span className="text-sm shrink-0">{item.icon}</span>

      {/* Nombre + barra parcial */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isCovered ? "text-slate-200" : isPartial ? "text-slate-300" : "text-slate-500"}`}>
          {item.name}
        </p>
        {isPartial && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${(item.covered_pct ?? 0) * 100}%` }}
              />
            </div>
            <span className="text-[9px] text-yellow-500 shrink-0">
              {((item.covered_pct ?? 0) * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Monto */}
      <div className="text-right shrink-0">
        <p className={`text-[11px] font-medium ${isCovered ? "text-emerald-400" : isPartial ? "text-yellow-400" : "text-slate-600"}`}>
          {fmt(item.amount_usd)}/mes
        </p>
        {isCovered && <p className="text-[9px] text-emerald-700 mt-0.5">cubierto ✓</p>}
      </div>
    </div>
  );
}

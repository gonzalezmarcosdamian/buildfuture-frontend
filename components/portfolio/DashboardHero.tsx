"use client";
import { useState, useEffect } from "react";
import { Lock, CheckCircle2, ChevronDown, ChevronUp, Flame } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency-context";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { formatUSD, formatARS } from "@/lib/formatters";
import { supabase } from "@/lib/supabase";

function fmtCompact(usd: number, currency: "USD" | "ARS", mep: number): string {
  if (currency === "USD") {
    if (usd >= 1_000_000) return `USD ${(usd / 1_000_000).toFixed(1)}M`;
    if (usd >= 1_000) return `USD ${(usd / 1_000).toFixed(0)}K`;
    return formatUSD(usd);
  }
  const ars = usd * mep;
  if (ars >= 1_000_000_000) return `$${(ars / 1_000_000_000).toFixed(1)}B`;
  if (ars >= 1_000_000) return `$${(ars / 1_000_000).toFixed(1)}M`;
  if (ars >= 1_000) return `$${(ars / 1_000).toFixed(0)}K`;
  return formatARS(ars);
}

interface CoverItem {
  name: string;
  icon: string;
  status: "covered" | "partial" | "pending";
  amount_usd: number;
  covered_pct?: number;
}

interface StreakData {
  current: number;
  longest: number;
}

interface Props {
  monthlyReturn: number;
  monthlyExpenses: number;
  covers: CoverItem[];
  portfolioTotal: number;
  portfolioTotalArs?: number | null;
  mep: number;
  capitalTotalUsd?: number | null;
  rentaTotalUsd?: number | null;
  cryptoTotalUsd?: number | null;
  cedearTotalUsd?: number | null;
  streak?: StreakData | null;
}

// ── Capital Goals Mini ─────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

interface CapitalGoalData {
  id: number; name: string; emoji: string;
  target_usd: number; target_years: number;
  portfolio_usd: number; progress_pct: number;
  months_to_goal: number | null; monthly_savings_usd: number;
}

type GoalStatus = "achieved" | "on_track" | "delayed" | "no_savings";

function goalStatus(g: CapitalGoalData): GoalStatus {
  if (g.progress_pct >= 100) return "achieved";
  if (!g.monthly_savings_usd || g.months_to_goal === null) return "no_savings";
  return g.months_to_goal <= g.target_years * 12 ? "on_track" : "delayed";
}

const STATUS_LABEL: Record<GoalStatus, string> = {
  achieved: "¡Llegaste!", on_track: "En camino",
  delayed: "Con retraso",  no_savings: "Sin datos",
};
const STATUS_COLOR: Record<GoalStatus, string> = {
  achieved: "text-emerald-400", on_track: "text-blue-400",
  delayed:  "text-yellow-400",  no_savings: "text-slate-500",
};
const BAR_COLOR: Record<GoalStatus, string> = {
  achieved: "bg-emerald-500", on_track: "bg-blue-500",
  delayed:  "bg-yellow-500",  no_savings: "bg-slate-600",
};

function CapitalGoalsMini({ mep }: { mep: number }) {
  const { currency } = useCurrency();
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
      } finally { setReady(true); }
    }
    void load();
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
        <div className="px-5 pb-4">
          <p className="text-[11px] text-slate-500">
            Sin metas —{" "}
            <Link href="/goals" className="text-violet-400 underline">agregá tu primera meta</Link>
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
                    <span className={`text-[9px] font-semibold shrink-0 ml-2 ${STATUS_COLOR[st]}`}>{STATUS_LABEL[st]}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${BAR_COLOR[st]}`} style={{ width: `${Math.max(2, Math.min(100, g.progress_pct))}%` }} />
                  </div>
                </div>
                <div className="shrink-0 text-right w-12">
                  <p className={`text-[11px] font-bold leading-none ${STATUS_COLOR[st]}`}>{g.progress_pct}%</p>
                  <p className="text-[9px] text-slate-600 mt-0.5">{fmtCompact(g.target_usd, currency, mep)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── GoalRow ────────────────────────────────────────────────────────────────────

function GoalRow({ item, fmt }: { item: CoverItem; fmt: (n: number) => string }) {
  const isCovered = item.status === "covered";
  const isPartial = item.status === "partial";
  const isPending = item.status === "pending";
  return (
    <div className={`flex items-center gap-3 px-5 py-2.5 ${isCovered ? "bg-emerald-950/10" : isPending ? "opacity-50" : ""}`}>
      <div className="shrink-0 w-5 flex justify-center">
        {isCovered && <CheckCircle2 size={13} className="text-emerald-500" />}
        {isPartial && <div className="w-3 h-3 rounded-full border-2 border-yellow-500 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-yellow-500" /></div>}
        {isPending && <Lock size={11} className="text-slate-600" />}
      </div>
      <span className="text-sm shrink-0">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-medium truncate ${isCovered ? "text-slate-200" : isPartial ? "text-slate-300" : "text-slate-500"}`}>{item.name}</p>
        {isPartial && (
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-0.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(item.covered_pct ?? 0) * 100}%` }} />
            </div>
            <span className="text-[9px] text-yellow-500 shrink-0">{((item.covered_pct ?? 0) * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
      <p className={`text-[11px] font-medium shrink-0 ${isCovered ? "text-emerald-400" : isPartial ? "text-yellow-400" : "text-slate-600"}`}>
        {fmt(item.amount_usd)}/mes
      </p>
    </div>
  );
}

// ── SegmentedBar ───────────────────────────────────────────────────────────────

function SegmentedBar({ pct, color, label, sublabel }: {
  pct: number; color: string; label: string; sublabel: string;
}) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-300 font-medium">{label}</p>
        <p className="text-[11px] font-bold text-slate-200">{Math.round(clamped)}%</p>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.max(clamped, 0.5)}%` }} />
      </div>
      <p className="text-[10px] text-slate-500">{sublabel}</p>
    </div>
  );
}

// ── DashboardHero ──────────────────────────────────────────────────────────────

export function DashboardHero({
  monthlyReturn, monthlyExpenses, covers, portfolioTotal,
  portfolioTotalArs, mep, capitalTotalUsd, rentaTotalUsd,
  cryptoTotalUsd, cedearTotalUsd, streak,
}: Props) {
  const { currency } = useCurrency();
  const [coversOpen, setCoversOpen] = useState(false);

  const fmt = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);
  const fmtTotal = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(portfolioTotalArs ?? usd * mep);

  // Renta bar: cobertura de gastos del presupuesto
  const rentaPct = monthlyExpenses > 0 ? (monthlyReturn / monthlyExpenses) * 100 : 0;
  const coveredCount = covers.filter((c) => c.status === "covered").length;

  // Capital bar: solo CEDEARs/ETFs vs objetivo libertad financiera (regla 4%)
  const pureCapital = cedearTotalUsd ?? 0;
  const freedomTarget = monthlyExpenses * 12 * 25;
  const capitalPct = freedomTarget > 0 ? (pureCapital / freedomTarget) * 100 : 0;

  // Bonos/ONs = 50% del bucket capital que no son CEDEARs ni crypto
  const bondCapital = Math.max(0, (capitalTotalUsd ?? 0) - pureCapital - (cryptoTotalUsd ?? 0));
  const hasBuckets = (rentaTotalUsd ?? 0) > 0 || pureCapital > 0 || (cryptoTotalUsd ?? 0) > 0 || bondCapital > 0;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">

      {/* ── Total + streak ───────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Portafolio total</p>
          <p className="text-2xl font-extrabold text-slate-100 leading-none tabular-nums">
            {fmtTotal(portfolioTotal)}
          </p>
          {streak && streak.current >= 1 && (
            <div className="flex items-center gap-1 mt-2">
              <Flame size={11} className="text-orange-400" />
              <span className="text-[10px] text-orange-400 font-medium">
                {streak.current} {streak.current === 1 ? "mes" : "meses"} invirtiendo
              </span>
            </div>
          )}
        </div>
        <CurrencyToggle />
      </div>

      {/* ── Barras segmentadas ───────────────────────────────────────────────── */}
      <div className="px-5 pb-4 space-y-4 border-t border-slate-800/60 pt-4">
        <SegmentedBar
          pct={rentaPct}
          color="bg-gradient-to-r from-emerald-600 to-emerald-400"
          label={`💰 Renta · ${fmt(monthlyReturn)}/mes`}
          sublabel={
            monthlyExpenses > 0
              ? `${coveredCount}/${covers.length} categorías cubiertas · meta ${fmt(monthlyExpenses)}/mes`
              : "Configurá tu presupuesto para ver el progreso"
          }
        />
        <SegmentedBar
          pct={capitalPct}
          color="bg-gradient-to-r from-violet-600 to-violet-400"
          label={`📈 Capital · ${fmtCompact(pureCapital, currency, mep)}`}
          sublabel={
            freedomTarget > 0
              ? `Objetivo libertad: ${fmtCompact(freedomTarget, currency, mep)} (regla 4%)`
              : "Configurá tu presupuesto para calcular el objetivo"
          }
        />
      </div>

      {/* ── Breakdown de buckets ─────────────────────────────────────────────── */}
      {hasBuckets && (
        <div className="px-5 pb-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-800/40 pt-2.5">
          {(rentaTotalUsd ?? 0) > 0 && (
            <span className="text-[10px] text-slate-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 align-middle" />
              Renta <span className="text-emerald-400 font-medium">{fmtCompact(rentaTotalUsd!, currency, mep)}</span>
            </span>
          )}
          {pureCapital > 0 && (
            <span className="text-[10px] text-slate-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 mr-1 align-middle" />
              CEDEARs <span className="text-violet-400 font-medium">{fmtCompact(pureCapital, currency, mep)}</span>
            </span>
          )}
          {bondCapital > 0 && (
            <span className="text-[10px] text-slate-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 mr-1 align-middle" />
              Bonos/ONs <span className="text-orange-400 font-medium">{fmtCompact(bondCapital, currency, mep)}</span>
            </span>
          )}
          {(cryptoTotalUsd ?? 0) > 0 && (
            <span className="text-[10px] text-slate-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1 align-middle" />
              Crypto <span className="text-yellow-400 font-medium">{fmtCompact(cryptoTotalUsd!, currency, mep)}</span>
            </span>
          )}
        </div>
      )}

      {/* ── Categorías de presupuesto: colapsadas ───────────────────────────── */}
      {covers.length > 0 && (
        <div className="border-t border-slate-800/60">
          <button
            onClick={() => setCoversOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-2.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span>{coveredCount}/{covers.length} categorías del presupuesto</span>
            {coversOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {coversOpen && (
            <div className="divide-y divide-slate-800/40 border-t border-slate-800/40">
              {covers.map((c, i) => <GoalRow key={i} item={c} fmt={fmt} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Metas de capital largo plazo ────────────────────────────────────── */}
      <CapitalGoalsMini mep={mep} />
    </div>
  );
}

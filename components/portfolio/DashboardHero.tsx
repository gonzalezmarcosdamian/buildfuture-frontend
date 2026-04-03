"use client";
import { useState } from "react";
import { Flame, ChevronRight, Info, X } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency-context";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { formatUSD, formatARS } from "@/lib/formatters";
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
  cedearTotalUsd?: number | null;
  streak?: StreakData | null;
}


// ── HeroInfoSheet ──────────────────────────────────────────────────────────────

function HeroInfoSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-slate-950 rounded-t-3xl border-t border-slate-800 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-950 pt-3 pb-2 px-5 border-b border-slate-800/60">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-100">¿Qué miden las barras?</p>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-6 pb-10">

          {/* Renta */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-950/60 border border-emerald-900/50 flex items-center justify-center text-sm">💰</div>
              <p className="text-sm font-semibold text-slate-200">Barra de Renta</p>
            </div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Muestra qué porcentaje de tus gastos mensuales ya cubrís con los <span className="text-slate-200 font-medium">rendimientos de tus instrumentos de renta</span> (LECAPs, FCIs, Bonos, ONs).
              </p>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Al llegar al <span className="text-emerald-400 font-semibold">100%</span>, tus rendimientos mensuales cubren todos tus gastos. Ese es el momento de libertad financiera por renta.
              </p>
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-3 py-2">
                <p className="text-[10px] text-slate-400 leading-snug">
                  💡 Configurá tu presupuesto en <span className="text-emerald-400">Metas →</span> para que la barra sea precisa.
                </p>
              </div>
            </div>
          </section>

          {/* Capital */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-violet-950/60 border border-violet-900/50 flex items-center justify-center text-sm">📈</div>
              <p className="text-sm font-semibold text-slate-200">Barra de Capital</p>
            </div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mide tus <span className="text-slate-200 font-medium">CEDEARs y ETFs</span> contra el objetivo de libertad financiera calculado con la <span className="text-slate-200 font-medium">Regla del 4%</span>.
              </p>
              <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 space-y-1.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Regla del 4%</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Si acumulás <span className="text-violet-400 font-semibold">25 veces tus gastos anuales</span> en capital, podés retirar el 4% cada año indefinidamente sin agotar el fondo.
                </p>
                <p className="text-[10px] text-slate-500">
                  Objetivo = gastos/mes × 12 × 25
                </p>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Solo cuentan CEDEARs/ETFs — activos de crecimiento dolarizado. Los bonos y ONs van a tu barra de Renta.
              </p>
              <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-xl px-3 py-2">
                <p className="text-[10px] text-slate-400 leading-snug">
                  ₿ <span className="text-yellow-400 font-medium">Crypto (Binance)</span> es capital especulativo — no entra en esta barra por su alta volatilidad. La ves en el resumen de tu portafolio.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ── SegmentedBar ───────────────────────────────────────────────────────────────

function SegmentedBar({ pct, color, amountColor, label, amount, sublabel, href }: {
  pct: number; color: string; amountColor: string;
  label: string; amount: string; sublabel: string; href?: string;
}) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const inner = (
    <div className={href ? "group" : ""}>
      {/* label + chevron */}
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        {href && <ChevronRight size={11} className="text-slate-600 group-hover:text-slate-400 transition-colors" />}
      </div>
      {/* amount prominente */}
      <div className="flex items-end justify-between mb-2">
        <p className={`text-xl font-extrabold leading-none tabular-nums ${amountColor}`}>{amount}</p>
        <p className="text-sm font-bold text-slate-400 leading-none">{Math.round(clamped)}%</p>
      </div>
      {/* barra */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1.5">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.max(clamped, 0.5)}%` }} />
      </div>
      {/* sublabel */}
      <p className="text-[10px] text-slate-500">{sublabel}</p>
    </div>
  );
  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}

// ── DashboardHero ──────────────────────────────────────────────────────────────

export function DashboardHero({
  monthlyReturn, monthlyExpenses, covers, portfolioTotal,
  portfolioTotalArs, mep, cedearTotalUsd, streak,
}: Props) {
  const { currency } = useCurrency();
  const [infoOpen, setInfoOpen] = useState(false);

  const fmt = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);
  const fmtTotal = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(portfolioTotalArs ?? usd * mep);

  // Renta bar
  const rentaPct = monthlyExpenses > 0 ? (monthlyReturn / monthlyExpenses) * 100 : 0;
  const coveredCount = covers.filter((c) => c.status === "covered").length;

  // Capital bar: solo CEDEARs/ETFs vs objetivo libertad financiera (regla 4%)
  const pureCapital = cedearTotalUsd ?? 0;
  const freedomTarget = monthlyExpenses * 12 * 25;
  const capitalPct = freedomTarget > 0 ? (pureCapital / freedomTarget) * 100 : 0;

  return (
    <>
    {infoOpen && <HeroInfoSheet onClose={() => setInfoOpen(false)} />}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInfoOpen(true)}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1"
            aria-label="Explicación de las barras"
          >
            <Info size={15} />
          </button>
          <CurrencyToggle />
        </div>
      </div>

      {/* ── Barras segmentadas ───────────────────────────────────────────────── */}
      <div className="px-5 pb-5 space-y-5 border-t border-slate-800/60 pt-4">
        <SegmentedBar
          pct={rentaPct}
          color="bg-gradient-to-r from-emerald-600 to-emerald-400"
          amountColor="text-emerald-400"
          label="💰 Renta mensual"
          amount={`${fmt(monthlyReturn)}/mes`}
          sublabel={
            monthlyExpenses > 0
              ? `${coveredCount}/${covers.length} categorías cubiertas · meta ${fmt(monthlyExpenses)}/mes`
              : "Configurá tu presupuesto para ver el progreso"
          }
          href="/goals?section=renta"
        />
        <SegmentedBar
          pct={capitalPct}
          color="bg-gradient-to-r from-violet-600 to-violet-400"
          amountColor="text-violet-400"
          label="📈 Capital acumulado"
          amount={fmtCompact(pureCapital, currency, mep)}
          sublabel={
            freedomTarget > 0
              ? `Objetivo libertad: ${fmtCompact(freedomTarget, currency, mep)} (regla 4%)`
              : "Configurá tu presupuesto para calcular el objetivo"
          }
          href="/goals?section=capital"
        />
      </div>
    </div>
    </>
  );
}

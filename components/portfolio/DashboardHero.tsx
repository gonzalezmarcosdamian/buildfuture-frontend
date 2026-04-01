"use client";
import { useState } from "react";
import { Lock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency-context";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { formatUSD, formatARS } from "@/lib/formatters";

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
  mep: number;
}

const VISIBLE_DEFAULT = 3;

export function DashboardHero({ monthlyReturn, monthlyExpenses, covers, portfolioTotal, mep }: Props) {
  const { currency } = useCurrency();
  const [expanded, setExpanded] = useState(false);

  const fmt = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);

  const coveragePct = monthlyExpenses > 0 ? Math.min(monthlyReturn / monthlyExpenses, 1) : 0;
  const coveredCount = covers.filter((c) => c.status === "covered").length;
  const partial = covers.find((c) => c.status === "partial");

  // Markers for the progress bar
  let cumUSD = 0;
  const markers = covers.map((c) => { cumUSD += c.amount_usd; return cumUSD; });

  // Next unlock
  const nextTarget = partial ?? covers.find((c) => c.status === "pending");
  const amountNeeded = nextTarget
    ? nextTarget.amount_usd * (1 - (partial?.covered_pct ?? 0))
    : 0;

  const visibleCovers = expanded ? covers : covers.slice(0, VISIBLE_DEFAULT);
  const hiddenCount = covers.length - VISIBLE_DEFAULT;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">

      {/* ── Top: números y toggle ─────────────────────────────── */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              Tu portafolio trabaja por vos
            </p>
            <div className="flex items-end gap-1.5">
              <span
                className="font-extrabold text-emerald-400 whitespace-nowrap"
                style={{ fontSize: "clamp(1.15rem, 6.5vw, 2.25rem)" }}
              >
                +{fmt(monthlyReturn)}
              </span>
              <span className="text-sm text-slate-500 mb-1 shrink-0">/mes</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              de {fmt(monthlyExpenses)} en gastos ·{" "}
              <span className="text-emerald-500 font-medium">
                {(coveragePct * 100).toFixed(1)}% cubierto
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
            <CurrencyToggle />
            <div className="text-right">
              <p className="text-[9px] text-slate-600 uppercase tracking-wider">Portafolio</p>
              <p
                className="font-bold text-slate-300 whitespace-nowrap"
                style={{ fontSize: "clamp(0.75rem, 3.5vw, 1.125rem)" }}
              >
                {fmt(portfolioTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-1">
          <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
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
            <span className="text-slate-500">{coveredCount}/{covers.length} metas</span>
            <span>{fmt(monthlyExpenses)}/mes</span>
          </div>
        </div>
      </div>

      {/* ── Divisor ───────────────────────────────────────────── */}
      <div className="border-t border-slate-800/80" />

      {/* ── Lista de metas ────────────────────────────────────── */}
      <div className="divide-y divide-slate-800/60">
        {visibleCovers.map((c, i) => (
          <GoalRow key={i} item={c} fmt={fmt} isFirst={i === 0} />
        ))}
      </div>

      {/* ── Expandir / colapsar ───────────────────────────────── */}
      {covers.length > VISIBLE_DEFAULT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors border-t border-slate-800/60"
        >
          {expanded ? (
            <><ChevronUp size={13} /> Mostrar menos</>
          ) : (
            <><ChevronDown size={13} /> Ver {hiddenCount} metas más</>
          )}
        </button>
      )}

      {/* ── Próximo a desbloquear ─────────────────────────────── */}
      {nextTarget && (
        <div className="border-t border-slate-800/80 mx-4 mb-4 mt-1">
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl px-3 py-2.5 mt-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-400 font-medium">
                Próximo: {nextTarget.icon} {nextTarget.name}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Faltan{" "}
                <span className="text-white font-semibold">{fmt(amountNeeded)}/mes</span>{" "}
                de rendimiento
              </p>
            </div>
            <Link href="/goals" className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0 ml-3">
              Ver metas →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalRow({ item, fmt, isFirst }: { item: CoverItem; fmt: (n: number) => string; isFirst: boolean }) {
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

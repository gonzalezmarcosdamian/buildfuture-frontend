"use client";
import { useState } from "react";
import { Lock, Zap } from "lucide-react";
import { CurrencyValue } from "@/components/ui/CurrencyValue";
import { PortfolioCovers } from "@/components/goals/PortfolioCovers";
import { GoalCompliance } from "@/components/goals/GoalCompliance";
import { CapitalGoals } from "@/components/goals/CapitalGoals";

type Tab = "renta" | "capital";

interface CoverItem {
  status: "pending" | "covered" | "partial";
  name: string;
  icon: string;
  amount_usd: number;
  covered_pct: number;
}

interface UnlockItem extends CoverItem {
  monthly_needed: number;
  capital_needed: number | null;
}

interface Props {
  monthlyReturn: number;
  monthlyExpenses: number;
  mep: number;
  covers: CoverItem[];
  unlockRoadmap: UnlockItem[];
  budgetSavingsUSD: number | null;
}

export function GoalsClient({
  monthlyReturn,
  monthlyExpenses,
  mep,
  covers,
  unlockRoadmap,
  budgetSavingsUSD,
}: Props) {
  const [tab, setTab] = useState<Tab>("renta");
  const covered = covers.filter((c) => c.status === "covered");

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex bg-slate-800/60 rounded-xl p-1 gap-1">
        <button
          onClick={() => setTab("renta")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "renta"
              ? "bg-emerald-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          💰 Renta mensual
        </button>
        <button
          onClick={() => setTab("capital")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "capital"
              ? "bg-violet-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          📈 Capital a largo plazo
        </button>
      </div>

      {/* ── RENTA TAB ───────────────────────────────────────────── */}
      {tab === "renta" && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-300">Categorías desbloqueadas</p>
              <span className="text-xs font-bold text-emerald-400">{covered.length}/{covers.length}</span>
            </div>
            <div className="flex gap-1 mb-3">
              {covers.map((c, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    c.status === "covered"  ? "bg-emerald-500" :
                    c.status === "partial" ? "bg-yellow-500/60" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">
                Genera{" "}
                <span className="text-emerald-400 font-semibold">
                  +<CurrencyValue usd={monthlyReturn} mep={mep} />/mes
                </span>
              </span>
              <span className="text-slate-500">
                Gastos: <CurrencyValue usd={monthlyExpenses} mep={mep} />/mes
              </span>
            </div>
          </div>

          {/* Categorías */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <PortfolioCovers monthly_return_usd={monthlyReturn} items={covers} mep={mep} />
          </div>

          {/* Roadmap desbloqueo */}
          {unlockRoadmap.length > 0 && (
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                <p className="text-xs font-semibold text-slate-300">Para desbloquear</p>
              </div>
              {unlockRoadmap.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl p-3 border ${
                    i === 0
                      ? "bg-blue-950/20 border-blue-900/40"
                      : "bg-slate-800/40 border-slate-800 opacity-60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0">
                    {c.status === "partial" ? c.icon : <Lock size={14} className="text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-300">{c.icon} {c.name}</p>
                      <p className="text-[10px] text-slate-500">
                        <CurrencyValue usd={c.amount_usd} mep={mep} />/mes
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Necesitás{" "}
                      <span className="text-slate-300 font-medium">
                        +<CurrencyValue usd={c.monthly_needed} mep={mep} />/mes
                      </span>{" "}
                      más
                      {c.capital_needed && (
                        <span>
                          {" "}≈ invertir{" "}
                          <span className="text-slate-300">
                            <CurrencyValue usd={c.capital_needed} mep={mep} />
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CAPITAL TAB ─────────────────────────────────────────── */}
      {tab === "capital" && (
        <div className="space-y-4">
          <GoalCompliance />
          <CapitalGoals budgetSavingsUSD={budgetSavingsUSD} />
        </div>
      )}
    </div>
  );
}

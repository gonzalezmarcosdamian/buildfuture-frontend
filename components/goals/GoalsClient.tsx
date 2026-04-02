"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Zap, X, Pencil, Wallet } from "lucide-react";
import { formatARS, formatUSD } from "@/lib/formatters";
import { useCurrency } from "@/lib/currency-context";
import { CurrencyValue } from "@/components/ui/CurrencyValue";
import { PortfolioCovers } from "@/components/goals/PortfolioCovers";
import { GoalCompliance } from "@/components/goals/GoalCompliance";
import { CapitalGoals } from "@/components/goals/CapitalGoals";
import { BudgetEditor } from "@/components/budget/BudgetEditor";

type Tab = "renta" | "capital";

interface Category {
  id?: number;
  name: string;
  percentage: number;
  icon: string;
  color: string;
  is_vacation: boolean;
}

interface Budget {
  income_monthly_ars: number;
  income_monthly_usd: number;
  fx_rate: number;
  savings_monthly_ars: number;
  savings_monthly_usd: number;
  expenses_pct: number;
  vacation_pct: number;
  categories: Category[];
}

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
  budget: Budget | null;
}

// ── Budget drawer ─────────────────────────────────────────────────────────────

const DEFAULT_BUDGET: Budget = {
  income_monthly_ars: 0,
  income_monthly_usd: 0,
  fx_rate: 1430,
  savings_monthly_ars: 0,
  savings_monthly_usd: 0,
  expenses_pct: 0,
  vacation_pct: 0,
  categories: [
    { name: "Alimentación", percentage: 0.25, icon: "🛒", color: "#3B82F6", is_vacation: false },
    { name: "Transporte",   percentage: 0.10, icon: "🚗", color: "#10B981", is_vacation: false },
    { name: "Vivienda",     percentage: 0.30, icon: "🏠", color: "#8B5CF6", is_vacation: false },
    { name: "Ocio",         percentage: 0.05, icon: "🎮", color: "#F59E0B", is_vacation: false },
  ],
};

function BudgetDrawer({ budget, onClose, onSaved }: {
  budget: Budget;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="bg-slate-950 rounded-t-2xl w-full max-h-[92vh] overflow-y-auto border-t border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 sticky top-0 bg-slate-950 border-b border-slate-800 z-10">
          <div className="flex items-center gap-2">
            <Wallet size={15} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-100">Presupuesto mensual</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pt-4 pb-10">
          <BudgetEditor initial={budget} onSaved={onSaved} />
        </div>
      </div>
    </div>
  );
}

// ── Budget section (encima de tabs) ───────────────────────────────────────────

function BudgetSection({ budget, mep }: { budget: Budget | null; mep: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const { currency } = useCurrency();

  function fmt(ars: number) {
    return currency === "USD" ? formatUSD(ars / mep) : formatARS(ars);
  }

  function handleSaved() {
    setEditing(false);
    router.refresh();
  }

  // Estado vacío
  if (!budget || budget.income_monthly_ars === 0) {
    return (
      <>
        <div className="bg-slate-900 rounded-2xl border border-dashed border-slate-700 p-4 flex items-center gap-4">
          <span className="text-3xl shrink-0">💰</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-300">Sin presupuesto configurado</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ingresá tu sueldo y categorías de gasto para calcular cuánto podés invertir cada mes.
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/40 border border-blue-900/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Configurar
          </button>
        </div>

        {editing && (
          <BudgetDrawer
            budget={DEFAULT_BUDGET}
            onClose={() => setEditing(false)}
            onSaved={handleSaved}
          />
        )}
      </>
    );
  }

  // Estado configurado — resumen compacto
  const expensesARS = budget.income_monthly_ars * budget.expenses_pct;
  const savingsARS  = budget.savings_monthly_ars;
  const savingsUSD  = budget.savings_monthly_usd;

  const totalAllocated = budget.expenses_pct + budget.vacation_pct;
  const savingsPct = Math.max(0, 1 - totalAllocated);

  return (
    <>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <Wallet size={13} className="text-slate-500" />
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Presupuesto mensual</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Pencil size={11} />
            Editar
          </button>
        </div>

        {/* Barra de distribución */}
        <div className="px-4 pb-1">
          <div className="h-2 rounded-full overflow-hidden flex gap-px">
            {budget.categories.map((c, i) => (
              <div
                key={i}
                style={{ width: `${c.percentage * 100}%`, backgroundColor: c.is_vacation ? "#0EA5E9" : c.color }}
                className="transition-all"
              />
            ))}
            <div style={{ width: `${savingsPct * 100}%` }} className="bg-emerald-500" />
          </div>
        </div>

        {/* Números clave */}
        <div className="grid grid-cols-3 gap-px bg-slate-800/50 border-t border-slate-800 mt-2">
          <div className="bg-slate-900 px-3 py-2.5 text-center">
            <p className="text-[9px] text-slate-500 mb-0.5">Ingreso neto</p>
            <p className="text-xs font-semibold text-slate-200">{fmt(budget.income_monthly_ars)}</p>
            <p className="text-[9px] text-slate-600">{currency === "USD" ? formatARS(budget.income_monthly_ars) : `USD ${(budget.income_monthly_ars / mep).toFixed(0)}`}</p>
          </div>
          <div className="bg-slate-900 px-3 py-2.5 text-center">
            <p className="text-[9px] text-slate-500 mb-0.5">Gastos</p>
            <p className="text-xs font-semibold text-red-400">{fmt(expensesARS)}</p>
            <p className="text-[9px] text-slate-600">{(budget.expenses_pct * 100).toFixed(0)}% del ingreso</p>
          </div>
          <div className="bg-emerald-950/30 px-3 py-2.5 text-center">
            <p className="text-[9px] text-emerald-600 mb-0.5">A invertir</p>
            <p className="text-xs font-semibold text-emerald-400">{fmt(savingsARS)}</p>
            <p className="text-[9px] text-emerald-700">≈ USD {savingsUSD.toFixed(0)}/mes</p>
          </div>
        </div>
      </div>

      {editing && (
        <BudgetDrawer
          budget={budget}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GoalsClient({
  monthlyReturn,
  monthlyExpenses,
  mep,
  covers,
  unlockRoadmap,
  budgetSavingsUSD,
  budget,
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
          📈 Capital largo plazo
        </button>
      </div>

      {/* ── RENTA TAB ─────────────────────────────────────────── */}
      {tab === "renta" && (
        <div className="space-y-4">
          {/* Presupuesto — fuente de verdad para ahorro mensual */}
          <BudgetSection budget={budget} mep={mep} />

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

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <PortfolioCovers monthly_return_usd={monthlyReturn} items={covers} mep={mep} />
          </div>

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

      {/* ── CAPITAL TAB ───────────────────────────────────────── */}
      {tab === "capital" && (
        <div className="space-y-4">
          <GoalCompliance />
          <CapitalGoals budgetSavingsUSD={budgetSavingsUSD} />
        </div>
      )}
    </div>
  );
}

import { fetchFreedomScore, fetchBudget, fetchGamification } from "@/lib/api";
import { formatUSD, formatARS, freedomColor, formatMonthsToDate } from "@/lib/formatters";
import { RecommendationList } from "@/components/recommendations/RecommendationList";
import { Flame, TrendingUp, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function PortfolioHero({
  monthlyReturn,
  monthlyExpenses,
  covers,
  portfolioTotal,
  freedomPct,
}: {
  monthlyReturn: number;
  monthlyExpenses: number;
  covers: any[];
  portfolioTotal: number;
  freedomPct: number;
}) {
  const coveragePct = monthlyExpenses > 0 ? Math.min(monthlyReturn / monthlyExpenses, 1) : 0;
  const covered = covers.filter((c) => c.status === "covered");
  const partial = covers.find((c) => c.status === "partial");
  const pending = covers.filter((c) => c.status === "pending");
  const nextTarget = partial ?? pending[0];
  const amountNeeded = nextTarget
    ? nextTarget.amount_usd * (1 - (partial?.covered_pct ?? 0))
    : 0;

  // Cumulative USD markers for the bar
  let cumUSD = 0;
  const markers = covers.map((c) => {
    cumUSD += c.amount_usd;
    return cumUSD;
  });

  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Tu portafolio trabaja por vos
          </p>
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-extrabold text-emerald-400">
              +{formatUSD(monthlyReturn)}
            </span>
            <span className="text-sm text-slate-500 mb-1">/mes</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            de {formatUSD(monthlyExpenses)} en gastos ·{" "}
            <span className="text-emerald-500 font-medium">
              {(coveragePct * 100).toFixed(1)}% cubierto
            </span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Freedom</p>
          <p
            className="text-xl font-bold"
            style={{ color: freedomColor(freedomPct) }}
          >
            {(freedomPct * 100).toFixed(1)}%
          </p>
          <p className="text-[9px] text-slate-600">{formatUSD(portfolioTotal)}</p>
        </div>
      </div>

      {/* Barra de progreso con marcadores por categoría */}
      <div className="space-y-1">
        <div className="relative h-5 bg-slate-800 rounded-full overflow-hidden">
          {/* Fill */}
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(coveragePct * 100, 0.3)}%`,
              background: "linear-gradient(90deg, #059669, #34d399)",
            }}
          />
          {/* Separadores de categoría */}
          {markers.map((m, i) => {
            const pct = (m / monthlyExpenses) * 100;
            if (pct >= 100) return null;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-slate-900/50"
                style={{ left: `${pct}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-slate-600">
          <span>$0</span>
          <span>{formatUSD(monthlyExpenses)}/mes</span>
        </div>
      </div>

      {/* Categorías como niveles */}
      <div className="flex flex-wrap gap-1.5">
        {covered.map((c: any, i: number) => (
          <span
            key={i}
            className="flex items-center gap-1 text-[10px] bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 px-2 py-1 rounded-full font-medium"
          >
            ✓ {c.icon} {c.name}
          </span>
        ))}
        {partial && (
          <span className="flex items-center gap-1.5 text-[10px] bg-yellow-950/30 border border-yellow-800/40 text-yellow-400 px-2 py-1 rounded-full">
            {partial.icon} {partial.name}
            <span className="bg-yellow-900/40 px-1 rounded text-[9px]">
              {(partial.covered_pct * 100).toFixed(0)}%
            </span>
          </span>
        )}
        {pending.slice(0, 4).map((c: any, i: number) => (
          <span
            key={i}
            className="flex items-center gap-1 text-[10px] bg-slate-800/60 border border-slate-700/50 text-slate-600 px-2 py-1 rounded-full"
          >
            <Lock size={8} />
            {c.icon} {c.name}
          </span>
        ))}
        {pending.length > 4 && (
          <span className="text-[10px] text-slate-600 px-1 py-1">
            +{pending.length - 4}
          </span>
        )}
      </div>

      {/* Próximo a desbloquear */}
      {nextTarget && (
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-blue-400 font-medium">
              Próximo a desbloquear: {nextTarget.icon} {nextTarget.name}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Faltan{" "}
              <span className="text-white font-semibold">
                {formatUSD(amountNeeded)}/mes
              </span>{" "}
              de rendimiento
            </p>
          </div>
          <Link href="/goals" className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0">
            Ver metas →
          </Link>
        </div>
      )}
    </div>
  );
}

function BudgetFlow({
  income,
  expenses,
  savings,
  savingsUSD,
}: {
  income: number;
  expenses: number;
  savings: number;
  savingsUSD: number;
}) {
  const expPct = income > 0 ? (expenses / income) * 100 : 0;
  const savPct = income > 0 ? (savings / income) * 100 : 0;
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Presupuesto del mes</p>
      <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
        <div className="bg-red-500/70 rounded-l-full" style={{ width: `${expPct}%` }} />
        <div className="bg-emerald-500 rounded-r-full" style={{ width: `${savPct}%` }} />
        <div className="flex-1 bg-slate-700" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Ingreso</p>
          <p className="text-xs font-semibold text-slate-200">{formatARS(income)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Gastos</p>
          <p className="text-xs font-semibold text-red-400">{formatARS(expenses)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">A invertir</p>
          <p className="text-xs font-semibold text-emerald-400">{formatARS(savings)}</p>
          <p className="text-[9px] text-emerald-600">≈ {formatUSD(savingsUSD)}</p>
        </div>
      </div>
    </div>
  );
}

function StreakChip({ current, longest }: { current: number; longest: number }) {
  const badge =
    current >= 12 ? "🌳" :
    current >= 6  ? "🌿" :
    current >= 3  ? "🌱" :
    current >= 1  ? "🔥" : null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Flame size={14} className={current >= 1 ? "text-orange-400" : "text-slate-600"} />
        <div>
          <p className="text-xs font-semibold text-slate-200">
            {current >= 1
              ? `${current} ${current === 1 ? "mes" : "meses"} seguidos`
              : "Sin racha activa"}
            {badge && <span className="ml-1">{badge}</span>}
          </p>
          <p className="text-[10px] text-slate-500">Mejor racha: {longest} meses</p>
        </div>
      </div>
      <Link
        href="/goals"
        className="text-[10px] text-slate-500 hover:text-blue-400 transition-colors"
      >
        Ver calendario →
      </Link>
    </div>
  );
}

export default async function Dashboard() {
  const [score, budget, gamification] = await Promise.all([
    fetchFreedomScore(),
    fetchBudget().catch(() => null),
    fetchGamification(),
  ]);

  const nextMilestone = score.milestones.find((m: any) => !m.reached);
  const incomeARS = budget?.income_monthly_ars ?? 0;
  const expensesARS = budget?.total_monthly_ars ?? 0;
  const savingsARS = budget?.savings_monthly_ars ?? 0;
  const savingsUSD = budget?.savings_monthly_usd ?? 0;

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">BuildFuture</h1>
          <p className="text-xs text-slate-500">Tu camino a la libertad financiera</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
          M
        </div>
      </div>

      {/* Hero — Portafolio vs Gastos */}
      <PortfolioHero
        monthlyReturn={gamification.monthly_return_usd}
        monthlyExpenses={score.monthly_expenses_usd}
        covers={gamification.portfolio_covers}
        portfolioTotal={score.portfolio_total_usd}
        freedomPct={score.freedom_pct}
      />

      {/* Presupuesto del mes */}
      {incomeARS > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <BudgetFlow
            income={incomeARS}
            expenses={expensesARS}
            savings={savingsARS}
            savingsUSD={savingsUSD}
          />
        </div>
      )}

      {/* Racha */}
      <div className="bg-slate-900 rounded-2xl px-4 py-3 border border-slate-800">
        <StreakChip
          current={gamification.streak.current}
          longest={gamification.streak.longest}
        />
      </div>

      {/* Próximo hito */}
      {nextMilestone && (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={13} className="text-blue-400" />
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Próximo hito</p>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: freedomColor(nextMilestone.milestone_pct) }}
              >
                {nextMilestone.milestone_pct * 100}%
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Necesitás {formatUSD(nextMilestone.required_capital_usd)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-200">
                {formatMonthsToDate(nextMilestone.months_to_reach)}
              </p>
              <p className="text-[10px] text-slate-500">{nextMilestone.projected_date}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      <RecommendationList capitalArs={savingsARS > 0 ? Math.round(savingsARS) : 500000} />
    </div>
  );
}

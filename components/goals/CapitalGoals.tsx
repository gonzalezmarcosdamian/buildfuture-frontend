"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, X, Check, Target } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import { formatUSD, formatARS } from "@/lib/formatters";

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
  backing_position_id?: number | null;
  backing_position_ticker?: string | null;
}

interface Position {
  id: number;
  ticker: string;
  asset_type: string;
  current_value_usd: number;
}

const EMOJI_OPTIONS = ["🏠", "🚗", "✈️", "🛡️", "🎓", "💍", "🏖️", "💻", "🎯", "🚀", "⛵", "🏕️"];

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// Currency-aware compact formatter
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

function monthsLabel(m: number | null, hasSavings: boolean): string {
  if (m === null) return hasSavings ? "Calculando…" : "Configurá presupuesto";
  if (m <= 0) return "¡Ya llegaste!";
  if (m < 12) return `${m} meses`;
  const y = Math.floor(m / 12);
  const mo = m % 12;
  return mo > 0 ? `${y}a ${mo}m` : `${y} año${y > 1 ? "s" : ""}`;
}

interface GoalFormState {
  name: string;
  emoji: string;
  target_amount: string; // display value — ARS or USD depending on currency
  target_years: string;
  backing_position_id: number | null;
}

function emptyForm(): GoalFormState {
  return { name: "", emoji: "🎯", target_amount: "", target_years: "10", backing_position_id: null };
}

function formFromGoal(g: CapitalGoalData, currency: "USD" | "ARS", mep: number): GoalFormState {
  const displayAmount = currency === "ARS"
    ? String(Math.round(g.target_usd * mep))
    : String(g.target_usd);
  return {
    name: g.name,
    emoji: g.emoji,
    target_amount: displayAmount,
    target_years: String(g.target_years),
    backing_position_id: g.backing_position_id ?? null,
  };
}

function amountToUSD(raw: string, currency: "USD" | "ARS", mep: number): number {
  const val = parseFloat(raw);
  return currency === "ARS" ? val / mep : val;
}

function GoalForm({
  initial,
  currency,
  mep,
  positions,
  onSave,
  onCancel,
  saving,
}: {
  initial: GoalFormState;
  currency: "USD" | "ARS";
  mep: number;
  positions: Position[];
  onSave: (f: GoalFormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [showEmojis, setShowEmojis] = useState(false);

  function field(key: keyof GoalFormState, val: string | number | null) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const yearsNum = parseInt(form.target_years, 10);
  const yearsValid = !isNaN(yearsNum) && yearsNum >= 1 && yearsNum <= 60;
  const valid = form.name.trim().length > 0 && parseFloat(form.target_amount) > 0 && yearsValid;
  const currencyLabel = currency === "USD" ? "Objetivo (USD)" : "Objetivo (ARS)";
  const currencySymbol = currency === "USD" ? "$" : "$";
  const currencyPlaceholder = currency === "USD" ? "80000" : "114000000";

  // Show secondary hint in the other currency
  const parsedAmount = parseFloat(form.target_amount);
  const hintAmount = !isNaN(parsedAmount) && parsedAmount > 0
    ? currency === "USD"
      ? formatARS(parsedAmount * mep)
      : formatUSD(parsedAmount / mep)
    : null;

  return (
    <div className="bg-bf-surface-2/60 rounded-2xl border border-bf-border-2 p-4 space-y-3">
      {/* Emoji + nombre */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEmojis((v) => !v)}
          className="w-10 h-10 rounded-xl bg-bf-surface-3 flex items-center justify-center text-xl shrink-0 hover:bg-slate-600 transition-colors"
        >
          {form.emoji}
        </button>
        <input
          type="text"
          placeholder="Nombre de la meta"
          value={form.name}
          onChange={(e) => field("name", e.target.value)}
          maxLength={60}
          className="flex-1 bg-bf-surface-3 border border-bf-border-2 rounded-xl px-3 py-2 text-[16px] leading-tight text-bf-text placeholder:text-bf-text-3 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Emoji picker */}
      {showEmojis && (
        <div className="grid grid-cols-6 gap-1.5 p-2 bg-bf-surface-3 rounded-xl">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => { field("emoji", e); setShowEmojis(false); }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors ${
                form.emoji === e ? "bg-blue-600" : "hover:bg-slate-600"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Monto objetivo */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-bf-text-3 mb-1 block">{currencyLabel}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bf-text-3 text-sm">{currencySymbol}</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              placeholder={currencyPlaceholder}
              value={form.target_amount}
              onChange={(e) => field("target_amount", e.target.value)}
              className="w-full bg-bf-surface-3 border border-bf-border-2 rounded-xl pl-7 pr-3 py-2 text-[16px] leading-tight text-bf-text focus:outline-none focus:border-blue-500"
            />
          </div>
          {hintAmount && (
            <p className="text-[9px] text-bf-text-4 mt-1 pl-1">
              ≈ {hintAmount}
            </p>
          )}
        </div>
        <div>
          <label className="text-[10px] text-bf-text-3 mb-1 block">Horizonte (años)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.target_years}
            onChange={(e) => field("target_years", e.target.value)}
            placeholder="10"
            className={`w-full bg-bf-surface-3 border rounded-xl px-3 py-2 text-[16px] leading-tight text-bf-text focus:outline-none ${
              form.target_years && !yearsValid
                ? "border-red-600 focus:border-red-500"
                : "border-bf-border-2 focus:border-blue-500"
            }`}
          />
          {form.target_years && !yearsValid && (
            <p className="text-[9px] text-red-400 mt-1 pl-1">1 a 60 años</p>
          )}
        </div>
      </div>

      {/* Posición de respaldo */}
      {positions.length > 0 && (
        <div>
          <label className="text-[10px] text-bf-text-3 mb-1 block">Posición de respaldo (opcional)</label>
          <select
            value={form.backing_position_id ?? ""}
            onChange={(e) => field("backing_position_id", e.target.value ? Number(e.target.value) : null)}
            className="w-full bg-bf-surface-3 border border-bf-border-2 rounded-xl px-3 py-2 text-sm text-bf-text focus:outline-none focus:border-blue-500"
          >
            <option value="">Sin posición específica</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.ticker} ({p.asset_type}) · USD {p.current_value_usd.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </option>
            ))}
          </select>
          <p className="text-[9px] text-bf-text-4 mt-1 pl-1">
            Si elegís una posición, el progreso se calcula directamente desde su valor actual.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
          disabled={!valid || saving}
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
        >
          <Check size={14} />
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 flex items-center gap-1 bg-bf-surface-3 hover:bg-slate-600 text-bf-text-2 text-sm rounded-xl transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  currency,
  mep,
  onEdit,
  onDelete,
}: {
  goal: CapitalGoalData;
  currency: "USD" | "ARS";
  mep: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const fmt = (usd: number) => fmtCompact(usd, currency, mep);
  const fmtMontly = (usd: number) =>
    currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);

  return (
    <div className="bg-bf-surface rounded-2xl border border-bf-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">{goal.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-bf-text-2">{goal.name}</p>
            <p className="text-xs text-bf-text-3">{fmt(goal.target_usd)} objetivo</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg bg-bf-surface-2 hover:bg-bf-surface-3 flex items-center justify-center transition-colors"
          >
            <Pencil size={12} className="text-bf-text-3" />
          </button>
          {confirmDelete ? (
            <button
              onClick={onDelete}
              className="px-2 h-7 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[10px] font-medium transition-colors"
            >
              ¿Borrar?
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 rounded-lg bg-bf-surface-2 hover:bg-red-900/50 flex items-center justify-center transition-colors"
            >
              <Trash2 size={12} className="text-bf-text-3" />
            </button>
          )}
        </div>
      </div>

      {/* Posición de respaldo */}
      {goal.backing_position_ticker && (
        <div className="flex items-center gap-1.5 text-[10px] text-bf-text-4 bg-bf-surface-2/40 rounded-lg px-2.5 py-1.5">
          <span className="text-bf-text-3">📌</span>
          <span>Respaldado por <span className="font-medium text-bf-text-3">{goal.backing_position_ticker}</span></span>
        </div>
      )}

      {/* Barra de progreso */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-bf-text-3 mb-1.5">
          <span className="text-bf-text-3 font-medium">{fmt(goal.portfolio_usd)} acumulado</span>
          <span className="text-violet-400 font-semibold">{goal.progress_pct}% de {fmt(goal.target_usd)}</span>
        </div>
        <div className="h-3 bg-bf-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${Math.max(2, Math.min(100, goal.progress_pct))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] mt-1">
          <span className="text-bf-text-4">{currency === "USD" ? "$0" : formatARS(0)}</span>
          <span className="text-bf-text-4">{fmt(goal.target_usd)}</span>
        </div>
      </div>

      {/* Tiempo estimado + aporte */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bf-surface-2/60 rounded-xl px-3 py-2.5 text-center">
          <p className="text-sm font-bold text-bf-text leading-tight">
            {goal.progress_pct >= 100 ? "¡Ya llegaste!" : monthsLabel(goal.months_to_goal, goal.monthly_savings_usd > 0)}
          </p>
          <p className="text-[10px] text-bf-text-3 mt-0.5">para llegar</p>
        </div>
        <div className="bg-bf-surface-2/60 rounded-xl px-3 py-2.5 text-center">
          {goal.monthly_savings_usd > 0 ? (
            <>
              <p className="text-sm font-bold text-bf-text">{fmtMontly(goal.monthly_savings_usd)}</p>
              <p className="text-[10px] text-bf-text-3 mt-0.5">/mes del presupuesto</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-bf-text-3">—</p>
              <p className="text-[10px] text-bf-text-4 mt-0.5">sin presupuesto</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CapitalGoals({
  budgetSavingsUSD,
  mep = 1430,
  monthlyExpensesUSD,
}: {
  budgetSavingsUSD?: number | null;
  mep?: number;
  monthlyExpensesUSD?: number | null;
}) {
  const { currency } = useCurrency();
  const [goals, setGoals] = useState<CapitalGoalData[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialForm, setInitialForm] = useState<GoalFormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function fondoReservaForm(): GoalFormState {
    const targetUSD = monthlyExpensesUSD ? Math.round(monthlyExpensesUSD * 3) : 0;
    const displayAmount = currency === "ARS"
      ? String(Math.round(targetUSD * mep))
      : String(targetUSD);
    return { name: "Fondo de reserva", emoji: "🛡️", target_amount: displayAmount, target_years: "1", backing_position_id: null };
  }

  async function fetchGoals() {
    try {
      const token = await getToken();
      const [goalsRes, posRes] = await Promise.all([
        fetch(`${API_URL}/portfolio/capital-goals`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_URL}/positions/active`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (posRes.ok) {
        const all: Position[] = await posRes.json();
        setPositions(all.filter((p) => p.asset_type !== "CASH"));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchGoals(); }, []);

  async function handleCreate(form: GoalFormState) {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/portfolio/capital-goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          emoji: form.emoji,
          target_usd: amountToUSD(form.target_amount, currency, mep),
          target_years: parseInt(form.target_years),
          backing_position_id: form.backing_position_id ?? null,
        }),
      });
      if (!res.ok) return;
      setInitialForm(null);
      await fetchGoals();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: number, form: GoalFormState) {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/portfolio/capital-goals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          emoji: form.emoji,
          target_usd: amountToUSD(form.target_amount, currency, mep),
          target_years: parseInt(form.target_years),
          backing_position_id: form.backing_position_id ?? null,
        }),
      });
      if (!res.ok) return;
      setEditingId(null);
      await fetchGoals();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const token = await getToken();
    const res = await fetch(`${API_URL}/portfolio/capital-goals/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const fmtSavings = (usd: number) =>
    currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);

  if (loading) return <div className="h-32 bg-bf-surface rounded-2xl border border-bf-border animate-pulse" />;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-violet-400" />
          <p className="text-xs font-semibold text-bf-text-2 uppercase tracking-wider">Objetivos de capital</p>
        </div>
        {!initialForm && (
          <button
            onClick={() => setInitialForm(emptyForm())}
            className="flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 bg-violet-950/30 border border-violet-900/50 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Plus size={12} />
            Nueva meta
          </button>
        )}
      </div>

      {/* Contexto: ahorro del presupuesto */}
      {budgetSavingsUSD != null && budgetSavingsUSD > 0 && (
        <div className="bg-bf-surface-2/40 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-sm">💡</span>
          <p className="text-[11px] text-bf-text-3">
            Tu presupuesto libera{" "}
            <span className="text-bf-text-2 font-semibold">{fmtSavings(budgetSavingsUSD)}/mes</span>
            {" "}para invertir — usamos ese número para calcular cuándo llegás.
          </p>
        </div>
      )}

      {/* Formulario de creación */}
      {initialForm && (
        <GoalForm
          initial={initialForm}
          currency={currency}
          mep={mep}
          positions={positions}
          onSave={handleCreate}
          onCancel={() => setInitialForm(null)}
          saving={saving}
        />
      )}

      {/* Recomendación: Fondo de reserva — visible hasta que se crea esa meta específica */}
      {!goals.some((g) => g.name.toLowerCase() === "fondo de reserva" || g.emoji === "🛡️") && !initialForm && (
        <div className="bg-bf-surface rounded-2xl border border-dashed border-violet-900/50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <p className="text-sm font-semibold text-bf-text-2">Fondo de reserva</p>
              <p className="text-[11px] text-bf-text-3">Meta sugerida · 3 meses de gastos</p>
            </div>
            <span className="ml-auto text-xs bg-violet-950/60 text-violet-300 border border-violet-800/50 rounded-lg px-2 py-0.5">Sugerida</span>
          </div>
          <p className="text-[11px] text-bf-text-3 leading-snug">
            Un colchón de emergencias cubre imprevistos sin tocar tus inversiones.{" "}
            {monthlyExpensesUSD != null && monthlyExpensesUSD > 0 ? (
              <>
                Con tus gastos actuales te recomendamos{" "}
                <span className="text-violet-300 font-semibold">
                  USD {Math.round(monthlyExpensesUSD * 3).toLocaleString("es-AR")}
                </span>{" "}
                como punto de partida.
              </>
            ) : (
              <>Configurá tu presupuesto para ver el monto sugerido.</>
            )}
          </p>
          <button
            onClick={() => setInitialForm(fondoReservaForm())}
            className="w-full mt-1 py-2 rounded-xl bg-violet-900/40 hover:bg-violet-900/60 border border-violet-800/50 text-xs font-medium text-violet-300 transition-colors"
          >
            Crear esta meta →
          </button>
        </div>
      )}

      {/* Lista de metas */}
      {goals.length === 0 && !initialForm ? (
        <div className="space-y-3">
          <p className="text-[11px] text-bf-text-3 text-center">¿Cuál es tu meta ahora?</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Path: Generar renta */}
            <button
              onClick={() => setInitialForm({ ...emptyForm(), name: "Libertad financiera", emoji: "💰" })}
              className="bg-emerald-950/30 border border-emerald-900/50 hover:border-emerald-700/60 rounded-2xl p-4 text-left space-y-2 transition-colors"
            >
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-xs font-semibold text-emerald-300">Generar renta</p>
                <p className="text-[10px] text-emerald-400/60 leading-snug mt-0.5">
                  Quiero que mis inversiones paguen mis gastos
                </p>
              </div>
            </button>
            {/* Path: Comprar depto */}
            <button
              onClick={() => setInitialForm({ ...emptyForm(), name: "Mi depto propio", emoji: "🏠" })}
              className="bg-violet-950/30 border border-violet-900/50 hover:border-violet-700/60 rounded-2xl p-4 text-left space-y-2 transition-colors"
            >
              <span className="text-2xl">🏠</span>
              <div>
                <p className="text-xs font-semibold text-violet-300">Comprar un depto</p>
                <p className="text-[10px] text-violet-400/60 leading-snug mt-0.5">
                  Quiero acumular capital para una propiedad
                </p>
              </div>
            </button>
          </div>
          <button
            onClick={() => setInitialForm(emptyForm())}
            className="w-full text-xs font-medium text-bf-text-3 hover:text-bf-text-2 transition-colors py-1"
          >
            + Otra meta personalizada
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) =>
            editingId === g.id ? (
              <GoalForm
                key={g.id}
                initial={formFromGoal(g, currency, mep)}
                currency={currency}
                mep={mep}
                positions={positions}
                onSave={(form) => handleUpdate(g.id, form)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <GoalCard
                key={g.id}
                goal={g}
                currency={currency}
                mep={mep}
                onEdit={() => setEditingId(g.id)}
                onDelete={() => handleDelete(g.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

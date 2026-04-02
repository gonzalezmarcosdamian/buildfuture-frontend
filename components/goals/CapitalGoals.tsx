"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, X, Check, Target } from "lucide-react";

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

const EMOJI_OPTIONS = ["🏠", "🚗", "✈️", "🛡️", "🎓", "💍", "🏖️", "💻", "🎯", "🚀", "⛵", "🏕️"];

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function fmtK(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
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
  target_usd: string;
  target_years: string;
}

const emptyForm = (): GoalFormState => ({ name: "", emoji: "🎯", target_usd: "", target_years: "5" });

function GoalForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: GoalFormState;
  onSave: (f: GoalFormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [showEmojis, setShowEmojis] = useState(false);

  function field(key: keyof GoalFormState, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const valid = form.name.trim().length > 0 && parseFloat(form.target_usd) > 0;

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-4 space-y-3">
      {/* Emoji + nombre */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEmojis((v) => !v)}
          className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-xl shrink-0 hover:bg-slate-600 transition-colors"
        >
          {form.emoji}
        </button>
        <input
          type="text"
          placeholder="Nombre de la meta"
          value={form.name}
          onChange={(e) => field("name", e.target.value)}
          maxLength={60}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Emoji picker */}
      {showEmojis && (
        <div className="grid grid-cols-6 gap-1.5 p-2 bg-slate-700 rounded-xl">
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
          <label className="text-[10px] text-slate-500 mb-1 block">Objetivo (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input
              type="number"
              min={0}
              placeholder="80000"
              value={form.target_usd}
              onChange={(e) => field("target_usd", e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">Horizonte (años)</label>
          <select
            value={form.target_years}
            onChange={(e) => field("target_years", e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          >
            {[1, 2, 3, 5, 7, 10, 15, 20].map((y) => (
              <option key={y} value={y}>{y} año{y > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
      </div>

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
          className="px-4 flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: CapitalGoalData;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Auto-cancel delete confirmation after 3s to avoid accidental tap-away
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">{goal.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-slate-200">{goal.name}</p>
            <p className="text-xs text-slate-500">{fmtK(goal.target_usd)} objetivo</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <Pencil size={12} className="text-slate-400" />
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
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-900/50 flex items-center justify-center transition-colors"
            >
              <Trash2 size={12} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
          <span className="text-slate-400 font-medium">{fmtK(goal.portfolio_usd)} acumulado</span>
          <span className="text-violet-400 font-semibold">{goal.progress_pct}% de {fmtK(goal.target_usd)}</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${Math.max(2, Math.min(100, goal.progress_pct))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] mt-1">
          <span className="text-slate-600">$0</span>
          <span className="text-slate-600">{fmtK(goal.target_usd)}</span>
        </div>
      </div>

      {/* Tiempo estimado + aporte */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 text-center">
          <p className="text-sm font-bold text-slate-100 leading-tight">{monthsLabel(goal.months_to_goal, goal.monthly_savings_usd > 0)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">para llegar</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 text-center">
          {goal.monthly_savings_usd > 0 ? (
            <>
              <p className="text-sm font-bold text-slate-100">${Math.round(goal.monthly_savings_usd).toLocaleString("es-AR")}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">USD/mes del presupuesto</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-500">—</p>
              <p className="text-[10px] text-slate-600 mt-0.5">sin presupuesto</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CapitalGoals({ budgetSavingsUSD }: { budgetSavingsUSD?: number | null }) {
  const [goals, setGoals] = useState<CapitalGoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchGoals() {
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

  useEffect(() => { fetchGoals(); }, []);

  async function handleCreate(form: GoalFormState) {
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${API_URL}/portfolio/capital-goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          emoji: form.emoji,
          target_usd: parseFloat(form.target_usd),
          target_years: parseInt(form.target_years),
        }),
      });
      setCreating(false);
      await fetchGoals();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: number, form: GoalFormState) {
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${API_URL}/portfolio/capital-goals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          emoji: form.emoji,
          target_usd: parseFloat(form.target_usd),
          target_years: parseInt(form.target_years),
        }),
      });
      setEditingId(null);
      await fetchGoals();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const token = await getToken();
    await fetch(`${API_URL}/portfolio/capital-goals/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  if (loading) return <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-violet-400" />
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Objetivos de capital</p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 bg-violet-950/30 border border-violet-900/50 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Plus size={12} />
            Nueva meta
          </button>
        )}
      </div>

      {/* Contexto: ahorro del presupuesto */}
      {budgetSavingsUSD != null && budgetSavingsUSD > 0 && (
        <div className="bg-slate-800/40 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-sm">💡</span>
          <p className="text-[11px] text-slate-400">
            Tu presupuesto libera{" "}
            <span className="text-slate-200 font-semibold">${Math.round(budgetSavingsUSD).toLocaleString("es-AR")} USD/mes</span>
            {" "}para invertir — usamos ese número para calcular cuándo llegás.
          </p>
        </div>
      )}

      {/* Formulario de creación */}
      {creating && (
        <GoalForm
          initial={emptyForm()}
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
          saving={saving}
        />
      )}

      {/* Lista de metas */}
      {goals.length === 0 && !creating ? (
        <div className="bg-slate-900 rounded-2xl border border-dashed border-slate-700 p-6 text-center space-y-2">
          <p className="text-2xl">🎯</p>
          <p className="text-sm font-medium text-slate-300">Sin metas de capital todavía</p>
          <p className="text-xs text-slate-500">Agregá una meta — casa, auto, viaje — y te mostramos cuándo llegás.</p>
          <button
            onClick={() => setCreating(true)}
            className="mt-2 text-xs font-medium text-violet-400 hover:text-violet-300 underline"
          >
            + Agregar primera meta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) =>
            editingId === g.id ? (
              <GoalForm
                key={g.id}
                initial={{
                  name: g.name,
                  emoji: g.emoji,
                  target_usd: String(g.target_usd),
                  target_years: String(g.target_years),
                }}
                onSave={(form) => handleUpdate(g.id, form)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <GoalCard
                key={g.id}
                goal={g}
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

"use client";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import { Loader2, Save, PlusCircle, Trash2, RefreshCw } from "lucide-react";
import { formatARS } from "@/lib/formatters";

// fix iOS zoom: todos los inputs deben tener font-size >= 16px
const INPUT_STYLE = { fontSize: "16px" } as const;

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

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#6B7280", "#EC4899", "#14B8A6"];
const ICONS = [
  // Hogar
  "🏠", "💡", "🔧", "🧹", "🛋️",
  // Comida
  "🛒", "🍽️", "☕", "🍕", "🍺",
  // Transporte
  "🚗", "🚇", "⛽", "✈️", "🚲",
  // Salud
  "💊", "🏋️", "🧴", "🏥", "🦷",
  // Educación y trabajo
  "🎓", "📚", "💻", "📦", "🎯",
  // Entretenimiento
  "🎮", "🎬", "🎵", "🎨", "🎭",
  // Personal
  "👕", "💇", "👶", "🐾", "💍",
  // Dinero y metas
  "💰", "🌱", "🎁", "🏖️", "🛡️",
];

// Descuentos sobre el bruto en Argentina (relación de dependencia)
// Jubilación 11% + Obra social 3% + PAMI 3% + Sindicato ~2% = ~17%
// Ganancias 4a categoría varía — usamos 0% como default (usuario puede ajustar)
const DESCUENTOS_AFIP = 0.17;

function calcNeto(bruto: number, descPct: number) {
  return Math.round(bruto * (1 - descPct));
}

// Formatea enteros ARS con separador de miles (es-AR usa punto)
const fmt = (n: number) => (n > 0 ? Math.round(n).toLocaleString("es-AR") : "");
// Extrae sólo dígitos y convierte a número
const parse = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;

export function BudgetEditor({ initial, onSaved }: { initial: Budget; onSaved?: () => void }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";
  const [useBruto, setUseBruto] = useState(true);
  const [bruto, setBruto] = useState(Math.round(initial.income_monthly_ars / (1 - DESCUENTOS_AFIP)));
  const [descPct, setDescPct] = useState(DESCUENTOS_AFIP);
  const [income, setIncome] = useState(initial.income_monthly_ars);
  const initialIncome = initial.income_monthly_ars;
  const initialSavingsPct = Math.max(0, 1 - initial.categories.reduce((s, c) => s + c.percentage, 0));
  const [fxRate, setFxRate] = useState(initial.fx_rate);
  const [fxSource, setFxSource] = useState("guardado");
  const [fxLoading, setFxLoading] = useState(false);
  const [fxDirty, setFxDirty] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initial.categories);
  const [openEmojiIdx, setOpenEmojiIdx] = useState<number | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshFx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (openEmojiIdx === null) return;
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setOpenEmojiIdx(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openEmojiIdx]);

  async function refreshFx() {
    setFxLoading(true);
    try {
      const res = await fetch(`${API_URL}/budget/fx-rate`);
      const data = await res.json();
      setFxRate(data.fx_rate);
      setFxDirty(true);
      setFxSource(data.source === "fallback" ? "fallback" : `${data.type} · ${data.source}`);
    } finally {
      setFxLoading(false);
    }
  }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const expensesPct = categories.filter(c => !c.is_vacation).reduce((s, c) => s + c.percentage, 0);
  const vacationPct = categories.filter(c => c.is_vacation).reduce((s, c) => s + c.percentage, 0);
  const totalAllocated = expensesPct + vacationPct;
  const savingsPct = Math.max(0, 1 - totalAllocated);
  const savingsARS = income * savingsPct;
  const savingsUSD = savingsARS / fxRate;

  // Keeps each category's ARS amount fixed; recalculates percentages for new income.
  function recalcPcts(newIncome: number, currentIncome: number, cats: Category[]): Category[] {
    if (currentIncome === 0 || newIncome === 0) return cats;
    return cats.map((c) => ({ ...c, percentage: (c.percentage * currentIncome) / newIncome }));
  }

  function maxForCat(idx: number) {
    const otherAllocated = totalAllocated - categories[idx].percentage;
    return Math.min(0.9, Math.max(categories[idx].percentage, 1 - otherAllocated));
  }

  function updateCat(idx: number, field: keyof Category, value: string | number | boolean) {
    setCategories((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  function addCategory() {
    setCategories((prev) => [...prev, {
      name: "Nueva categoría",
      percentage: 0.05,
      icon: "📦",
      color: COLORS[prev.length % COLORS.length],
      is_vacation: false,
    }]);
  }

  function removeCategory(idx: number) {
    setCategories((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data: _s } = await supabase.auth.getSession();
      const _tok = _s.session?.access_token;
      await fetch(`${API_URL}/budget/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(_tok ? { Authorization: `Bearer ${_tok}` } : {}) },
        body: JSON.stringify({ income_monthly_ars: income, fx_rate: fxRate, categories }),
      });
      setSaved(true);
      setFxDirty(false);
      setTimeout(() => { setSaved(false); onSaved?.(); }, 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Ingreso */}
      <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border space-y-4">
        <p className="text-sm font-semibold text-bf-text">Ingresos</p>

        {useBruto ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-bf-text-3 mb-1 block">Sueldo bruto mensual (ARS)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={fmt(bruto)}
                placeholder="800.000"
                onChange={(e) => {
                  const b = parse(e.target.value);
                  const newIncome = calcNeto(b, descPct);
                  setCategories((prev) => recalcPcts(newIncome, income, prev));
                  setBruto(b);
                  setIncome(newIncome);
                }}
                className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2.5 text-[16px] leading-tight text-bf-text focus:outline-none focus:border-blue-500"
                style={INPUT_STYLE}
              />
            </div>
            <div className="bg-bf-surface-2 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-bf-text-3 font-medium">Descuentos sobre el bruto</p>
                <span className="text-xs font-bold text-red-400">-{(descPct * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min={0} max={0.40} step={0.01} value={descPct}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  const newIncome = calcNeto(bruto, d);
                  setCategories((prev) => recalcPcts(newIncome, income, prev));
                  setDescPct(d);
                  setIncome(newIncome);
                }}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-[9px] text-bf-text-3">
                <span>0%</span>
                <span>40% (con Ganancias)</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-bf-text-4 text-center mt-0.5">
                <span>Jub. 11%</span>
                <span>Obra social 3%</span>
                <span>PAMI 3%</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-bf-border-2">
                <span className="text-[10px] text-bf-text-3">Neto estimado</span>
                <span className="text-sm font-bold text-emerald-400">{formatARS(income)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-bf-text-3">→ Para invertir ({(savingsPct * 100).toFixed(0)}%)</span>
                <span className="text-[10px] font-semibold text-emerald-500">{formatARS(savingsARS)}</span>
              </div>
            </div>
            <button
              onClick={() => setUseBruto(false)}
              className="text-[10px] text-bf-text-3 hover:text-bf-text-2 underline underline-offset-2 transition-colors"
            >
              Ya sé mi neto, ingresar directo
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-bf-text-3 mb-1 block">Sueldo neto mensual (ARS)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={fmt(income)}
                placeholder="664.000"
                onChange={(e) => {
                  const newIncome = parse(e.target.value);
                  setCategories((prev) => recalcPcts(newIncome, income, prev));
                  setIncome(newIncome);
                }}
                className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2.5 text-[16px] leading-tight text-bf-text focus:outline-none focus:border-blue-500"
                style={INPUT_STYLE}
              />
            </div>
            <button
              onClick={() => { setUseBruto(true); setBruto(Math.round(income / (1 - descPct))); }}
              className="text-[10px] text-bf-text-3 hover:text-bf-text-2 underline underline-offset-2 transition-colors"
            >
              Calcular desde bruto
            </button>
          </div>
        )}

        {/* MEP */}
        <div className="flex items-center justify-between bg-bf-surface-2 rounded-xl px-3 py-2.5">
          <div>
            <p className="text-[10px] text-bf-text-3">Dólar MEP</p>
            <p className="text-sm font-medium text-bf-text">{fxLoading ? "..." : `$${fxRate.toLocaleString("es-AR")}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-bf-text-3">{fxSource}</span>
            <button onClick={refreshFx} disabled={fxLoading} className="text-bf-text-3 hover:text-blue-400 transition-colors">
              <RefreshCw size={12} className={fxLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-bf-surface-2 rounded-xl p-3">
            <p className="text-[10px] text-bf-text-3">Ingreso</p>
            <p className="text-sm font-bold text-bf-text">{formatARS(income)}</p>
            <p className="text-[10px] text-bf-text-3">USD {(income / fxRate).toFixed(0)}</p>
          </div>
          <div className="bg-bf-surface-2 rounded-xl p-3">
            <p className="text-[10px] text-bf-text-3">Gastos</p>
            <p className="text-sm font-bold text-red-400">{formatARS(income * expensesPct)}</p>
            <p className="text-[10px] text-bf-text-3">{(expensesPct * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-900 rounded-xl p-3">
            <p className="text-[10px] text-emerald-400">Para invertir</p>
            <p className="text-sm font-bold text-emerald-400">{formatARS(savingsARS)}</p>
            <p className="text-[10px] text-emerald-500">USD {savingsUSD.toFixed(0)}/mes</p>
          </div>
        </div>
      </div>

      {/* Barra visual */}
      <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
        {categories.map((c, i) => (
          <div
            key={i}
            style={{ width: `${c.percentage * 100}%`, backgroundColor: c.color }}
            className="transition-all"
          />
        ))}
        <div style={{ width: `${savingsPct * 100}%`, backgroundColor: "#10B981" }} />
      </div>
      <div className="flex flex-wrap gap-2 text-[10px] text-bf-text-3">
        {categories.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.is_vacation ? "#0EA5E9" : c.color }} />
            {c.name}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Inversión
        </span>
      </div>

      {/* Todas las categorías — gastos + vacaciones en un mismo listado */}
      <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border space-y-3">
        <p className="text-sm font-semibold text-bf-text">Distribución</p>

        {totalAllocated >= 1.0 && (
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/60 rounded-xl px-3 py-2">
            <span className="text-sm">🚨</span>
            <p className="text-xs text-red-400 font-medium">Sin capacidad de ahorro — superaste el 100%</p>
          </div>
        )}
        {totalAllocated >= 0.95 && totalAllocated < 1.0 && (
          <div className="flex items-center gap-2 bg-yellow-950/40 border border-yellow-800/60 rounded-xl px-3 py-2">
            <span className="text-sm">⚠️</span>
            <p className="text-xs text-yellow-400 font-medium">
              Capacidad de ahorro muy baja ({(savingsPct * 100).toFixed(0)}%)
            </p>
          </div>
        )}

        <div ref={emojiRef}>
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-2 py-1">

            {/* Emoji picker */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setOpenEmojiIdx(openEmojiIdx === i ? null : i)}
                className="text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bf-surface-3 active:bg-slate-600 transition-colors"
              >
                {cat.icon}
              </button>
              {openEmojiIdx === i && (
                <div className="absolute left-0 top-9 z-50 bg-bf-surface-2 border border-bf-border-2 rounded-xl p-2 grid grid-cols-5 gap-1 shadow-xl shadow-black/40 w-44">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => { updateCat(i, "icon", ic); setOpenEmojiIdx(null); }}
                      className={`text-base w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                        cat.icon === ic ? "bg-blue-600" : "hover:bg-bf-surface-3"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nombre */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={cat.name}
                onChange={(e) => updateCat(i, "name", e.target.value)}
                className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-2 py-1.5 text-[16px] leading-tight text-bf-text focus:outline-none focus:border-blue-500 min-w-0"
                style={INPUT_STYLE}
              />
            </div>

            {/* Slider + ARS input */}
            <div className="flex flex-col gap-1 shrink-0">
              <input
                type="range"
                min={0}
                max={maxForCat(i)}
                step={0.005}
                value={cat.percentage}
                onChange={(e) => updateCat(i, "percentage", Number(e.target.value))}
                className="w-24 accent-blue-500"
              />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-bf-text-3 w-10 text-right tabular-nums">{(cat.percentage * 100).toFixed(0)}%</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fmt(income * cat.percentage)}
                  onChange={(e) => {
                    const ars = parse(e.target.value);
                    const pct = income > 0 ? Math.min(ars / income, maxForCat(i)) : 0;
                    updateCat(i, "percentage", Math.max(0, isNaN(pct) ? 0 : pct));
                  }}
                  className="w-24 bg-bf-surface-2 border border-bf-border-2 rounded px-1 py-0.5 text-bf-text-2 text-right focus:outline-none focus:border-blue-500"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <button onClick={() => removeCategory(i)} className="text-bf-text-4 hover:text-red-400 shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        </div>

        <button
          onClick={addCategory}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <PlusCircle size={13} />
          Agregar categoría
        </button>
      </div>

      {/* Resumen inversión */}
      {(() => {
        const danger = totalAllocated >= 1.0;
        const warn = totalAllocated >= 0.95 && !danger;
        const bg = danger ? "bg-red-950/30 border-red-800/50" : warn ? "bg-yellow-950/30 border-yellow-800/50" : "bg-emerald-950/20 border-emerald-900/50";
        const accent = danger ? "text-red-400" : warn ? "text-yellow-400" : "text-emerald-400";
        const sub = danger ? "text-red-500" : warn ? "text-yellow-500" : "text-emerald-500";
        const muted = danger ? "text-red-700" : warn ? "text-yellow-700" : "text-emerald-600";
        return (
          <div className={`border rounded-2xl p-4 ${bg}`}>
            <p className={`text-xs font-medium mb-2 ${accent}`}>Disponible para invertir</p>
            <p className={`text-3xl font-bold ${accent}`}>{formatARS(savingsARS)}</p>
            <p className={`text-sm mt-1 ${sub}`}>≈ USD {savingsUSD.toFixed(0)} por mes · {(savingsPct * 100).toFixed(0)}% del ingreso</p>
            {!danger && (
              <p className={`text-[10px] mt-2 ${muted}`}>
                En 12 meses: USD {(savingsUSD * 12).toFixed(0)} acumulados (sin rendimiento)
              </p>
            )}
          </div>
        );
      })()}

      {/* Tip educativo: ingreso subió, gastos se mantuvieron */}
      {income > initialIncome && savingsPct > initialSavingsPct && (
        <div className="flex items-start gap-2 bg-emerald-950/30 border border-emerald-900/50 rounded-xl px-3 py-2.5">
          <span className="text-base leading-none shrink-0">📈</span>
          <p className="text-[11px] text-emerald-300 leading-snug">
            Tu ingreso subió <span className="font-semibold">{(((income - initialIncome) / initialIncome) * 100).toFixed(0)}%</span> y tus gastos se mantuvieron
            → tu capacidad de inversión creció <span className="font-semibold">{(((savingsPct - initialSavingsPct) / (initialSavingsPct || 0.01)) * 100).toFixed(0)}%</span>. ¡Bien hecho!
          </p>
        </div>
      )}

      {/* Palanca: impacto de reducir gastos en libertad financiera */}
      {savingsPct > 0.05 && savingsUSD > 50 && (
        <div className="bg-violet-950/20 border border-violet-900/40 rounded-xl px-3 py-2.5 space-y-1">
          <p className="text-[11px] font-semibold text-violet-300">💡 La palanca de los gastos</p>
          <p className="text-[11px] text-violet-300/70 leading-snug">
            Si reducís tus gastos en{" "}
            <span className="font-semibold text-violet-200">USD {Math.round(savingsUSD * 0.1)}/mes</span>
            {" "}tenés dos efectos a la vez: más capital para invertir Y menos meta de libertad financiera.
            El impacto es doble — y se acumula mes a mes.
          </p>
        </div>
      )}

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {fxDirty && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
        {saved ? "Guardado" : saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

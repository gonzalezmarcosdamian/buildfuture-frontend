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

export function BudgetEditor({ initial }: { initial: Budget }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";
  const [useBruto, setUseBruto] = useState(true);
  const [bruto, setBruto] = useState(Math.round(initial.income_monthly_ars / (1 - DESCUENTOS_AFIP)));
  const [descPct, setDescPct] = useState(DESCUENTOS_AFIP);
  const [income, setIncome] = useState(initial.income_monthly_ars);
  const [fxRate, setFxRate] = useState(initial.fx_rate);
  const [fxSource, setFxSource] = useState("guardado");
  const [fxLoading, setFxLoading] = useState(false);
  const [fxDirty, setFxDirty] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initial.categories);
  const [openEmojiIdx, setOpenEmojiIdx] = useState<number | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshFx();
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
  const remainingPct = 1 - totalAllocated; // puede ser negativo si se pasa de 100%

  function maxForCat(idx: number) {
    const otherAllocated = totalAllocated - categories[idx].percentage;
    return Math.min(0.9, Math.max(categories[idx].percentage, 1 - otherAllocated));
  }

  function updateCat(idx: number, field: keyof Category, value: any) {
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
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Ingreso */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4">
        <p className="text-sm font-semibold text-slate-100">Ingresos</p>

        {useBruto ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Sueldo bruto mensual (ARS)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={fmt(bruto)}
                placeholder="800.000"
                onChange={(e) => { const b = parse(e.target.value); setBruto(b); setIncome(calcNeto(b, descPct)); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                style={INPUT_STYLE}
              />
            </div>
            <div className="bg-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-medium">Descuentos sobre el bruto</p>
                <span className="text-xs font-bold text-red-400">-{(descPct * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min={0.10} max={0.35} step={0.01} value={descPct}
                onChange={(e) => { const d = Number(e.target.value); setDescPct(d); setIncome(calcNeto(bruto, d)); }}
                className="w-full accent-red-500"
              />
              <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-500 text-center">
                <span>Jub. 11%</span>
                <span>Obra social 3%</span>
                <span>PAMI 3%</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-700">
                <span className="text-[10px] text-slate-400">Neto estimado</span>
                <span className="text-sm font-bold text-emerald-400">{formatARS(income)}</span>
              </div>
            </div>
            <button
              onClick={() => setUseBruto(false)}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
            >
              Ya sé mi neto, ingresar directo
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Sueldo neto mensual (ARS)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={fmt(income)}
                placeholder="664.000"
                onChange={(e) => setIncome(parse(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                style={INPUT_STYLE}
              />
            </div>
            <button
              onClick={() => { setUseBruto(true); setBruto(Math.round(income / (1 - descPct))); }}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
            >
              Calcular desde bruto
            </button>
          </div>
        )}

        {/* MEP */}
        <div className="flex items-center justify-between bg-slate-800 rounded-xl px-3 py-2.5">
          <div>
            <p className="text-[10px] text-slate-500">Dólar MEP</p>
            <p className="text-sm font-medium text-slate-100">{fxLoading ? "..." : `$${fxRate.toLocaleString("es-AR")}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">{fxSource}</span>
            <button onClick={refreshFx} disabled={fxLoading} className="text-slate-500 hover:text-blue-400 transition-colors">
              <RefreshCw size={12} className={fxLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-500">Ingreso</p>
            <p className="text-sm font-bold text-slate-100">{formatARS(income)}</p>
            <p className="text-[10px] text-slate-500">USD {(income / fxRate).toFixed(0)}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-500">Gastos</p>
            <p className="text-sm font-bold text-red-400">{formatARS(income * expensesPct)}</p>
            <p className="text-[10px] text-slate-500">{(expensesPct * 100).toFixed(0)}%</p>
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
      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
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
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
        <p className="text-sm font-semibold text-slate-100">Distribución</p>

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
                className="text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 active:bg-slate-600 transition-colors"
              >
                {cat.icon}
              </button>
              {openEmojiIdx === i && (
                <div className="absolute left-0 top-9 z-50 bg-slate-800 border border-slate-700 rounded-xl p-2 grid grid-cols-5 gap-1 shadow-xl shadow-black/40 w-44">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => { updateCat(i, "icon", ic); setOpenEmojiIdx(null); }}
                      className={`text-base w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                        cat.icon === ic ? "bg-blue-600" : "hover:bg-slate-700"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 min-w-0"
                style={INPUT_STYLE}
              />
            </div>

            {/* Slider + inputs */}
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
                <input
                  type="text"
                  inputMode="numeric"
                  value={(cat.percentage * 100).toFixed(0)}
                  onChange={(e) => {
                    const v = Math.min(parse(e.target.value) / 100, maxForCat(i));
                    updateCat(i, "percentage", Math.max(0, isNaN(v) ? 0 : v));
                  }}
                  className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-slate-300 text-center focus:outline-none focus:border-blue-500"
                  style={INPUT_STYLE}
                />
                <span className="text-[10px] text-slate-500">%</span>
                <span className="text-[10px] text-slate-500 w-20 text-right tabular-nums">
                  {fmt(income * cat.percentage)}
                </span>
              </div>
            </div>

            <button onClick={() => removeCategory(i)} className="text-slate-600 hover:text-red-400 shrink-0">
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

"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Check, X, ChevronDown, ChevronUp } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

const YIELD_OPTIONS = [
  { label: "Conservador", value: 0.06, desc: "~6% anual (LECAPs, bonos CER)" },
  { label: "Moderado",    value: 0.08, desc: "~8% anual (mix bonos + CEDEAR)" },
  { label: "Crecimiento", value: 0.12, desc: "~12% anual (CEDEAR + ETFs USA)" },
  { label: "Agresivo",    value: 0.16, desc: "~16% anual (ETFs sectoriales)" },
];

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function GoalEditor({ budgetSavingsUSD }: { budgetSavingsUSD?: number | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [savedSavings, setSavedSavings] = useState<number | null>(null);
  const [savedYield, setSavedYield] = useState(0.08);

  const [editSavings, setEditSavings] = useState<string>("");
  const [editYield, setEditYield] = useState(0.08);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/portfolio/goal`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const d = await res.json();
          setSavedSavings(d.monthly_savings_usd);
          setSavedYield(d.target_annual_return_pct ?? 0.08);
          setEditSavings(d.monthly_savings_usd != null ? String(Math.round(d.monthly_savings_usd)) : "");
          setEditYield(d.target_annual_return_pct ?? 0.08);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const effectiveSavings = savedSavings ?? budgetSavingsUSD ?? null;
  const displayedYieldOpt = YIELD_OPTIONS.find((o) => Math.abs(o.value - savedYield) < 0.005)
    ?? YIELD_OPTIONS[1];

  async function handleSave() {
    const val = parseFloat(editSavings);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${API_URL}/portfolio/goal`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ monthly_savings_usd: val, target_annual_return_pct: editYield }),
      });
      setSavedSavings(val);
      setSavedYield(editYield);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="h-24 bg-bf-surface rounded-2xl border border-bf-border animate-pulse" />;

  return (
    <div className="bg-bf-surface rounded-2xl border border-bf-border overflow-hidden">
      {/* Header always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div>
          <p className="text-xs text-bf-text-3 uppercase tracking-wider mb-1">Meta de ahorro</p>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-lg font-bold text-bf-text">
                {effectiveSavings != null
                  ? `$${Math.round(effectiveSavings).toLocaleString("es-AR")} USD/mes`
                  : "Sin configurar"}
              </p>
              <p className="text-[11px] text-bf-text-3">{displayedYieldOpt.label} · {(savedYield * 100).toFixed(2)}% anual</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pencil size={14} className="text-bf-text-3" />
          {open ? <ChevronUp size={16} className="text-bf-text-3" /> : <ChevronDown size={16} className="text-bf-text-3" />}
        </div>
      </button>

      {/* Edit form */}
      {open && (
        <div className="border-t border-bf-border px-4 pb-4 pt-3 space-y-4">
          {/* Ahorro mensual */}
          <div>
            <label className="text-xs text-bf-text-3 mb-1 block">¿Cuánto invertís por mes? (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bf-text-3 text-sm">$</span>
              <input
                type="number"
                min={0}
                value={editSavings}
                onChange={(e) => setEditSavings(e.target.value)}
                placeholder={budgetSavingsUSD != null ? String(Math.round(budgetSavingsUSD)) : "1200"}
                className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl pl-7 pr-3 py-2.5 text-bf-text text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {budgetSavingsUSD != null && (
              <p className="text-[10px] text-bf-text-3 mt-1">
                Tu presupuesto indica ~${Math.round(budgetSavingsUSD).toLocaleString("es-AR")} USD/mes disponibles
              </p>
            )}
          </div>

          {/* Rendimiento objetivo */}
          <div>
            <label className="text-xs text-bf-text-3 mb-2 block">Rendimiento objetivo del portafolio</label>
            <div className="grid grid-cols-2 gap-2">
              {YIELD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEditYield(opt.value)}
                  className={`rounded-xl p-2.5 border text-left transition-all ${
                    Math.abs(editYield - opt.value) < 0.005
                      ? "bg-blue-950/40 border-blue-700 text-blue-300"
                      : "bg-bf-surface-2 border-bf-border-2 text-bf-text-3 hover:border-bf-border-2"
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
            >
              <Check size={14} />
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={() => {
                setEditSavings(savedSavings != null ? String(Math.round(savedSavings)) : "");
                setEditYield(savedYield);
                setOpen(false);
              }}
              className="px-4 flex items-center gap-1 bg-bf-surface-2 hover:bg-bf-surface-3 text-bf-text-3 text-sm rounded-xl transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

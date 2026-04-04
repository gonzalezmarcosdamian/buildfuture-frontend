"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function authFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

export function AddManualPosition() {
  const router = useRouter();

  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");
  const [amount, setAmount] = useState("");
  const [mep, setMep] = useState<number>(1430);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares/bolsa")
      .then((r) => r.json())
      .then((d) => { if (d.venta) setMep(parseFloat(d.venta)); })
      .catch(() => {});
  }, []);

  async function save() {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    setSaving(true);
    setError("");
    try {
      const isARS = currency === "ARS";
      const qtyUsd = isARS ? num / mep : num;
      const body = {
        asset_type: "CASH",
        ticker: isARS ? "CASH_ARS" : "CASH_USD",
        description: isARS ? "Efectivo en pesos" : "Efectivo en dólares",
        quantity: qtyUsd,
        purchase_price_usd: 1.0,
        ppc_ars: isARS ? num : 0,
        purchase_fx_rate: isARS ? mep : 0,
        external_id: null,
        fci_categoria: null,
        manual_yield_pct: null,
      };
      const res = await authFetch("/positions/manual", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || `Error ${res.status}`);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/portfolio"), 1500);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <CheckCircle2 size={40} className="text-emerald-400" />
        <p className="text-sm font-semibold text-bf-text">Efectivo agregado</p>
        <p className="text-xs text-bf-text-3">Redirigiendo al portafolio…</p>
      </div>
    );
  }

  const amountNum = parseFloat(amount);
  const usdEquiv = currency === "ARS" && amountNum > 0 ? amountNum / mep : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-bf-text">Agregar efectivo</h1>
        <p className="text-xs text-bf-text-3 mt-0.5">Dólares o pesos en mano / caja de ahorro</p>
      </div>

      {/* Selector de moneda */}
      <div className="flex gap-2">
        <button
          onClick={() => setCurrency("USD")}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
            currency === "USD"
              ? "bg-blue-600 text-white"
              : "bg-bf-surface border border-bf-border text-bf-text-3 hover:border-bf-border-2"
          }`}
        >
          USD
        </button>
        <button
          onClick={() => setCurrency("ARS")}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
            currency === "ARS"
              ? "bg-blue-600 text-white"
              : "bg-bf-surface border border-bf-border text-bf-text-3 hover:border-bf-border-2"
          }`}
        >
          ARS
        </button>
      </div>

      {/* Monto */}
      <div>
        <label className="text-xs text-bf-text-3 mb-1.5 block">
          {currency === "USD" ? "Monto en dólares" : "Monto en pesos"}
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder="0"
          min="0"
          step="any"
          autoFocus
          className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl px-4 py-3 text-bf-text text-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
        {usdEquiv !== null && (
          <p className="text-[11px] text-bf-text-4 mt-1.5 px-1">
            ≈ USD {usdEquiv.toLocaleString("es-AR", { maximumFractionDigits: 2 })} · MEP ${mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving || !amount || parseFloat(amount) <= 0}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? "Guardando..." : "Agregar al portafolio"}
      </button>
    </div>
  );
}

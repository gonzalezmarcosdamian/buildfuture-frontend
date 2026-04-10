"use client";
import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props {
  onSuccess: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

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

export function ConnectBinanceForm({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function reset() {
    setApiKey(""); setSecretKey("");
    setError(""); setSuccess("");
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim() || !secretKey.trim()) {
      setError("API Key y Secret Key son requeridos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/integrations/binance/connect", {
        method: "POST",
        body: JSON.stringify({ api_key: apiKey.trim(), secret_key: secretKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Error al conectar con Binance.");
        return;
      }
      setSuccess(`✓ Conectado. ${data.positions_synced} posiciones sincronizadas.`);
      setTimeout(() => { onSuccess(); reset(); setOpen(false); }, 1500);
    } catch {
      setError("Error de red. Verificá tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-xs font-medium text-yellow-400 hover:text-yellow-300 border border-yellow-900/40 hover:border-yellow-700/60 bg-yellow-950/20 hover:bg-yellow-950/40 rounded-xl px-4 py-2.5 transition-all"
      >
        Conectar Binance
      </button>
    );
  }

  return (
    <form onSubmit={handleConnect} className="space-y-3 pt-1">
      {/* Badge auto-sync */}
      <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 bg-yellow-950/30 border border-yellow-900/30 rounded-lg px-2.5 py-1.5">
        <Zap size={10} className="shrink-0" />
        <span>Auto-sync habilitado — no requiere 2FA</span>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-[10px] text-bf-text-3 mb-1">API Key</label>
        <input
          type="text"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="N5XLPiPlZk..."
          className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2 text-[16px] leading-tight text-bf-text-2 placeholder:text-bf-text-4 focus:outline-none focus:border-yellow-700"
          autoComplete="off"
        />
      </div>

      {/* Secret Key */}
      <div>
        <label className="block text-[10px] text-bf-text-3 mb-1">Secret Key</label>
        <div className="relative">
          <input
            type={showSecret ? "text" : "password"}
            value={secretKey}
            onChange={e => setSecretKey(e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2 pr-9 text-[16px] leading-tight text-bf-text-2 placeholder:text-bf-text-4 focus:outline-none focus:border-yellow-700"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowSecret(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-bf-text-3 hover:text-bf-text-2"
          >
            {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </div>

      {/* Instrucción seguridad */}
      <div className="flex items-start gap-2 bg-emerald-950/30 border border-emerald-900/40 rounded-xl px-3 py-2.5">
        <ShieldCheck size={13} className="text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-emerald-300">
            Creá la API Key con solo <span className="text-yellow-400">&quot;Enable Reading&quot;</span>
          </p>
          <p className="text-[10px] text-emerald-400/70 leading-snug">
            En Binance: <span className="text-emerald-300 font-medium">Perfil → Gestión de API → Crear API</span>.
            Activá únicamente &quot;Enable Reading&quot; — sin trading, sin withdrawals. Con ese scope, nadie puede operar aunque la key sea comprometida.
          </p>
        </div>
      </div>

      {/* Error / éxito */}
      {error && (
        <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 rounded-lg px-3 py-2">
          <CheckCircle2 size={12} />
          {success}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          className="flex-1 text-xs text-bf-text-3 hover:text-bf-text-2 border border-bf-border-2 rounded-lg py-2 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !apiKey || !secretKey}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-yellow-600 hover:bg-yellow-500 disabled:bg-bf-surface-3 disabled:text-bf-text-3 text-white rounded-lg py-2 transition-colors"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
          {loading ? "Conectando..." : "Conectar"}
        </button>
      </div>
    </form>
  );
}

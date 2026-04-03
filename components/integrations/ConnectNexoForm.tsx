"use client";
import { supabase } from "@/lib/supabase";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";
import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  onSuccess: () => void;
}

export function ConnectNexoForm({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data: _s } = await supabase.auth.getSession();
      const _tok = _s.session?.access_token;
      const res = await fetch(`${API_URL}/integrations/nexo/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(_tok ? { Authorization: `Bearer ${_tok}` } : {}) },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Error al conectar");
        return;
      }

      setSuccess(data.message);
      setTimeout(() => {
        setOpen(false);
        setApiKey("");
        setApiSecret("");
        setSuccess("");
        onSuccess();
      }, 1500);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        Conectar Nexo
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-bf-text-3">
        Solo necesitás permisos de <strong>lectura</strong>. Creá la API key en{" "}
        <span className="text-blue-400">pro.nexo.com → API</span>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-bf-text-3 mb-1 block">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            autoComplete="off"
            required
            className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2.5 text-[16px] leading-tight text-bf-text placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-bf-text-3 mb-1 block">API Secret</label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2.5 pr-10 text-[16px] leading-tight text-bf-text placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bf-text-3 hover:text-bf-text-2"
            >
              {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
            <AlertCircle size={13} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-lg px-3 py-2">
            <CheckCircle2 size={13} />
            {success}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(""); }}
            className="flex-1 py-2.5 rounded-xl text-sm text-bf-text-3 bg-bf-surface-2 hover:bg-bf-surface-3 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !apiKey || !apiSecret}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Conectando..." : "Conectar"}
          </button>
        </div>
      </form>
    </div>
  );
}

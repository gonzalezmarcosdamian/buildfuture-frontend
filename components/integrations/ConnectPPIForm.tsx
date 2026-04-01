"use client";
import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
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

interface PPIAccount {
  accountNumber?: string;
  number?: string;
  description?: string;
  name?: string;
}

export function ConnectPPIForm({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [accounts, setAccounts] = useState<PPIAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchAccounts() {
    if (!publicKey || !privateKey) return;
    setLoadingAccounts(true);
    setError("");
    try {
      const res = await authFetch(
        `/integrations/ppi/accounts?public_key=${encodeURIComponent(publicKey)}&private_key=${encodeURIComponent(privateKey)}`
      );
      if (res.ok) {
        const data = await res.json();
        const list: PPIAccount[] = data.accounts || [];
        setAccounts(list);
        // Auto-seleccionar si hay una sola cuenta
        if (list.length === 1) {
          setAccountNumber(String(list[0].accountNumber ?? list[0].number ?? ""));
        }
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || "No se pudieron cargar las cuentas");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch("/integrations/ppi/connect", {
        method: "POST",
        body: JSON.stringify({
          public_key: publicKey,
          private_key: privateKey,
          account_number: accountNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Error al conectar");
        return;
      }

      setSuccess(data.message);
      setTimeout(() => {
        setOpen(false);
        setPublicKey("");
        setPrivateKey("");
        setAccountNumber("");
        setAccounts([]);
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
        className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        Conectar Portfolio Personal
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-slate-400">
        Generá tus claves en PPI →{" "}
        <span className="text-slate-300 font-medium">Gestiones → API</span>.
        Solo lectura — BuildFuture nunca opera en tu nombre.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Public key */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Clave pública (Public Key)</label>
          <input
            type="text"
            value={publicKey}
            onChange={(e) => { setPublicKey(e.target.value); setAccounts([]); setAccountNumber(""); }}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            autoComplete="off"
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Private key */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Clave privada (Private Key)</label>
          <div className="relative">
            <input
              type={showPrivateKey ? "text" : "password"}
              value={privateKey}
              onChange={(e) => { setPrivateKey(e.target.value); setAccounts([]); setAccountNumber(""); }}
              placeholder="••••••••••••••••••••••••"
              autoComplete="new-password"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPrivateKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Account number: buscar o escribir manualmente */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-400">Número de cuenta</label>
            {publicKey && privateKey && accounts.length === 0 && (
              <button
                type="button"
                onClick={fetchAccounts}
                disabled={loadingAccounts}
                className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
              >
                {loadingAccounts
                  ? <Loader2 size={10} className="animate-spin" />
                  : <ChevronDown size={10} />
                }
                {loadingAccounts ? "Cargando..." : "Buscar cuentas"}
              </button>
            )}
          </div>

          {accounts.length > 0 ? (
            <select
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="">— Seleccioná una cuenta —</option>
              {accounts.map((acc) => {
                const num = String(acc.accountNumber ?? acc.number ?? "");
                const label = acc.description ?? acc.name ?? num;
                return (
                  <option key={num} value={num}>
                    {num}{label && label !== num ? ` · ${label}` : ""}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Ej: 12345678"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          )}
          <p className="text-[10px] text-slate-600 mt-1">
            Podés obtenerlo desde PPI o usando el botón &quot;Buscar cuentas&quot; arriba.
          </p>
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
            onClick={() => { setOpen(false); setError(""); setAccounts([]); }}
            className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !publicKey || !privateKey || !accountNumber}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Conectando..." : "Conectar"}
          </button>
        </div>
      </form>
    </div>
  );
}

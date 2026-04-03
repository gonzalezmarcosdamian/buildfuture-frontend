"use client";
import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Zap, RefreshCw } from "lucide-react";
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

type Step = "credentials" | "code";

export function ConnectCocosForm({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("credentials");

  // Paso 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [showTotpSecret, setShowTotpSecret] = useState(false);

  // Paso 2
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function reset() {
    setStep("credentials");
    setEmail(""); setPassword(""); setCode(""); setTotpSecret("");
    setError(""); setSuccess("");
  }

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/integrations/cocos/save-credentials", {
        method: "POST",
        body: JSON.stringify({ email, password, totp_secret: totpSecret }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Error al guardar las credenciales");
        return;
      }
      setStep("code");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authFetch("/integrations/cocos/connect", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Código incorrecto o expirado. Ingresá un código nuevo.");
        setCode("");
        return;
      }

      setSuccess(data.message);
      setTimeout(() => {
        setOpen(false);
        reset();
        onSuccess();
      }, 1800);
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
        className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        Conectar Cocos Capital
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-bf-text-3">
        Usamos tus credenciales solo para leer tu portafolio. Nunca operamos en tu nombre.
      </p>

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2">
        {(["credentials", "code"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              step === s ? "bg-orange-600 text-white" :
              (step === "code" && s === "credentials") ? "bg-emerald-700 text-white" :
              "bg-bf-surface-3 text-bf-text-3"
            }`}>
              {step === "code" && s === "credentials" ? "✓" : i + 1}
            </div>
            <span className={`text-[10px] ${step === s ? "text-bf-text-2" : "text-bf-text-4"}`}>
              {s === "credentials" ? "Credenciales" : "Verificar 2FA"}
            </span>
            {i === 0 && <div className="w-4 h-px bg-bf-surface-3" />}
          </div>
        ))}
      </div>

      {step === "credentials" && (
        <form onSubmit={handleSaveCredentials} className="space-y-3">
          <div>
            <label className="text-xs text-bf-text-3 mb-1 block">Email Cocos</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="off"
              required
              className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2.5 text-[16px] leading-tight text-bf-text placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-bf-text-3 mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2.5 pr-10 text-[16px] leading-tight text-bf-text placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-bf-text-3 hover:text-bf-text-2"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* TOTP secret — opcional, va junto a las credenciales */}
          <div className="bg-bf-surface-2/50 border border-bf-border-2/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className={totpSecret ? "text-yellow-400" : "text-bf-text-3"} />
                <span className="text-[11px] font-medium text-bf-text-2">Auto-sync</span>
                <span className="text-[10px] text-bf-text-3">(opcional)</span>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                totpSecret ? "bg-yellow-900/40 text-yellow-400" : "bg-bf-surface-3 text-bf-text-3"
              }`}>
                {totpSecret ? "habilitado" : "manual"}
              </span>
            </div>
            <div className="relative">
              <input
                type={showTotpSecret ? "text" : "password"}
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value.trim())}
                placeholder="BASE32SECRET (ej: JBSWY3DPEHPK3PXP)"
                autoComplete="off"
                className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2 pr-10 text-[16px] leading-tight text-bf-text placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowTotpSecret(!showTotpSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-bf-text-3 hover:text-bf-text-2"
              >
                {showTotpSecret ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <p className="text-[10px] text-bf-text-4 leading-relaxed">
              Lo obtenés reescaneando el QR en{" "}
              <span className="text-bf-text-3">Cocos → Seguridad → Autenticación en 2 pasos</span>.
              Sin esto, vas a necesitar ingresar el código manualmente cada vez que sincronices.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); reset(); }}
              className="flex-1 py-2.5 rounded-xl text-sm text-bf-text-3 bg-bf-surface-2 hover:bg-bf-surface-3 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Guardando..." : "Siguiente"}
            </button>
          </div>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleConnect} className="space-y-3">
          <div>
            <label className="text-xs text-bf-text-3 mb-1 block">
              Código de Google Authenticator
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              required
              className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2.5 text-[16px] leading-tight text-bf-text placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors tracking-widest font-mono"
            />
            <p className="text-[10px] text-bf-text-4 mt-1">
              Si el código expiró, abrí Google Authenticator y copiá el nuevo código de 6 dígitos.
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
              onClick={() => { setStep("credentials"); setError(""); setCode(""); }}
              className="flex-1 py-2.5 rounded-xl text-sm text-bf-text-3 bg-bf-surface-2 hover:bg-bf-surface-3 transition-colors"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Conectando..." : "Conectar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


// ── Modal sync manual (cuando conectado sin TOTP secret) ─────────────────────

interface SyncModalProps {
  onSync: (code: string) => Promise<void>;
  onClose: () => void;
}

export function CocosSyncModal({ onSync, onClose }: SyncModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSync(code);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al sincronizar");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-bf-surface border border-bf-border-2 rounded-2xl p-5 w-full max-w-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/50 border border-orange-900 flex items-center justify-center shrink-0">
            <RefreshCw size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-bf-text">Sincronizar Cocos</p>
            <p className="text-xs text-bf-text-3 mt-0.5">Ingresá el código de Google Authenticator</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            required
            className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl px-4 py-3 text-center text-xl font-mono text-bf-text placeholder-slate-600 focus:outline-none focus:border-orange-500 tracking-widest transition-colors"
          />

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-bf-text-3 bg-bf-surface-2 hover:bg-bf-surface-3 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Sincronizando..." : "Sync"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

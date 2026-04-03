"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register" | "forgot";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [splash, setSplash] = useState(false);

  // Mostrar error si el callback de Supabase falló (link inválido o expirado)
  useEffect(() => {
    if (searchParams.get("error") === "link_invalido") {
      setError("El link es inválido o ya expiró. Solicitá uno nuevo.");
    }
  }, [searchParams]);

  function changeMode(nextMode: Mode) {
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
    setMode(nextMode);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        setSplash(true);
        setTimeout(() => router.push("/dashboard"), 1400);

      } else if (mode === "register") {
        if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
        if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Supabase redirige al callback que confirma el email y luego va al dashboard
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) { setError(error.message); return; }
        setSuccess("Cuenta creada. Revisá tu email para confirmar.");

      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          // El callback intercambia el code PKCE y redirige al formulario de reset
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        });
        if (error) { setError(error.message); return; }
        setSuccess("Te enviamos un email para restablecer tu contraseña.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (splash) return (
    <div className="fixed inset-0 z-[999] bg-bf-page flex flex-col items-center justify-center gap-5 animate-in fade-in duration-300">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold text-bf-text tracking-tight">BuildFuture</h1>
        <p className="text-bf-text-3 text-sm">Preparando tu portafolio…</p>
      </div>
      <div className="w-48 h-0.5 bg-bf-surface-2 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-[progress_1.2s_ease-out_forwards]" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bf-page flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-bf-text">BuildFuture</h1>
          <p className="text-bf-text-3 text-sm mt-1">Tu portafolio de libertad financiera</p>
        </div>

        {/* Tab switcher — solo en login/register */}
        {mode !== "forgot" && (
          <div className="flex bg-bf-surface-2 rounded-xl p-1 mb-4 gap-1">
            <button
              onClick={() => changeMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "login" ? "bg-bf-surface-3 text-bf-text" : "text-bf-text-3 hover:text-bf-text-2"
              }`}
            >
              Ingresar
            </button>
            <button
              onClick={() => changeMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "register" ? "bg-bf-surface-3 text-bf-text" : "text-bf-text-3 hover:text-bf-text-2"
              }`}
            >
              Registrarse
            </button>
          </div>
        )}

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-bf-surface rounded-2xl p-6 border border-bf-border space-y-4"
        >
          {mode === "forgot" && (
            <p className="text-sm text-bf-text-2 font-medium">Recuperar contraseña</p>
          )}

          {/* Email */}
          <div>
            <label className="text-xs text-bf-text-3 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2 text-bf-text text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Password — solo en login y register */}
          {mode !== "forgot" && (
            <div>
              <label className="text-xs text-bf-text-3 mb-1 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2 pr-10 text-bf-text text-sm focus:outline-none focus:border-blue-500 transition-colors"
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
          )}

          {/* Confirmar password — solo en register */}
          {mode === "register" && (
            <div>
              <label className="text-xs text-bf-text-3 mb-1 block">Confirmar contraseña</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-lg px-3 py-2 text-bf-text text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading
              ? "..."
              : mode === "login"
              ? "Ingresar"
              : mode === "register"
              ? "Crear cuenta"
              : "Enviar email"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => changeMode("forgot")}
              className="w-full text-xs text-bf-text-3 hover:text-bf-text-3 text-center transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => changeMode("login")}
              className="w-full text-xs text-bf-text-3 hover:text-bf-text-3 text-center transition-colors"
            >
              Volver a ingresar
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// useSearchParams requiere Suspense en Next.js App Router
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register" | "forgot" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [splash, setSplash] = useState(false);

  // Detect Supabase recovery session (from password-reset email link)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setError("");
        setSuccess("");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  function reset(nextMode: Mode) {
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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { setError(error.message); return; }
        setSuccess("Cuenta creada. Revisá tu email para confirmar.");

      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) { setError(error.message); return; }
        setSuccess("Te enviamos un email para restablecer tu contraseña.");

      } else if (mode === "reset") {
        if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
        if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) { setError(error.message); return; }
        setSuccess("Contraseña actualizada correctamente.");
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  const isResetMode = mode === "reset";

  if (splash) return (
    <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col items-center justify-center gap-5 animate-in fade-in duration-300">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">BuildFuture</h1>
        <p className="text-slate-500 text-sm">Preparando tu portafolio…</p>
      </div>
      <div className="w-48 h-0.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-[progress_1.2s_ease-out_forwards]" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100">BuildFuture</h1>
          <p className="text-slate-500 text-sm mt-1">Tu portafolio de libertad financiera</p>
        </div>

        {/* Tab switcher — hidden in reset/forgot modes */}
        {!isResetMode && mode !== "forgot" && (
          <div className="flex bg-slate-800 rounded-xl p-1 mb-4 gap-1">
            <button
              onClick={() => reset("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "login" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Ingresar
            </button>
            <button
              onClick={() => reset("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "register" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Registrarse
            </button>
          </div>
        )}

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4"
        >
          {/* Title for special modes */}
          {mode === "forgot" && (
            <p className="text-sm text-slate-300 font-medium">Recuperar contraseña</p>
          )}
          {mode === "reset" && (
            <div>
              <p className="text-sm text-slate-300 font-medium">Nueva contraseña</p>
              <p className="text-xs text-slate-500 mt-0.5">Ingresá tu nueva contraseña para continuar.</p>
            </div>
          )}

          {/* Email — not shown in reset mode */}
          {!isResetMode && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {/* Password — login, register, reset */}
          {mode !== "forgot" && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                {isResetMode ? "Nueva contraseña" : "Contraseña"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-10 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm password — register + reset */}
          {(mode === "register" || isResetMode) && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Confirmar contraseña</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-lg px-3 py-2">
              <CheckCircle2 size={13} />
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "..." : mode === "login"
              ? "Ingresar"
              : mode === "register"
              ? "Crear cuenta"
              : mode === "forgot"
              ? "Enviar email"
              : "Guardar nueva contraseña"}
          </button>

          {/* Forgot link — login only */}
          {mode === "login" && (
            <button
              type="button"
              onClick={() => reset("forgot")}
              className="w-full text-xs text-slate-500 hover:text-slate-400 text-center transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {/* Back link — forgot only */}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => reset("login")}
              className="w-full text-xs text-slate-500 hover:text-slate-400 text-center transition-colors"
            >
              Volver a ingresar
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

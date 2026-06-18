"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Loader2 } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Muestra un splash al instante cuando se toca "Ingresar". Da feedback
  // inmediato (no se vuelve a tocar) mientras navega a /login. No prevenimos
  // la navegación: el <a>/Link sigue su curso y el splash cubre la pantalla
  // hasta que /login renderiza.
  const enter = () => setEntering(true);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-0.5">
            <span className="text-lg font-extrabold text-slate-100 tracking-tight">Build</span>
            <span className="text-lg font-extrabold text-emerald-400 tracking-tight">Future</span>
          </Link>

          {/* Right side: login siempre visible + hamburguesa en mobile */}
          <div className="flex items-center gap-1">
            {/* Desktop: link discreto */}
            <Link
              href="/login"
              onClick={enter}
              className="hidden sm:block text-sm text-slate-500 hover:text-slate-300 transition-colors px-3 py-2"
            >
              ¿Ya tenés acceso? →
            </Link>

            {/* Mobile: botón Ingresar visible — 1 tap, sin abrir el menú.
                <a> nativo (no <Link>): navega al primer tap aunque la landing
                todavía no haya hidratado.
                Botón con área táctil ≥44px + splash al tocar. */}
            <a
              href="/login"
              onClick={enter}
              className="sm:hidden flex items-center min-h-[44px] px-4 rounded-xl text-sm font-bold text-slate-950 bg-emerald-500 active:bg-emerald-600 active:scale-95 transition-all"
            >
              Ingresar
            </a>

            {/* Mobile hamburger — área táctil ≥44px */}
            <button
              className="sm:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-slate-400 active:text-slate-100 active:scale-95 transition-all"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menú"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 sm:hidden">
          <Link
            href="/"
            className="flex items-center gap-0.5 mb-8"
            onClick={() => setMobileOpen(false)}
          >
            <span className="text-2xl font-extrabold text-slate-100">Build</span>
            <span className="text-2xl font-extrabold text-emerald-400">Future</span>
          </Link>
          <Link
            href="/login"
            onClick={() => { setMobileOpen(false); enter(); }}
            className="flex items-center min-h-[44px] px-6 rounded-xl text-base font-bold text-slate-950 bg-emerald-500 active:bg-emerald-600 active:scale-95 transition-all"
          >
            Ingresar
          </Link>
        </div>
      )}

      {/* Splash de entrada — feedback inmediato al tocar Ingresar */}
      {entering && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center gap-5">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-slate-100">Build</span>
              <span className="text-emerald-400">Future</span>
            </h1>
            <p className="text-sm text-slate-400">Entrando…</p>
          </div>
          <Loader2 size={22} className="text-emerald-400 animate-spin" />
        </div>
      )}
    </>
  );
}

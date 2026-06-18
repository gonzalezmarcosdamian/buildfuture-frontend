"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
              className="hidden sm:block text-sm text-slate-500 hover:text-slate-300 transition-colors px-3 py-2"
            >
              ¿Ya tenés acceso? →
            </Link>

            {/* Mobile: botón Ingresar visible — 1 tap, sin abrir el menú.
                <a> nativo (no <Link>): navega al primer tap aunque la landing
                todavía no haya hidratado.
                Botón con área táctil ≥44px (antes 36px → se fallaba el toque) +
                feedback inmediato (active:) para que se note que registró el tap. */}
            <a
              href="/login"
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
            className="text-lg text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            ¿Ya tenés acceso? →
          </Link>
        </div>
      )}
    </>
  );
}

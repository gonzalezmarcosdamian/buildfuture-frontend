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

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-slate-100 transition-colors px-3 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl transition-colors"
            >
              Crear cuenta gratis →
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden text-slate-400 hover:text-slate-100 transition-colors p-1"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
            className="text-lg text-slate-300 hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="text-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-2xl transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Crear cuenta gratis →
          </Link>
        </div>
      )}
    </>
  );
}

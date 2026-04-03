"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useState } from "react";

const STORAGE_KEY = "bf_cookie_consent";

const subscribe = () => () => {};
const getSnapshot = () => typeof window !== "undefined" ? !localStorage.getItem(STORAGE_KEY) : false;
const getServerSnapshot = () => false;

export function CookieBanner() {
  const shouldShow = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  const visible = shouldShow && !dismissed;

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setDismissed(true);
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setDismissed(true);
    // Vercel Analytics respeta la variable global window.va = 0
    if (typeof window !== "undefined") {
      (window as Window & { va?: number }).va = 0;
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/40 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-[13px] text-slate-400 leading-relaxed flex-1">
          Usamos cookies analíticas (Vercel Analytics) para mejorar la experiencia.
          No compartimos datos personales con terceros.{" "}
          <Link href="/legal#cookies" className="text-slate-300 underline hover:text-emerald-400 transition-colors">
            Política de cookies
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-[13px] text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-[13px] font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8008";

interface Props {
  version: string;
  summary: string | null;
  onAccepted: () => void;
}

export function TosModal({ version, summary, onAccepted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setLoading(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch(`${API_URL}/tos/accept`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al guardar aceptación");
      onAccepted();
    } catch {
      setError("No pudimos guardar tu aceptación. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Overlay no clickeable — bloqueante */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md bg-bf-surface border border-bf-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-bf-border">
          <p className="text-[10px] text-bf-text-3 uppercase tracking-wider mb-1">
            Términos y Condiciones · v{version}
          </p>
          <h2 className="text-lg font-bold text-bf-text">Antes de continuar</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {summary && (
            <div className="bg-bf-surface-2 rounded-xl px-4 py-3">
              <p className="text-xs text-bf-text-3 font-semibold uppercase tracking-wider mb-1">
                ¿Qué cambió?
              </p>
              <p className="text-sm text-bf-text-2">{summary}</p>
            </div>
          )}

          <p className="text-sm text-bf-text-2 leading-relaxed">
            Para usar BuildFuture necesitás aceptar nuestros{" "}
            <Link href="/legal" target="_blank" className="text-emerald-400 underline hover:text-emerald-300">
              Términos y Condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/legal#privacidad" target="_blank" className="text-emerald-400 underline hover:text-emerald-300">
              Política de Privacidad
            </Link>
            .
          </p>

          <p className="text-xs text-bf-text-3 leading-relaxed">
            BuildFuture no brinda asesoramiento financiero. Las sugerencias son
            orientativas y no constituyen recomendación de inversión en los términos de
            la Ley 26.831. Sos responsable de tus decisiones de inversión.
          </p>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Guardando…" : "Acepto los Términos y Condiciones"}
          </button>
        </div>
      </div>
    </div>
  );
}

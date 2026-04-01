"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

interface Props {
  /** Providers ALYC conectados, ej: ["IOL", "PPI"]. Si hay uno solo, el label es específico. */
  connectedProviders: string[];
}

export function SyncButton({ connectedProviders }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  const label = connectedProviders.length === 1
    ? `Sync ${connectedProviders[0]}`
    : "Sync todo";

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setOk(false);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // Sincronizar todos los proveedores en paralelo
      const results = await Promise.allSettled(
        connectedProviders.map((provider) =>
          fetch(`${API_URL}/integrations/${provider.toLowerCase()}/sync`, {
            method: "POST",
            headers,
          })
        )
      );

      const anyError = results.find(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)
      );

      if (anyError) {
        if (anyError.status === "fulfilled") {
          const d = await anyError.value.json().catch(() => ({}));
          setError(d.detail || `Error ${anyError.value.status}`);
        } else {
          setError("No se pudo conectar con el servidor");
        }
        setTimeout(() => setError(null), 4000);
      } else {
        setOk(true);
        router.refresh();
        setTimeout(() => setOk(false), 3000);
      }
    } catch {
      setError("Sin conexión");
      setTimeout(() => setError(null), 4000);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
          ok
            ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
            : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
        } disabled:opacity-50`}
      >
        <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Sincronizando..." : ok ? "Listo" : label}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

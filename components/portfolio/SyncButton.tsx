"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setOk(false);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch(`${API_URL}/integrations/iol/sync`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setOk(true);
        router.refresh();
        setTimeout(() => setOk(false), 3000);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || `Error ${res.status}`);
        setTimeout(() => setError(null), 4000);
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
        {syncing ? "Sincronizando..." : ok ? "Listo" : "Sync IOL"}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

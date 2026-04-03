"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

interface Props {
  /** Providers ALYC conectados, ej: ["IOL", "PPI"]. Un botón por provider. */
  connectedProviders: string[];
}

function SingleSyncButton({ provider }: { provider: string }) {
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
      const mockUser = typeof window !== "undefined" ? localStorage.getItem("bf_mock_user") : null;
      const headers: HeadersInit = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(mockUser ? { "X-Mock-User": mockUser } : {}),
      };

      const res = await fetch(`${API_URL}/integrations/${provider.toLowerCase()}/sync`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || `Error ${res.status}`);
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
            : "bg-bf-surface-2/50 border-bf-border-2 text-bf-text-3 hover:text-bf-text-2 hover:border-bf-border-2"
        } disabled:opacity-50`}
      >
        <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Sync..." : ok ? "Listo" : "Sync"}
        {!syncing && !ok && (
          <span className="text-[9px] text-bf-text-4 font-medium">{provider}</span>
        )}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

export function SyncButton({ connectedProviders }: Props) {
  return (
    <div className="flex items-center gap-2">
      {connectedProviders.map((p) => (
        <SingleSyncButton key={p} provider={p} />
      ))}
    </div>
  );
}

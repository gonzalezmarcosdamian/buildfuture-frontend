"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { ConnectIOLForm } from "./ConnectIOLForm";
import { useRouter } from "next/navigation";

const providerMeta: Record<string, { label: string; description: string; color: string }> = {
  IOL: {
    label: "InvertirOnline",
    description: "Acciones, CEDEARs, bonos, letras, FCI",
    color: "text-blue-400",
  },
  PPI: {
    label: "Portfolio Personal",
    description: "Acciones, bonos, CEDEARs, FCI",
    color: "text-purple-400",
  },
};

export function IntegrationCard({ integration }: { integration: any }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";
  const meta = providerMeta[integration.provider];
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [connected, setConnected] = useState(integration.is_connected);
  const [lastSynced, setLastSynced] = useState(integration.last_synced_at);
  const router = useRouter();

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`${API_URL}/integrations/${integration.provider.toLowerCase()}/sync`, {
        method: "POST",
      });
      if (res.ok) {
        setLastSynced(new Date().toISOString());
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setSyncError(data.detail || `Error ${res.status}`);
      }
    } catch (e) {
      setSyncError("No se pudo conectar con el servidor");
    } finally {
      setSyncing(false);
    }
  }

  function handleConnected() {
    setConnected(true);
    router.refresh();
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm ${meta?.color}`}>
              {meta?.label || integration.provider}
            </p>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
              {integration.provider_type}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{meta?.description}</p>
        </div>
        {connected ? (
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
        ) : (
          <XCircle size={18} className="text-slate-600 shrink-0" />
        )}
      </div>

      <div className="mt-3">
        {connected ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {lastSynced
                ? `Sync: ${new Date(lastSynced).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}`
                : "Sin sync aún"}
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
            >
              {syncing
                ? <Loader2 size={12} className="animate-spin" />
                : <RefreshCw size={12} />}
              {syncing ? "Sincronizando..." : "Sync"}
            </button>
          </div>
        ) : integration.provider === "IOL" ? (
          <ConnectIOLForm onSuccess={handleConnected} />
        ) : (
          <p className="text-xs text-slate-600 italic">Próximamente</p>
        )}

        {integration.last_error && (
          <p className="text-xs text-red-400 mt-2">{integration.last_error}</p>
        )}
        {syncError && (
          <p className="text-xs text-red-400 mt-2">{syncError}</p>
        )}
      </div>
    </div>
  );
}

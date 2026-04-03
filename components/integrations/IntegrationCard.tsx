"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Loader2, Unplug, AlertTriangle, Zap } from "lucide-react";
import { ConnectIOLForm } from "./ConnectIOLForm";
import { ConnectPPIForm } from "./ConnectPPIForm";
import { ConnectCocosForm, CocosSyncModal } from "./ConnectCocosForm";
import { ConnectBinanceForm } from "./ConnectBinanceForm";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8007";

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
  COCOS: {
    label: "Cocos Capital",
    description: "Acciones, CEDEARs, bonos, FCI",
    color: "text-orange-400",
  },
  BINANCE: {
    label: "Binance",
    description: "Crypto spot (read-only)",
    color: "text-yellow-400",
  },
};

interface Integration {
  id: number;
  provider: string;
  provider_type: string;
  is_active: boolean;
  is_connected: boolean;
  auto_sync_enabled: boolean;
  last_synced_at: string | null;
  last_error: string;
}

export function IntegrationCard({ integration }: { integration: Integration }) {
  const meta = providerMeta[integration.provider];
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [connected, setConnected] = useState(integration.is_connected);
  const [autoSync, setAutoSync] = useState(integration.auto_sync_enabled);
  const [lastSynced, setLastSynced] = useState(integration.last_synced_at);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showCocosSyncModal, setShowCocosSyncModal] = useState(false);
  const router = useRouter();

  async function authFetch(path: string, init: RequestInit = {}) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  }

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await authFetch(`/integrations/${integration.provider.toLowerCase()}/sync`, {
        method: "POST",
      });
      if (res.ok) {
        setLastSynced(new Date().toISOString());
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setSyncError(d.detail || `Error ${res.status}`);
      }
    } catch {
      setSyncError("No se pudo conectar con el servidor");
    } finally {
      setSyncing(false);
    }
  }

  async function handleCocosManualSync(code: string) {
    const res = await authFetch("/integrations/cocos/sync", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.detail || `Error ${res.status}`);
    }
    setLastSynced(new Date().toISOString());
    router.refresh();
  }

  function handleConnected() {
    setConnected(true);
    router.refresh();
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await authFetch(
        `/integrations/${integration.provider.toLowerCase()}/disconnect`,
        { method: "POST" }
      );
      if (res.ok) {
        setConnected(false);
        setShowDisconnectModal(false);
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setSyncError(d.detail || `Error ${res.status}`);
        setShowDisconnectModal(false);
      }
    } catch {
      setSyncError("No se pudo conectar con el servidor");
      setShowDisconnectModal(false);
    } finally {
      setDisconnecting(false);
    }
  }

  const isCocos = integration.provider === "COCOS";

  return (
    <>
    {/* Modal desconectar */}
    {showDisconnectModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-900 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">¿Desconectar {meta?.label}?</p>
              <p className="text-xs text-slate-500 mt-0.5">Se borrarán tus credenciales y todas las posiciones sincronizadas.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDisconnectModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              {disconnecting ? <Loader2 size={14} className="animate-spin" /> : null}
              {disconnecting ? "Desconectando..." : "Desconectar"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal sync manual Cocos */}
    {showCocosSyncModal && (
      <CocosSyncModal
        onSync={handleCocosManualSync}
        onClose={() => setShowCocosSyncModal(false)}
      />
    )}

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
            {isCocos && connected && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 ${
                autoSync ? "bg-yellow-900/40 text-yellow-400" : "bg-slate-700 text-slate-500"
              }`}>
                <Zap size={9} />
                {autoSync ? "auto-sync" : "manual"}
              </span>
            )}
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {lastSynced
                  ? `Sync: ${new Date(lastSynced).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}`
                  : "Sin sync aún"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDisconnectModal(true)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Unplug size={11} />
                  Desconectar
                </button>
                {isCocos && !autoSync ? (
                  <button
                    onClick={() => setShowCocosSyncModal(true)}
                    disabled={syncing}
                    className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw size={12} />
                    Sync manual
                  </button>
                ) : (
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                  >
                    {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {syncing ? "Sincronizando..." : "Sync"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : integration.provider === "IOL" ? (
          <ConnectIOLForm onSuccess={handleConnected} />
        ) : integration.provider === "PPI" ? (
          <ConnectPPIForm onSuccess={handleConnected} />
        ) : isCocos ? (
          <ConnectCocosForm onSuccess={() => { handleConnected(); setAutoSync(integration.auto_sync_enabled); }} />
        ) : integration.provider === "BINANCE" ? (
          <ConnectBinanceForm onSuccess={handleConnected} />
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
    </>
  );
}

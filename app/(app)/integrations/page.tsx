import { fetchIntegrations } from "@/lib/api-server";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { ManualIntegrationCard } from "@/components/integrations/ManualIntegrationCard";
import { Plug, Clock } from "lucide-react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const UPCOMING = [
  {
    label: "Binance",
    type: "CRYPTO",
    description: "Spot: BTC, ETH, stablecoins y más de 300 pares",
    color: "text-yellow-400",
    eta: "Q2 2026",
  },
  {
    label: "Ripio",
    type: "CRYPTO",
    description: "Exchange argentino — ARS ↔ crypto, API documentada",
    color: "text-emerald-400",
    eta: "Q3 2026",
  },
  {
    label: "Bybit",
    type: "CRYPTO",
    description: "Spot y derivados — API V5, disponible para Argentina",
    color: "text-orange-400",
    eta: "Q3 2026",
  },
];

export default async function IntegrationsPage() {
  const integrations = await fetchIntegrations();

  return (
    <div className="px-4 pt-6 pb-24 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-bf-text-3 hover:text-bf-text-2 text-sm transition-colors"
        >
          <ChevronLeft size={16} />
        </Link>
        <div className="flex items-center gap-2">
          <Plug size={18} className="text-bf-text-3" />
          <h1 className="text-xl font-bold text-bf-text">Integraciones</h1>
        </div>
      </div>

      <p className="text-xs text-bf-text-3">
        Conectá tus cuentas para sincronizar tu portafolio automáticamente — o cargá posiciones manualmente. Solo lectura: BuildFuture nunca opera en tu nombre.
      </p>

      {/* Brokers conectados */}
      <section className="space-y-3">
        <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">Brokers</p>
        {integrations.map((integration: {
          id: number; provider: string; provider_type: string;
          is_active: boolean; is_connected: boolean; auto_sync_enabled: boolean;
          last_synced_at: string | null; last_error: string;
        }) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </section>

      {/* Carga manual */}
      <section className="space-y-3">
        <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">Carga manual</p>
        <ManualIntegrationCard />
      </section>

      {/* En desarrollo */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-bf-text-3" />
          <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">En desarrollo</p>
        </div>
        {UPCOMING.map((item) => (
          <div
            key={item.label}
            className="bg-bf-surface rounded-2xl p-4 border border-bf-border opacity-60"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${item.color}`}>{item.label}</p>
                  <span className="text-[10px] bg-bf-surface-2 text-bf-text-3 px-1.5 py-0.5 rounded">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-bf-text-3 mt-0.5">{item.description}</p>
              </div>
              <span className="text-[10px] text-bf-text-4 shrink-0 mt-0.5">{item.eta}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border">
        <p className="text-xs text-bf-text-3 font-medium mb-1">Seguridad</p>
        <p className="text-xs text-bf-text-3">
          Tus credenciales se guardan cifradas con AES-256. Las integraciones solo tienen permisos de lectura — nunca podemos ejecutar órdenes ni mover fondos.
        </p>
      </div>
    </div>
  );
}

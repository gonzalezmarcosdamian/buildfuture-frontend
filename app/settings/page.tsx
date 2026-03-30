import { fetchIntegrations } from "@/lib/api";
import { Settings, Clock } from "lucide-react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";

export const dynamic = "force-dynamic";

const UPCOMING = [
  {
    label: "Portfolio Personal (PPI)",
    type: "ALYC",
    description: "Acciones, bonos, CEDEARs, FCI — API oficial documentada",
    color: "text-purple-400",
    eta: "Q2 2026",
  },
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

export default async function SettingsPage() {
  const integrations = await fetchIntegrations();

  return (
    <div className="px-4 pt-8 pb-24 space-y-5">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-slate-400" />
        <h1 className="text-xl font-bold text-slate-100">Integraciones</h1>
      </div>

      <p className="text-xs text-slate-400">
        Conectá tus cuentas para sincronizar tu portafolio real. Solo lectura — BuildFuture nunca opera en tu nombre.
      </p>

      {/* Integraciones activas */}
      <div className="space-y-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Disponibles</p>
        {integrations.map((integration: any) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      {/* En desarrollo */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-slate-500" />
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">En desarrollo</p>
        </div>
        {UPCOMING.map((item) => (
          <div
            key={item.label}
            className="bg-slate-900 rounded-2xl p-4 border border-slate-800 opacity-60"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${item.color}`}>{item.label}</p>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
              </div>
              <span className="text-[10px] text-slate-600 shrink-0 mt-0.5">{item.eta}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <p className="text-xs text-slate-400 font-medium mb-1">Seguridad</p>
        <p className="text-xs text-slate-500">
          Tus credenciales se guardan cifradas localmente. Las integraciones solo tienen permisos de lectura — nunca se realizan operaciones en tu nombre.
        </p>
      </div>
    </div>
  );
}

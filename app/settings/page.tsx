import { fetchIntegrations } from "@/lib/api-server";
import { Settings, Clock, User } from "lucide-react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { ProfileSection } from "@/components/profile/ProfileSection";

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

export default async function SettingsPage() {
  const integrations = await fetchIntegrations();

  return (
    <div className="px-4 pt-8 pb-24 space-y-8">

      {/* ── Mi perfil ─────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <User size={16} className="text-slate-400" />
          <h2 className="text-base font-bold text-slate-100">Mi perfil</h2>
        </div>
        <ProfileSection />
      </section>

      {/* ── Integraciones ─────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-slate-400" />
          <h2 className="text-base font-bold text-slate-100">Integraciones</h2>
        </div>

        <p className="text-xs text-slate-400">
          Conectá tus cuentas para sincronizar tu portafolio. Solo lectura — BuildFuture nunca opera en tu nombre.
        </p>

        <div className="space-y-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Disponibles</p>
          {integrations.map((integration: { id: number; provider: string; provider_type: string; is_active: boolean; is_connected: boolean; last_synced_at: string | null; last_error: string }) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>

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
            Tus credenciales se guardan cifradas. Las integraciones solo tienen permisos de lectura.
          </p>
        </div>
      </section>

    </div>
  );
}

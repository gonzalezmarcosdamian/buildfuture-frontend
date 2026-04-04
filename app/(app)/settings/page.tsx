import { fetchIntegrations } from "@/lib/api-server";
import { Settings, Clock, User, Palette } from "lucide-react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { ManualIntegrationCard } from "@/components/integrations/ManualIntegrationCard";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
    <div className="px-4 pt-8 pb-24 space-y-8 max-w-lg mx-auto">

      {/* ── Mi perfil ─────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <User size={16} className="text-bf-text-3" />
          <h2 className="text-base font-bold text-bf-text">Mi perfil</h2>
        </div>
        <ProfileSection />
      </section>

      {/* ── Apariencia ────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-bf-text-3" />
          <h2 className="text-base font-bold text-bf-text">Apariencia</h2>
        </div>
        <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border space-y-3">
          <p className="text-xs text-bf-text-3">Tema de la aplicación</p>
          <ThemeToggle />
        </div>
      </section>

      {/* ── Integraciones ─────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-bf-text-3" />
          <h2 className="text-base font-bold text-bf-text">Integraciones</h2>
        </div>

        <p className="text-xs text-bf-text-3">
          Conectá tus cuentas para sincronizar tu portafolio. Solo lectura — BuildFuture nunca opera en tu nombre.
        </p>

        <div className="space-y-3">
          <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">Disponibles</p>
          {integrations.map((integration: { id: number; provider: string; provider_type: string; is_active: boolean; is_connected: boolean; auto_sync_enabled: boolean; last_synced_at: string | null; last_error: string }) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
          <ManualIntegrationCard />
        </div>

        <div className="space-y-3">
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
        </div>

        <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border">
          <p className="text-xs text-bf-text-3 font-medium mb-1">Seguridad</p>
          <p className="text-xs text-bf-text-3">
            Tus credenciales se guardan cifradas. Las integraciones solo tienen permisos de lectura.
          </p>
        </div>
      </section>

    </div>
  );
}

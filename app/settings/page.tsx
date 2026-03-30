import { fetchIntegrations } from "@/lib/api";
import { Settings } from "lucide-react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const integrations = await fetchIntegrations();

  return (
    <div className="px-4 pt-8 space-y-5">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-slate-400" />
        <h1 className="text-xl font-bold text-slate-100">Integraciones</h1>
      </div>

      <p className="text-sm text-slate-400">
        Conectá tus cuentas para ver tu portafolio real. Tus credenciales se cifran antes de guardarse.
      </p>

      <div className="space-y-3">
        {integrations.map((integration: any) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <p className="text-xs text-slate-400 font-medium mb-1">Seguridad</p>
        <p className="text-xs text-slate-500">
          Tus credenciales se guardan cifradas. BuildFuture solo tiene acceso de lectura — nunca opera en tu nombre ni mueve tu plata.
        </p>
      </div>
    </div>
  );
}

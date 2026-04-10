import { fetchIntegrations } from "@/lib/api-server";
import { User, Palette, Plug, ChevronRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
          <Plug size={16} className="text-bf-text-3" />
          <h2 className="text-base font-bold text-bf-text">Integraciones</h2>
        </div>

        {/* Resumen de conectadas */}
        {(() => {
          const connected = integrations.filter((i: { is_connected: boolean }) => i.is_connected);
          return (
            <Link
              href="/integrations"
              className="w-full flex items-center justify-between bg-bf-surface rounded-2xl p-4 border border-bf-border hover:border-bf-border-2 hover:bg-bf-surface-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-bf-text">
                    {connected.length > 0
                      ? `${connected.length} broker${connected.length > 1 ? "s" : ""} conectado${connected.length > 1 ? "s" : ""}`
                      : "Sin brokers conectados"}
                  </p>
                  <p className="text-[11px] text-bf-text-3 mt-0.5">
                    {connected.length > 0
                      ? connected.map((i: { provider: string }) => i.provider).join(" · ") + " · Carga manual"
                      : "Conectá IOL, Cocos, PPI o cargá manualmente"}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-bf-text-3 shrink-0" />
            </Link>
          );
        })()}
      </section>

      {/* ── Seguridad & Privacidad ────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-bf-text-3" />
          <h2 className="text-base font-bold text-bf-text">Seguridad & Privacidad</h2>
        </div>
        <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border space-y-3">
          <p className="text-sm font-semibold text-bf-text">Modelo de credenciales</p>
          <p className="text-xs text-bf-text-3 leading-relaxed">
            BuildFuture almacena tus claves de API de forma encriptada y las usa exclusivamente para <span className="text-bf-text font-medium">leer tu portafolio</span>. Nunca ejecutamos órdenes de compra, venta ni transferencias en tu nombre.
          </p>
          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 text-xs font-bold mt-px">✓</span>
              <p className="text-xs text-bf-text-3"><span className="text-bf-text font-medium">Binance:</span> Requiere solo permisos de lectura (&quot;Enable Reading&quot;). Con ese scope, las claves no permiten ninguna operación.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 text-xs font-bold mt-px">!</span>
              <p className="text-xs text-bf-text-3"><span className="text-bf-text font-medium">IOL, Cocos, PPI:</span> Estos brokers no ofrecen permisos granulares. Las claves que ingresás tienen alcance completo sobre tu cuenta — recomendamos usarlas solo con cuentas de lectura o cuentas separadas cuando sea posible.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 text-xs font-bold mt-px">✓</span>
              <p className="text-xs text-bf-text-3">Podés revocar el acceso en cualquier momento desconectando la integración desde esta app o eliminando la API key directamente en el broker.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

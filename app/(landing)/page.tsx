import Link from "next/link";
import { ArrowRight, Shield, Eye, Zap, CheckCircle, AlertCircle } from "lucide-react";

// ── Hero mockup — representación del dashboard ─────────────────────────────────

function DashboardMockup() {
  return (
    <div className="relative">
      {/* iPhone frame */}
      <div className="mx-auto w-[260px] sm:w-[300px] bg-slate-900 rounded-[2.5rem] border border-slate-700/60 shadow-2xl shadow-emerald-900/10 overflow-hidden">
        {/* Notch */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-20 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Screen content */}
        <div className="px-4 pb-6 pt-2 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">Portafolio total</p>
              <p className="text-xl font-extrabold text-slate-100 tabular-nums">USD 18.450</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-[9px] text-orange-400">6 meses invirtiendo</span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-400">M</span>
            </div>
          </div>

          {/* Barra renta */}
          <div className="bg-slate-800/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">💰 Renta mensual</p>
              <p className="text-[9px] font-bold text-slate-400">63%</p>
            </div>
            <p className="text-base font-extrabold text-emerald-400">USD 378/mes</p>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-[63%] rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
            </div>
            <p className="text-[9px] text-slate-600">meta USD 600/mes</p>
          </div>

          {/* Barra capital */}
          <div className="bg-slate-800/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">📈 Capital acumulado</p>
              <p className="text-[9px] font-bold text-slate-400">41%</p>
            </div>
            <p className="text-base font-extrabold text-violet-400">USD 11.200</p>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-[41%] rounded-full bg-gradient-to-r from-violet-600 to-violet-400" />
            </div>
            <p className="text-[9px] text-slate-600">objetivo USD 27.500</p>
          </div>

          {/* Brokers badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {["IOL", "Cocos", "Binance"].map((b) => (
              <span key={b} className="text-[9px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Glow detrás del mockup */}
      <div className="absolute -inset-8 -z-10 bg-emerald-600/8 blur-3xl rounded-full" />
    </div>
  );
}

// ── Sección Hero ───────────────────────────────────────────────────────────────

function SectionHero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 pb-12 overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, #34d399 1px, transparent 1px),
                            linear-gradient(to bottom, #34d399 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-600/6 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/6 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Copy */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/50 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-400 tracking-wide uppercase">Open Finance · Argentina</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-100 leading-[1.05] tracking-tight">
                Sabés cuánto tenés.
              </h1>
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
                <span className="text-emerald-400">No sabés</span>{" "}
                <span className="text-slate-100">cuándo</span>
              </h1>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-100 leading-[1.05] tracking-tight">
                sos libre.
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              BuildFuture conecta todo tu patrimonio —
              <span className="text-slate-200"> IOL, Cocos, PPI, Binance</span> —
              y te muestra en tiempo real qué tan cerca estás de vivir de tus inversiones.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-7 py-3.5 rounded-2xl transition-colors text-base"
              >
                Empezar gratis
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-7 py-3.5 rounded-2xl transition-colors text-base border border-slate-700"
              >
                Ya tengo cuenta →
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle size={11} className="text-emerald-500" />
                Sin tarjeta
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={11} className="text-emerald-500" />
                Solo lectura — nunca tocamos tu plata
              </span>
              <span className="flex items-center gap-1.5">
                <Zap size={11} className="text-emerald-500" />
                Beta gratuita
              </span>
            </div>
          </div>

          {/* Mockup */}
          <div className="flex justify-center lg:justify-end">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Sección Integraciones ──────────────────────────────────────────────────────

const BROKERS = [
  { name: "IOL", full: "InvertirOnline", status: "En vivo" },
  { name: "Cocos", full: "Cocos Capital", status: "En vivo" },
  { name: "PPI", full: "Primary Portfolio", status: "En vivo" },
  { name: "Binance", full: "Binance", status: "En vivo" },
];

function SectionIntegraciones() {
  return (
    <section className="py-16 border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-5 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-600">Conectado a tu ecosistema financiero</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BROKERS.map((b) => (
            <div
              key={b.name}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <span className="text-[11px] font-bold text-slate-300">{b.name[0]}</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">{b.name}</p>
                <p className="text-[10px] text-slate-600">{b.full}</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 rounded-full font-medium">
                {b.status}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-500 pt-2">
          <div className="flex items-center gap-2">
            <Shield size={13} className="text-emerald-500" />
            <span>Solo lectura. Nunca ejecutamos órdenes. Tus credenciales, encriptadas.</span>
          </div>
          <span className="hidden sm:inline text-slate-700">·</span>
          <span className="text-slate-600">Más brokers en camino →</span>
        </div>
      </div>
    </section>
  );
}

// ── Sección El Problema ────────────────────────────────────────────────────────

const PROBLEMAS = [
  {
    icon: "🗂️",
    title: "Tus activos están dispersos.",
    body: "Tenés LECAPs en IOL, CEDEARs en Cocos y BTC en Binance. Ningún broker te muestra el total consolidado.",
  },
  {
    icon: "📊",
    title: "Calculás a mano, siempre desactualizado.",
    body: "Para saber cuánto ganás por mes usás una hoja de cálculo que cambia cada vez que hacés algo.",
  },
  {
    icon: "🧭",
    title: "No sabés cuándo sos libre.",
    body: "Tu portafolio crece, pero no tenés idea de cuándo ese crecimiento alcanza para reemplazar tu sueldo.",
  },
  {
    icon: "📈",
    title: "Tu broker mide rentabilidad, no libertad.",
    body: "Te dice cuánto ganaste en porcentaje. No te dice cuánto te falta para dejar de depender de un sueldo.",
  },
];

function SectionProblema() {
  return (
    <section className="py-24 bg-slate-900/40">
      <div className="max-w-6xl mx-auto px-5 space-y-12">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-slate-600">El problema</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
            Si invertís en Argentina,<br />
            <span className="text-slate-400">esto te suena familiar.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {PROBLEMAS.map((p) => (
            <div
              key={p.title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0">
                  {p.icon}
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-200">{p.title}</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{p.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Remate */}
        <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/60 flex items-start gap-4">
          <AlertCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">
              Tu broker te muestra rentabilidad. Nadie te muestra libertad.
            </p>
            <p className="text-[13px] text-slate-500">
              BuildFuture es la primera herramienta argentina que responde la pregunta que importa:{" "}
              <span className="text-emerald-400 font-medium">¿cuándo podés vivir de tus inversiones?</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA intermedio ─────────────────────────────────────────────────────────────

function SectionCTAIntermedio() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-5 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
          Tu número existe. Solo hay que calcularlo.
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Creá tu cuenta gratis y en 5 minutos tenés tu dashboard de libertad financiera.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-4 rounded-2xl transition-colors text-base"
          >
            Empezar gratis
            <ArrowRight size={16} />
          </Link>
        </div>
        <p className="text-[12px] text-slate-600">Sin tarjeta · Solo lectura · Podés irte cuando quieras</p>
      </div>
    </section>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main>
      <SectionHero />
      <SectionIntegraciones />
      <SectionProblema />
      <SectionCTAIntermedio />
    </main>
  );
}

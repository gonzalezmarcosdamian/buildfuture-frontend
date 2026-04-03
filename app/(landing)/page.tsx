"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Shield, Eye, Zap, CheckCircle, AlertCircle, TrendingUp, Target, BookOpen, Cpu, Globe, ChevronRight, ChevronDown, MessageCircle, Mail, ExternalLink } from "lucide-react";

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
  { name: "IOL", full: "InvertirOnline", domain: "invertironline.com", status: "En vivo", statusColor: "bg-emerald-950/60 border-emerald-800/50 text-emerald-400" },
  { name: "Cocos", full: "Cocos Capital", domain: "cocos.capital", status: "En vivo", statusColor: "bg-emerald-950/60 border-emerald-800/50 text-emerald-400" },
  { name: "PPI", full: "Primary Portfolio", domain: "ppi.com.ar", status: "En vivo", statusColor: "bg-emerald-950/60 border-emerald-800/50 text-emerald-400" },
  { name: "Binance", full: "Binance", domain: "binance.com", status: "En vivo", statusColor: "bg-emerald-950/60 border-emerald-800/50 text-emerald-400" },
  { name: "Carga manual", full: "Wallet, efectivo, otros", domain: null, status: "Próximamente", statusColor: "bg-slate-800 border-slate-700 text-slate-400" },
];

function BrokerLogo({ domain, name }: { domain: string | null; name: string }) {
  const [err, setErr] = useState(false);
  if (domain && !err) {
    return (
      <Image
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={name}
        width={28}
        height={28}
        className="rounded-lg"
        onError={() => setErr(true)}
        unoptimized
      />
    );
  }
  return <span className="text-base font-bold text-slate-400">+</span>;
}

function SectionIntegraciones() {
  return (
    <section className="py-16 border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-5 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-600">Conectado a tu ecosistema financiero</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {BROKERS.map((b) => (
            <div
              key={b.name}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <BrokerLogo domain={b.domain} name={b.name} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">{b.name}</p>
                <p className="text-[10px] text-slate-600">{b.full}</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 border rounded-full font-medium ${b.statusColor}`}>
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
          <span className="text-slate-600">¿Usás otro broker? Escribinos →</span>
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

// ── Mockup portfolio ──────────────────────────────────────────────────────────

function PortfolioMockup() {
  const positions = [
    { ticker: "LETE", name: "Letra del Tesoro", type: "LETRA", val: "USD 5.200", pct: "+12.4%", src: "IOL", color: "text-emerald-400" },
    { ticker: "GGAL", name: "Galicia CEDEAR", type: "CEDEAR", val: "USD 4.800", pct: "+31.2%", src: "Cocos", color: "text-emerald-400" },
    { ticker: "SPY", name: "S&P 500 ETF", type: "ETF", val: "USD 3.100", pct: "+8.7%", src: "Cocos", color: "text-emerald-400" },
    { ticker: "BTC", name: "Bitcoin", type: "CRYPTO", val: "USD 2.900", pct: "+54.1%", src: "Binance", color: "text-emerald-400" },
    { ticker: "AL30", name: "Bono Argentina", type: "BOND", val: "USD 2.450", pct: "-3.2%", src: "IOL", color: "text-red-400" },
  ];
  return (
    <div className="relative">
      <div className="mx-auto w-[280px] sm:w-[320px] bg-slate-900 rounded-[2.5rem] border border-slate-700/60 shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-20 h-1.5 bg-slate-700 rounded-full" />
        </div>
        <div className="px-4 pb-6 pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-100">Portafolio</p>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 rounded-full">4 fuentes</span>
          </div>
          <div className="space-y-2">
            {positions.map((p) => (
              <div key={p.ticker} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-slate-300">{p.ticker[0]}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-200">{p.ticker}</p>
                    <p className="text-[8px] text-slate-600">{p.src}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-200">{p.val}</p>
                  <p className={`text-[9px] font-medium ${p.color}`}>{p.pct}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-2 flex justify-between">
            <span className="text-[9px] text-slate-500">Total</span>
            <span className="text-[10px] font-extrabold text-slate-100">USD 18.450</span>
          </div>
        </div>
      </div>
      <div className="absolute -inset-8 -z-10 bg-violet-600/8 blur-3xl rounded-full" />
    </div>
  );
}

// ── Mockup sugerencias ────────────────────────────────────────────────────────

function SugerenciasMockup() {
  const items = [
    { icon: "💰", name: "LECAP Marzo 2026", label: "TNA ARS", range: "72% — 78%", risk: "Bajo", tag: "Renta fija" },
    { icon: "📈", name: "SPY CEDEAR", label: "ret. USD/año", range: "8% — 22%", risk: "Moderado", tag: "Renta variable" },
    { icon: "🌐", name: "QQQ CEDEAR", label: "ret. USD/año", range: "10% — 28%", risk: "Alto", tag: "Renta variable" },
  ];
  return (
    <div className="relative">
      <div className="mx-auto w-[280px] sm:w-[320px] bg-slate-900 rounded-[2.5rem] border border-slate-700/60 shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-20 h-1.5 bg-slate-700 rounded-full" />
        </div>
        <div className="px-4 pb-6 pt-2 space-y-3">
          <div>
            <p className="text-sm font-bold text-slate-100">Sugerencias</p>
            <p className="text-[9px] text-slate-500">Basadas en tu perfil moderado</p>
          </div>
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.name} className="bg-slate-800/50 rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-200">{item.name}</p>
                      <span className="text-[8px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded-full">{item.tag}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-slate-500">{item.label}</p>
                  <p className="text-[11px] font-bold text-emerald-400">{item.range}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -inset-8 -z-10 bg-emerald-600/8 blur-3xl rounded-full" />
    </div>
  );
}

// ── Sección Solución (3 pilares) ──────────────────────────────────────────────

const PILARES = [
  {
    emoji: "🗂️",
    tag: "Portafolio unificado",
    headline: "Todo tu patrimonio,\nen un solo número.",
    body: "Conectás IOL, Cocos, PPI y Binance. BuildFuture sincroniza automáticamente y te muestra el total en pesos y dólares, con el MEP del día. Sin copiar y pegar. Sin Excel. Sin adivinar.",
    mockup: <PortfolioMockup />,
    flip: false,
  },
  {
    emoji: "📊",
    tag: "Barra de libertad",
    headline: "¿Cuánto de tu vida\nya pagás con inversiones?",
    body: "La barra de renta muestra, en tiempo real, qué porcentaje de tus gastos mensuales cubrís con los rendimientos de tu portafolio. 100% = libertad financiera. BuildFuture te dice exactamente cuánto te falta.",
    mockup: <DashboardMockup />,
    flip: true,
  },
  {
    emoji: "🎯",
    tag: "Metas + sugerencias",
    headline: "No solo trackeás.\nAvanzás.",
    body: "Definís tus metas: un departamento, un fondo de emergencia, retiro anticipado. BuildFuture calcula cuánto te falta y te sugiere instrumentos según tu perfil de riesgo y las condiciones del mercado argentino hoy.",
    mockup: <SugerenciasMockup />,
    flip: false,
  },
];

function SectionSolucion() {
  return (
    <section className="py-24 border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-5 space-y-6">
        <div className="space-y-3 mb-16">
          <p className="text-[11px] uppercase tracking-widest text-slate-600">La solución</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
            Un solo lugar para entender<br />
            <span className="text-emerald-400">tu libertad financiera.</span>
          </h2>
        </div>

        <div className="space-y-28">
          {PILARES.map((pilar) => (
            <div
              key={pilar.tag}
              className={`grid lg:grid-cols-2 gap-16 items-center ${pilar.flip ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              {/* Copy */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full">
                  <span>{pilar.emoji}</span>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{pilar.tag}</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight whitespace-pre-line">
                  {pilar.headline}
                </h3>
                <p className="text-slate-400 text-base leading-relaxed">{pilar.body}</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Probarlo gratis <ChevronRight size={14} />
                </Link>
              </div>
              {/* Mockup */}
              <div className={`flex ${pilar.flip ? "lg:justify-start" : "lg:justify-end"} justify-center`}>
                {pilar.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Sección Cómo funciona ─────────────────────────────────────────────────────

const PASOS = [
  {
    num: "01",
    icon: "✉️",
    title: "Creá tu cuenta",
    body: "Solo email y contraseña. Sin datos bancarios. Sin CVU. Sin tarjeta. En 30 segundos.",
    detail: "Usamos Supabase Auth con email confirmado. Tus credenciales nunca tocan nuestro servidor.",
  },
  {
    num: "02",
    icon: "🔌",
    title: "Conectá tus brokers",
    body: "Ingresás tus credenciales de solo lectura de IOL, Cocos, PPI o Binance. Nosotros sincronizamos el resto.",
    detail: "Acceso de solo lectura — nunca podemos ejecutar órdenes. Credenciales encriptadas AES-256.",
  },
  {
    num: "03",
    icon: "🎯",
    title: "Completá tu perfil",
    body: "Tu presupuesto mensual, tu perfil de riesgo, tus metas de capital. BuildFuture hace los cálculos.",
    detail: "Con esto calibramos la barra de libertad, las sugerencias de inversión y tu proyección a largo plazo.",
  },
];

function SectionComoFunciona() {
  return (
    <section className="py-24 bg-slate-900/40 border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-5 space-y-16">
        <div className="space-y-3 text-center">
          <p className="text-[11px] uppercase tracking-widest text-slate-600">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
            Estar en BuildFuture toma{" "}
            <span className="text-emerald-400">5 minutos.</span>
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Tres pasos. Sin fricciones. Sin datos bancarios. Sin riesgos.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 relative">
          {/* Línea conectora desktop */}
          <div className="hidden sm:block absolute top-8 left-[calc(16.7%+16px)] right-[calc(16.7%+16px)] h-px bg-slate-800" />

          {PASOS.map((paso) => (
            <div key={paso.num} className="relative space-y-4">
              {/* Número + icono */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0 relative z-10">
                  <span className="text-xl">{paso.icon}</span>
                  <span className="text-[9px] text-slate-600 font-mono mt-0.5">{paso.num}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-100">{paso.title}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">{paso.body}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-800 rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-slate-500 leading-relaxed">{paso.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center space-y-4">
          <p className="text-slate-500 text-sm">Listo. Tu dashboard está vivo.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-7 py-3.5 rounded-2xl transition-colors"
          >
            Empezar ahora <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Sección Visión ────────────────────────────────────────────────────────────

const ROADMAP = [
  {
    icon: TrendingUp,
    title: "Portafolio unificado + libertad financiera",
    status: "En vivo",
    statusColor: "bg-emerald-950/60 border-emerald-800/50 text-emerald-400",
    desc: "IOL, Cocos, PPI, Binance. Barra de renta. Metas de capital. Sugerencias por perfil.",
  },
  {
    icon: Target,
    title: "Cuenta bancaria + gastos integrados",
    status: "Próximamente",
    statusColor: "bg-slate-800 border-slate-700 text-slate-400",
    desc: "Tu sueldo, tus gastos y tus inversiones en un solo panel. Sin apps separadas.",
  },
  {
    icon: BookOpen,
    title: "Educación financiera contextual",
    status: "Próximamente",
    statusColor: "bg-slate-800 border-slate-700 text-slate-400",
    desc: "Aprendés mientras usás. No un curso. Tu situación real, explicada en el momento justo.",
  },
  {
    icon: Cpu,
    title: "Simulador de decisiones",
    status: "En exploración",
    statusColor: "bg-slate-800/50 border-slate-800 text-slate-600",
    desc: "¿Qué pasa si invierto $500 más por mes durante 5 años? Respuesta inmediata, con tu portafolio real como base.",
  },
  {
    icon: Globe,
    title: "Open finance para latinoamérica",
    status: "En exploración",
    statusColor: "bg-slate-800/50 border-slate-800 text-slate-600",
    desc: "Hoy Argentina. Después Chile, Colombia, México. La infraestructura financiera de la región es fragmentada — BuildFuture la une.",
  },
];

function SectionVision() {
  return (
    <section className="py-24 border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-5 space-y-12">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Copy */}
          <div className="space-y-6">
            <p className="text-[11px] uppercase tracking-widest text-slate-600">A dónde vamos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
              Hoy: portafolio + libertad.<br />
              <span className="text-emerald-400">Mañana: open finance</span><br />
              para latinoamérica.
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Argentina es el laboratorio perfecto: inflación alta, múltiples instrumentos,
              múltiples brokers, y una generación que aprendió a invertir por necesidad.
            </p>
            <p className="text-slate-400 leading-relaxed">
              BuildFuture nace acá. Pero el problema de tener el patrimonio fragmentado
              en silos que no se hablan entre sí es latinoamericano.
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-[13px] text-slate-400 italic leading-relaxed">
                &ldquo;La plataforma que centraliza tu patrimonio, te educa en el camino
                y te guía hacia la libertad financiera — con números reales.&rdquo;
              </p>
            </div>
          </div>

          {/* Roadmap */}
          <div className="space-y-3">
            {ROADMAP.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-slate-400" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                      <span className={`text-[9px] px-2 py-0.5 border rounded-full font-medium ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Sección Founder + Social proof ────────────────────────────────────────────

const METRICAS = [
  { valor: "USD 18K+", label: "en portafolios gestionados" },
  { valor: "4", label: "brokers conectados" },
  { valor: "6+", label: "meses en producción" },
];

function SectionFounder() {
  return (
    <section className="py-24 bg-slate-900/40 border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto px-5 space-y-16">

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {METRICAS.map((m) => (
            <div key={m.label} className="text-center space-y-1">
              <p className="text-2xl sm:text-4xl font-extrabold text-emerald-400 tabular-nums">{m.valor}</p>
              <p className="text-[11px] sm:text-xs text-slate-500">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Founder */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Quote */}
          <div className="space-y-6">
            <p className="text-[11px] uppercase tracking-widest text-slate-600">El fundador</p>
            <blockquote className="space-y-4">
              <p className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
                &ldquo;Construí BuildFuture porque yo mismo tenía plata repartida en tres brokers
                y ninguna herramienta me decía lo único que me importaba:
                <span className="text-emerald-400"> ¿cuándo puedo ser libre?</span>&rdquo;
              </p>
              <p className="text-slate-400 leading-relaxed">
                Soy Marcos González. PM de productos financieros en Ualá, Ingeniero Industrial,
                inversor activo desde hace 6 años en LECAPs, CEDEARs, bonos y cripto.
                Trabajo en fintech de día y construyo BuildFuture de noche porque creo que
                Argentina necesita esta herramienta.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Este es el producto que yo necesitaba. Y creo que miles de argentinos también.
              </p>
            </blockquote>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://linkedin.com/in/marcosdamiangonzalez"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-xl"
              >
                LinkedIn →
              </a>
              <a
                href="mailto:ingonzalezdamian@gmail.com"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-xl"
              >
                Escribime →
              </a>
            </div>
          </div>

          {/* Card de credenciales */}
          <div className="space-y-4">
            {[
              { icon: "🏦", label: "Category Lead – Wealth en Ualá" },
              { icon: "🎓", label: "Ingeniero Industrial" },
              { icon: "📍", label: "Córdoba, Argentina" },
              { icon: "📈", label: "6+ años en fintech y banca (Ualá, Supervielle, CIS Latam)" },
              { icon: "💼", label: "Inversor activo: LECAPs, CEDEARs, bonos, cripto" },
              { icon: "🛠️", label: "Construye BuildFuture con Python, Next.js y Claude AI" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                <span className="text-base">{item.icon}</span>
                <p className="text-[13px] text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── SECCIÓN FAQ ────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "¿BuildFuture puede comprar o vender por mí?", a: "No. Nunca. Solo tiene acceso de lectura a tus cuentas. No puede ejecutar órdenes ni mover fondos. Podés verificarlo revisando los permisos en tu broker en cualquier momento." },
  { q: "¿Qué pasa con mis credenciales de IOL o Binance?", a: "Se almacenan encriptadas con AES-256. Nunca las vemos en texto plano. Podés revocarlas desde BuildFuture o directamente desde tu broker cuando quieras." },
  { q: "¿Es gratis?", a: "Sí, durante la beta. El modelo de monetización se definirá con la comunidad de usuarios antes de lanzar cualquier cobro. Recibirás aviso con tiempo." },
  { q: "¿Funciona con mi broker?", a: "Hoy: IOL, Cocos Capital, PPI y Binance. Si usás otro, anotate en la waitlist y contanos cuál — es la forma más directa de que lo prioricemos." },
  { q: "¿Mis datos se venden a terceros?", a: "No. Nunca. Usamos proveedores de infraestructura (Supabase, Railway, Vercel) pero no compartimos ni vendemos información personal o financiera." },
  { q: "¿Puedo ingresar posiciones manualmente?", a: "Próximamente. Podrás cargar activos fuera de los brokers conectados — cripto en wallets propias, efectivo, plazos fijos. Escribinos si lo necesitás y lo priorizamos." },
  { q: "¿Las sugerencias son asesoramiento financiero?", a: "No. Son sugerencias algorítmicas con fines educativos, basadas en tu perfil de riesgo. No constituyen asesoramiento financiero personalizado bajo la Ley 26.831. Toda decisión es tuya." },
];

function SectionFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-24 border-t border-slate-800/60">
      <div className="max-w-3xl mx-auto px-5 space-y-10">
        <div className="space-y-3 text-center">
          <p className="text-[11px] uppercase tracking-widest text-slate-600">Preguntas frecuentes</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">Respuestas antes de que preguntes.</h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className={`border rounded-2xl overflow-hidden transition-colors ${open === i ? "border-emerald-800/60 bg-slate-900" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"}`}>
              <button className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-sm font-semibold text-slate-200">{faq.q}</span>
                <ChevronDown size={16} className={`text-slate-500 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-[13px] text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SECCIÓN CONTACTO ──────────────────────────────────────────────────────────

const CONTACTO_ITEMS = [
  {
    icon: MessageCircle,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-950/60 border-emerald-800/50",
    title: "WhatsApp",
    body: "La forma más rápida. Feedback, bugs, preguntas — lo que sea.",
    cta: "Escribime por WhatsApp",
    href: "https://wa.me/5492920445362",
    external: true,
  },
  {
    icon: Mail,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-950/60 border-blue-800/50",
    title: "Email",
    body: "Feedback detallado, propuestas de integración, o simplemente saludar.",
    cta: "ingonzalezdamian@gmail.com",
    href: "mailto:ingonzalezdamian@gmail.com",
    external: false,
  },
  {
    icon: ExternalLink,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-950/60 border-sky-800/50",
    title: "LinkedIn",
    body: "Si preferís el canal profesional o querés conectar directamente.",
    cta: "Conectar en LinkedIn",
    href: "https://linkedin.com/in/marcosdamiangonzalez",
    external: true,
  },
];

function SectionContacto() {
  return (
    <section className="py-24 bg-slate-900/40 border-t border-slate-800/60">
      <div className="max-w-3xl mx-auto px-5 space-y-10">
        <div className="space-y-3 text-center">
          <p className="text-[11px] uppercase tracking-widest text-slate-600">Contacto</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">Hablemos.</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            ¿Feedback sobre la app? ¿Querés que integremos tu broker?
            ¿Algo que no funciona? Escribime directamente — leo todo.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {CONTACTO_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.title}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col gap-4 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.iconBg}`}>
                  <Icon size={18} className={item.iconColor} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{item.body}</p>
                </div>
                <span className="text-[12px] font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  {item.cta} →
                </span>
              </a>
            );
          })}
        </div>

        {/* Nota integración */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-base">🔌</div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">¿Usás un broker que no está?</p>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Escribime y lo priorizamos. Las integraciones se deciden por demanda real.
              También podés cargar posiciones manualmente — esta funcionalidad está <span className="text-slate-300 font-medium">próximamente disponible en la app</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── SECCIÓN CTA FINAL ──────────────────────────────────────────────────────────

function SectionCTAFinal() {
  return (
    <section className="py-28 border-t border-slate-800/60 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent pointer-events-none" />
      <div className="max-w-3xl mx-auto px-5 text-center space-y-8 relative">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-100 leading-tight">
          Tu libertad financiera<br />empieza con un número.
        </h2>
        <p className="text-xl text-emerald-400 font-semibold">BuildFuture te lo dice hoy.</p>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-10 py-4 rounded-2xl transition-colors text-lg">
          Crear mi cuenta gratis <ArrowRight size={18} />
        </Link>
        <p className="text-[12px] text-slate-600">Sin tarjeta · Solo lectura · Podés irte cuando quieras</p>
      </div>
    </section>
  );
}

// ── PÁGINA PRINCIPAL ───────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main>
      <SectionHero />
      <SectionIntegraciones />
      <SectionProblema />
      <SectionSolucion />
      <SectionComoFunciona />
      <SectionVision />
      <SectionFounder />
      <SectionFAQ />
      <SectionContacto />
      <SectionCTAFinal />
    </main>
  );
}

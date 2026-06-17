"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Acordeón de FAQ. Isla cliente (useState para el item abierto) para que el
 * resto de la landing pueda renderizarse como Server Component.
 */
const FAQS = [
  { q: "¿Cómo sé cuánto puedo invertir este mes?", a: "BuildFuture calcula tu capacidad de inversión a partir de tus ingresos y tus gastos reales. Cuando configurás tu presupuesto en la app, el sistema te muestra cuánto sobra antes de que lo gastes en otra cosa. Es el número que la mayoría de los inversores nunca tienen claro, y que cambia todo cuando lo ves seguido." },
  { q: "Si bajo mis gastos, ¿cambia mucho mi libertad financiera?", a: "Sí, y el impacto es mayor de lo que intuís. Cada peso que dejás de gastar tiene dos efectos: aumenta cuánto podés invertir este mes, y reduce cuánto necesitás para ser libre (porque tus gastos mensuales son más bajos). El simulador de BuildFuture te muestra exactamente cuántos meses acortás tu camino con cada cambio." },
  { q: "¿En cuánto tiempo puedo ser libre financieramente?", a: "Depende de cuánto tenés hoy, cuánto podés invertir cada mes y qué rendimiento promedio obtenés. BuildFuture calcula tu proyección con tu portafolio real como base — no con ejemplos genéricos. La barra de libertad te muestra el porcentaje actual; la proyección te dice cuándo llegás al 100% si mantenés el ritmo." },
  { q: "¿Cómo accedo a BuildFuture?", a: "La beta es por invitación personal. Escribile directamente a Damián — por WhatsApp, email o LinkedIn. Si tu perfil encaja con la comunidad que estamos armando, recibís un link de acceso personal." },
  { q: "¿Por qué la beta es cerrada?", a: "BuildFuture es un proyecto personal no comercial. Preferimos conocer a cada usuario antes de darle acceso a sus datos financieros. El control manual nos permite iterar rápido y garantizar que la experiencia sea buena para cada persona." },
  { q: "¿BuildFuture es gratuito?", a: "Sí, y así seguirá durante toda la beta. Si en algún momento cambia el modelo, los usuarios beta recibirán aviso con al menos 30 días de anticipación y podrán eliminar su cuenta sin ninguna penalidad." },
  { q: "¿BuildFuture puede comprar o vender por mí?", a: "No. Nunca. Solo tiene acceso de lectura a tus cuentas. No puede ejecutar órdenes ni mover fondos. Podés verificarlo revisando los permisos en tu broker en cualquier momento." },
  { q: "¿Qué pasa con mis credenciales de IOL o Binance?", a: "Se almacenan encriptadas con AES-256. Nunca las vemos en texto plano. Podés revocarlas desde BuildFuture o directamente desde tu broker cuando quieras." },
  { q: "¿Funciona con mi broker?", a: "Hoy: IOL, Cocos Capital, PPI y Binance. Si no tenés broker o preferís empezar sin conectar nada, podés cargar tus posiciones manualmente: efectivo, cripto, inmuebles que alquilás y más. Si usás otro broker, escribile a Damián directamente — es la forma más rápida de que lo prioricemos." },
  { q: "¿Puedo cargar mi departamento en alquiler?", a: "Sí. Ingresás el nombre del inmueble, la dirección, el valor en USD y el alquiler mensual que cobrás. BuildFuture calcula el yield anual y lo incorpora a tu barra de libertad financiera. Para muchos usuarios, el depto es el activo que más mueve el número. No necesitás ninguna integración — lo actualizás cuando querés." },
  { q: "No tengo broker ni acciones. Solo tengo un departamento alquilado y efectivo. ¿BuildFuture me sirve?", a: "Sí. Podés cargar tu inmueble manualmente con dirección, valuación y renta, y registrar tu efectivo en ARS o USD. La app calcula cuánto falta para cubrir tus gastos con esos activos y te muestra tu avance hacia la libertad financiera — sin necesidad de conectar ningún broker. Conectar uno lo hace automático, pero no es obligatorio para empezar." },
  { q: "¿Mis datos se venden a terceros?", a: "No. Nunca. Usamos proveedores de infraestructura (Supabase, Railway, Vercel) pero no compartimos ni vendemos información personal o financiera." },
  { q: "¿El Invest Advisor es asesoramiento financiero?", a: "No. El Invest Advisor genera análisis informativos con IA (Claude de Anthropic) usando tu portafolio real como contexto. No constituye asesoramiento financiero personalizado bajo la Ley 26.831. Es una herramienta educativa para entender mejor tu portafolio. Toda decisión de inversión es tuya." },
  { q: "¿Qué puede analizar el Invest Advisor?", a: "Cinco tipos de análisis: tu cartera completa (diagnóstico, concentración, freedom %), análisis técnico de un instrumento, análisis fundamental, contexto macro argentino (MEP, tasa vs inflación, régimen), y escenarios (impacto de una noticia en tu portafolio). Tenés 5 consultas por día, se resetean a medianoche." },
];

export function SectionFAQ() {
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

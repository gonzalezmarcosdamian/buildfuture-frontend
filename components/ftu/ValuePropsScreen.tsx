"use client";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

const PROPS = [
  {
    icon: "💰",
    title: "Renta mensual real",
    desc: "Medí cuánto de tus gastos mensuales cubre el rendimiento de tu portafolio. No acumulación abstracta — cobertura concreta.",
    color: "border-emerald-900/40 bg-emerald-950/20",
  },
  {
    icon: "📈",
    title: "Capital a largo plazo",
    desc: "Proyectá metas concretas (casa, auto, retiro) con interés compuesto y DCA. Sabés exactamente en cuántos meses llegás.",
    color: "border-violet-900/40 bg-violet-950/20",
  },
  {
    icon: "🤖",
    title: "Sugerencias personalizadas",
    desc: "Comité de 4 agentes expertos (Carry, Dolarización, Renta Fija, Diversificación) adaptado a tu perfil de riesgo.",
    color: "border-blue-900/40 bg-blue-950/20",
  },
];

export function ValuePropsScreen() {
  const router = useRouter();

  return (
    <div className="px-4 pt-10 pb-24 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-3xl font-extrabold text-bf-text">BuildFuture</p>
        <p className="text-sm text-bf-text-3 leading-relaxed">
          Tu camino a la libertad financiera —{" "}
          <span className="text-emerald-400">renta mensual</span> hoy,{" "}
          <span className="text-violet-400">capital</span> mañana.
        </p>
      </div>

      {/* Props */}
      <div className="space-y-3">
        {PROPS.map((p) => (
          <div
            key={p.title}
            className={`rounded-2xl border p-4 flex gap-4 ${p.color}`}
          >
            <span className="text-2xl shrink-0 leading-none mt-0.5">{p.icon}</span>
            <div>
              <p className="text-sm font-semibold text-bf-text">{p.title}</p>
              <p className="text-xs text-bf-text-3 mt-1 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => router.push("/settings")}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          Conectar mi portafolio IOL
          <ChevronRight size={16} />
        </button>
        <p className="text-center text-[11px] text-bf-text-4">
          Sincronizá con InvertirOnline para ver tus posiciones en segundos.
        </p>
      </div>
    </div>
  );
}

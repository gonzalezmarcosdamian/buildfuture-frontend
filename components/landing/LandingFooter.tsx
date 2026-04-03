import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="max-w-6xl mx-auto px-5 py-12 space-y-8">

        {/* Logo + links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-0.5">
            <span className="text-base font-extrabold text-slate-100">Build</span>
            <span className="text-base font-extrabold text-emerald-400">Future</span>
            <span className="text-slate-600 text-sm ml-3">· Córdoba, Argentina</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/legal" className="hover:text-slate-300 transition-colors">Términos de uso</Link>
            <Link href="/legal#privacidad" className="hover:text-slate-300 transition-colors">Privacidad</Link>
            <Link href="/legal#disclaimers" className="hover:text-slate-300 transition-colors">Legal</Link>
            <a href="mailto:ingonzalezdamian@gmail.com" className="hover:text-slate-300 transition-colors">Contacto</a>
          </div>
        </div>

        {/* Disclaimer CNV */}
        <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/40">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <span className="text-slate-400 font-semibold">AVISO LEGAL:</span>{" "}
            BuildFuture no es una Agente de Liquidación y Compensación (ALyC) ni está registrado ante la
            Comisión Nacional de Valores (CNV) como asesor de inversiones. La información provista tiene
            fines exclusivamente informativos y educativos. Las sugerencias de inversión son algorítmicas
            y no constituyen asesoramiento financiero personalizado. Toda decisión de inversión es
            responsabilidad exclusiva del usuario. Invertir en instrumentos financieros implica riesgos,
            incluyendo la pérdida parcial o total del capital invertido. Los rendimientos pasados no
            garantizan rendimientos futuros.
          </p>
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-slate-700 text-center">
          © 2026 BuildFuture · Hecho con ☕ en Córdoba · por{" "}
          <a
            href="https://linkedin.com/in/marcosdamiangonzalez"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-500 transition-colors"
          >
            Marcos González
          </a>
        </p>
      </div>
    </footer>
  );
}

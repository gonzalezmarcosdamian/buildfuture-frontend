// Fase 3 — Contenido legal completo (CNV + Ley 25.326 + cookies)
// Por ahora: placeholder con disclaimer mínimo operativo.

export default function LegalPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 pt-28 pb-24 space-y-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-100">Legal</h1>
        <p className="text-slate-400 text-sm">Última actualización: Abril 2026</p>
      </div>

      <section id="disclaimers" className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Disclaimer financiero</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-[13px] text-slate-400 leading-relaxed">
          <p>
            BuildFuture no es una Agente de Liquidación y Compensación (ALyC) ni está registrado ante la
            Comisión Nacional de Valores (CNV) como asesor de inversiones. La información provista
            tiene fines exclusivamente informativos y educativos.
          </p>
          <p>
            Las sugerencias de inversión generadas por la plataforma son algorítmicas y no constituyen
            asesoramiento financiero personalizado bajo la Ley 26.831 de Mercado de Capitales.
          </p>
          <p>
            Toda decisión de inversión es responsabilidad exclusiva del usuario. Invertir en instrumentos
            financieros implica riesgos, incluyendo la pérdida parcial o total del capital invertido.
            Los rendimientos pasados no garantizan rendimientos futuros.
          </p>
          <p>
            Para asesoramiento financiero regulado, consultá un ALyC habilitado por la CNV.
          </p>
        </div>
      </section>

      <section id="privacidad" className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Política de privacidad</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-[13px] text-slate-400 leading-relaxed space-y-3">
          <p>
            Recopilamos: email (auth), credenciales de broker (AES-256 encriptadas, solo lectura),
            posiciones del portafolio, presupuesto y metas. No vendemos ni compartimos tus datos con terceros
            salvo proveedores de infraestructura (Supabase, Railway, Vercel, Anthropic).
          </p>
          <p>
            Tus datos se almacenan mientras tengas cuenta activa. Podés solicitar la eliminación en
            cualquier momento escribiendo a{" "}
            <a href="mailto:ingonzalezdamian@gmail.com" className="text-emerald-400 hover:underline">
              ingonzalezdamian@gmail.com
            </a>
            . Respuesta en 72hs hábiles. Ley aplicable: Ley 25.326 de Protección de Datos Personales.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Términos de uso</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-[13px] text-slate-400 leading-relaxed space-y-3">
          <p>Edad mínima: 18 años. Uso personal, no comercial. Un usuario por cuenta.</p>
          <p>
            Podemos modificar o discontinuar el servicio durante la beta con 30 días de aviso previo.
            Nos reservamos el derecho de suspender cuentas por uso abusivo.
          </p>
          <p>Ley aplicable: Argentina. Jurisdicción: Córdoba.</p>
        </div>
      </section>

      <p className="text-[11px] text-slate-600 text-center">
        Documento en expansión — Fase 3 del plan de implementación de la landing.
      </p>
    </main>
  );
}

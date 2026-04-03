export default function LegalPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 pt-28 pb-24 space-y-14">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-100">Legal</h1>
        <p className="text-slate-500 text-sm">Última actualización: Abril 2026 · BuildFuture — Córdoba, Argentina</p>
      </div>

      {/* 1. Disclaimer financiero */}
      <section id="disclaimers" className="space-y-5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-sm">⚠️</span>
          Disclaimer financiero
        </h2>
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-5 space-y-4 text-[13px] text-slate-400 leading-relaxed">
          <p>
            BuildFuture <strong className="text-slate-200">no es una Agente de Liquidación y Compensación (ALyC)</strong> ni
            está registrado ante la Comisión Nacional de Valores (CNV) como asesor de inversiones, tal como
            establece la Ley 26.831 de Mercado de Capitales.
          </p>
          <p>
            La información provista por la plataforma tiene fines <strong className="text-slate-200">exclusivamente informativos
            y educativos</strong>. Las sugerencias de inversión generadas son algorítmicas y no constituyen
            asesoramiento financiero, legal ni impositivo personalizado.
          </p>
          <p>
            <strong className="text-slate-200">Toda decisión de inversión es responsabilidad exclusiva del usuario.</strong>{" "}
            Invertir en instrumentos financieros implica riesgos, incluyendo la pérdida parcial o total del
            capital invertido. Los rendimientos pasados no garantizan rendimientos futuros.
          </p>
          <p>
            Para asesoramiento financiero regulado, consultá un ALyC habilitado por la CNV
            (<a href="https://www.cnv.gov.ar" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">cnv.gov.ar</a>).
          </p>
        </div>
      </section>

      {/* 2. Política de privacidad */}
      <section id="privacidad" className="space-y-5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-sm">🔒</span>
          Política de privacidad
        </h2>
        <p className="text-[13px] text-slate-500">Ley 25.326 de Protección de Datos Personales — Argentina.</p>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-[13px] text-slate-400 leading-relaxed">
            <p className="text-slate-200 font-semibold">¿Qué datos recopilamos?</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left pb-2 pr-4">Dato</th>
                    <th className="text-left pb-2 pr-4">Para qué</th>
                    <th className="text-left pb-2 pr-4">Dónde</th>
                    <th className="text-left pb-2">Retención</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {[
                    ["Email", "Auth, notificaciones", "Supabase Auth (US-East)", "Hasta eliminar cuenta"],
                    ["Credenciales de broker", "Sync solo lectura", "Supabase DB, AES-256", "Hasta revocar"],
                    ["Posiciones del portafolio", "Dashboard, cálculos", "PostgreSQL (Railway)", "Hasta eliminar cuenta"],
                    ["Presupuesto y metas", "Barra de libertad", "PostgreSQL (Railway)", "Hasta eliminar cuenta"],
                    ["Datos de mercado", "Precios, MEP", "Solo en memoria", "No se persisten"],
                  ].map(([dato, para, donde, ret]) => (
                    <tr key={dato} className="border-b border-slate-800/50">
                      <td className="py-2 pr-4 text-slate-300 font-medium">{dato}</td>
                      <td className="py-2 pr-4 text-slate-500">{para}</td>
                      <td className="py-2 pr-4 text-slate-500">{donde}</td>
                      <td className="py-2 text-slate-500">{ret}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-[13px] text-slate-400 leading-relaxed">
            <p className="text-slate-200 font-semibold">¿Compartimos tus datos?</p>
            <p>
              No vendemos ni compartimos información personal con terceros con fines comerciales.
              Usamos los siguientes proveedores de infraestructura:
            </p>
            <ul className="space-y-1 pl-4 list-disc text-slate-500">
              <li><strong className="text-slate-300">Supabase</strong> — autenticación y base de datos (US-East)</li>
              <li><strong className="text-slate-300">Railway</strong> — backend compute</li>
              <li><strong className="text-slate-300">Vercel</strong> — frontend (CDN global)</li>
              <li><strong className="text-slate-300">Anthropic</strong> — sugerencias algorítmicas (solo estructura del portafolio, sin datos personales identificables)</li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-[13px] text-slate-400 leading-relaxed">
            <p className="text-slate-200 font-semibold">Tus derechos</p>
            <p>
              Tenés derecho a acceder, rectificar y eliminar tus datos en cualquier momento.
              Para solicitar la eliminación de tu cuenta y todos los datos asociados, escribí a{" "}
              <a href="mailto:ingonzalezdamian@gmail.com" className="text-emerald-400 hover:underline">ingonzalezdamian@gmail.com</a>.
              Respondemos en 72 horas hábiles.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Términos de uso */}
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">📋</span>
          Términos de uso
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-[13px] text-slate-400 leading-relaxed">
          {[
            ["Edad mínima", "18 años."],
            ["Uso", "Personal, no comercial. Prohibido el scraping o uso automatizado de la plataforma."],
            ["Cuentas", "Una cuenta por usuario. Prohibida la creación de cuentas falsas o en nombre de terceros."],
            ["Continuidad del servicio", "Durante la beta, podemos modificar o discontinuar el servicio con 30 días de aviso previo. Nos reservamos el derecho de suspender cuentas por uso abusivo sin previo aviso."],
            ["Datos de terceros", "Prohibido usar datos obtenidos vía la plataforma con fines comerciales o para entrenar modelos de IA."],
            ["Ley aplicable", "Argentina. Jurisdicción: Córdoba."],
          ].map(([title, text]) => (
            <div key={title} className="space-y-0.5">
              <p className="text-slate-300 font-semibold">{title}</p>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Cookies */}
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">🍪</span>
          Política de cookies
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-[13px] text-slate-400 leading-relaxed">
          <p><strong className="text-slate-200">Cookies funcionales (necesarias):</strong> Gestión de sesión de Supabase Auth. No requieren consentimiento.</p>
          <p><strong className="text-slate-200">Cookies analíticas (opcionales):</strong> Vercel Analytics para métricas de uso anónimas. Podés rechazarlas sin afectar la funcionalidad.</p>
        </div>
      </section>

      <p className="text-[11px] text-slate-700 text-center pt-4">
        ¿Tenés preguntas sobre este documento?{" "}
        <a href="mailto:ingonzalezdamian@gmail.com" className="text-slate-500 hover:text-slate-300 transition-colors">
          ingonzalezdamian@gmail.com
        </a>
      </p>
    </main>
  );
}

"use client";
/**
 * Página de selección de usuario mock — solo accesible con NEXT_PUBLIC_MOCK_AUTH=true.
 * Lee el query param ?user=alias, lo guarda en localStorage, y redirige a /dashboard.
 */
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setMockUser } from "@/lib/api";

const PERSONAS = [
  { alias: "marcos",      label: "Marcos (seed original)",     desc: "LECAP + CEDEAR + AL30, presupuesto configurado",      color: "blue" },
  { alias: "matiasmoron", label: "Matiasmoron (QA tester)",    desc: "$90K en AL30+GD30+ON, metas auto $25K + casa $150K",  color: "violet" },
  { alias: "nuevo",       label: "Nuevo (FTU vacío)",          desc: "Sin posiciones, sin presupuesto, sin metas",           color: "slate" },
  { alias: "renta",       label: "Renta (LECAP+FCI)",          desc: "Renta mensual cubriendo gastos, presupuesto OK",       color: "emerald" },
  { alias: "capital",     label: "Capital (CEDEAR+CRYPTO)",    desc: "$120K en capital puro, renta $0",                     color: "amber" },
  { alias: "mixto",       label: "Mixto avanzado",             desc: "Todo: LETRA+BOND+CEDEAR+ON+FCI+CRYPTO, meta depto",   color: "rose" },
] as const;

const COLOR_MAP: Record<string, string> = {
  blue:    "border-blue-700 bg-blue-950/30 hover:bg-blue-900/30 text-blue-300",
  violet:  "border-violet-700 bg-violet-950/30 hover:bg-violet-900/30 text-violet-300",
  slate:   "border-bf-border-2 bg-bf-surface-2/30 hover:bg-bf-surface-3/30 text-bf-text-2",
  emerald: "border-emerald-700 bg-emerald-950/30 hover:bg-emerald-900/30 text-emerald-300",
  amber:   "border-amber-700 bg-amber-950/30 hover:bg-amber-900/30 text-amber-300",
  rose:    "border-rose-700 bg-rose-950/30 hover:bg-rose-900/30 text-rose-300",
};

function MockLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string | null>(null);

  const isMockMode = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

  // Auto-login si viene el query param ?user=alias
  useEffect(() => {
    if (!isMockMode) { router.replace("/"); return; }
    const user = searchParams.get("user");
    if (user) { login(user); }
    // Leer usuario actual
    const current = localStorage.getItem("bf_mock_user");
    if (current) setActive(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function login(alias: string) {
    setMockUser(alias);
    setActive(alias);
    router.push("/dashboard");
  }

  if (!isMockMode) {
    return (
      <div className="min-h-screen bg-bf-page flex items-center justify-center text-bf-text-3 text-sm">
        Esta página solo existe en modo desarrollo.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bf-page px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <p className="text-[10px] text-rose-500 uppercase tracking-widest font-bold mb-1">
            ⚠ Modo desarrollo — solo local
          </p>
          <h1 className="text-xl font-bold text-bf-text">Seleccionar usuario mock</h1>
          <p className="text-xs text-bf-text-3 mt-1">
            Elegí una persona de QA para explorar distintos estados del producto.
          </p>
        </div>

        <div className="space-y-2">
          {PERSONAS.map((p) => (
            <button
              key={p.alias}
              onClick={() => login(p.alias)}
              className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${COLOR_MAP[p.color]} ${active === p.alias ? "ring-2 ring-white/20" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{p.label}</p>
                {active === p.alias && (
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    activo
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-60 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] text-bf-text-5">
          NEXT_PUBLIC_MOCK_AUTH=true · X-Mock-User header
        </p>
      </div>
    </div>
  );
}

export default function MockLoginPage() {
  return (
    <Suspense>
      <MockLoginContent />
    </Suspense>
  );
}

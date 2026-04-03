"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Wallet, ShieldCheck, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function authFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

const RISK_OPTIONS = [
  {
    value: "conservador",
    label: "Conservador",
    description: "Priorizo preservar el capital. Acepto menor rendimiento a cambio de más estabilidad.",
    color: "border-emerald-700 bg-emerald-950/30 text-emerald-400",
  },
  {
    value: "moderado",
    label: "Moderado",
    description: "Busco un equilibrio entre rendimiento y riesgo. Acepto algo de volatilidad.",
    color: "border-blue-700 bg-blue-950/30 text-blue-400",
  },
  {
    value: "agresivo",
    label: "Agresivo",
    description: "Apunto al máximo crecimiento. Acepto caídas fuertes si el potencial es alto.",
    color: "border-orange-700 bg-orange-950/30 text-orange-400",
  },
];

interface Props {
  hasBudget: boolean;
  hasPortfolio: boolean;
  hasRiskProfile: boolean;
}

export function FTUFlow({ hasBudget, hasPortfolio, hasRiskProfile }: Props) {
  const router = useRouter();
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [savingRisk, setSavingRisk] = useState(false);
  const [riskSaved, setRiskSaved] = useState(hasRiskProfile);
  const [saveError, setSaveError] = useState("");

  async function saveRiskProfile() {
    if (!selectedRisk) return;
    setSavingRisk(true);
    setSaveError("");
    try {
      const res = await authFetch("/profile/", {
        method: "PUT",
        body: JSON.stringify({ risk_profile: selectedRisk }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveError(body.detail || `Error ${res.status} — intentá de nuevo`);
        return;
      }
      setRiskSaved(true);
      localStorage.setItem("bf_risk_profile", selectedRisk);
      window.location.href = "/dashboard";
    } catch {
      setSaveError("No se pudo conectar con el servidor");
    } finally {
      setSavingRisk(false);
    }
  }

  // Budget es opcional: no bloquea el dashboard ni cuenta en el progreso requerido
  const allDone = hasPortfolio && riskSaved;

  return (
    <div className="px-4 pt-8 pb-24 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-bf-text">Casi listo</h1>
        <p className="text-sm text-bf-text-3 mt-1">
          Completá estos pasos para empezar a ver tu dashboard.
        </p>
      </div>

      {/* Progress dots — solo los pasos requeridos */}
      <div className="flex gap-2 items-center">
        {[hasPortfolio, riskSaved].map((done, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              done ? "bg-blue-500" : "bg-bf-surface-3"
            }`}
          />
        ))}
      </div>

      {/* Budget card — opcional */}
      <SetupCard
        done={hasBudget}
        optional
        icon={<BarChart2 size={18} />}
        title="Configurar presupuesto"
        description="Ingresá tus ingresos y gastos para calcular cuánto podés invertir y proyectar tus metas."
        ctaLabel="Ir a presupuesto"
        onCta={() => router.push("/budget")}
      />

      {/* Portfolio card */}
      <SetupCard
        done={hasPortfolio}
        icon={<Wallet size={18} />}
        title="Sincronizar portafolio"
        description="Conectá tu cuenta de InvertirOnline para ver tus posiciones actuales."
        ctaLabel="Ir a configuración"
        onCta={() => router.push("/settings")}
      />

      {/* Risk profile card */}
      <div
        className={`bg-bf-surface rounded-2xl border p-4 space-y-3 ${
          riskSaved ? "border-emerald-800/40 opacity-60" : "border-bf-border"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              riskSaved ? "bg-emerald-900/50 text-emerald-400" : "bg-bf-surface-2 text-blue-400"
            }`}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${riskSaved ? "text-bf-text-3 line-through" : "text-bf-text"}`}>
              Elegir perfil de riesgo
            </p>
            <p className="text-xs text-bf-text-3 mt-0.5">
              Definí tu tolerancia al riesgo para recibir recomendaciones personalizadas.
            </p>
          </div>
        </div>

        {!riskSaved && (
          <>
            <div className="space-y-2">
              {RISK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedRisk(opt.value)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selectedRisk === opt.value
                      ? opt.color
                      : "border-bf-border-2 bg-bf-surface-2/50 text-bf-text-2 hover:border-bf-border-2"
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[11px] text-bf-text-3 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>

            {saveError && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}

            <button
              onClick={saveRiskProfile}
              disabled={!selectedRisk || savingRisk}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {savingRisk && <Loader2 size={14} className="animate-spin" />}
              {savingRisk ? "Guardando..." : "Confirmar perfil"}
            </button>
          </>
        )}
      </div>

      {/* All done CTA */}
      {allDone && (
        <button
          onClick={() => router.refresh()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          Ver mi dashboard
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function SetupCard({
  done,
  optional = false,
  icon,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  done: boolean;
  optional?: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <div
      className={`bg-bf-surface rounded-2xl border p-4 space-y-3 ${
        done ? "border-emerald-800/40 opacity-60" : "border-bf-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            done ? "bg-emerald-900/50 text-emerald-400" : "bg-bf-surface-2 text-blue-400"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${done ? "text-bf-text-3 line-through" : "text-bf-text"}`}>
              {title}
            </p>
            {optional && !done && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-bf-surface-3 text-bf-text-3 font-medium">
                Opcional
              </span>
            )}
          </div>
          <p className="text-xs text-bf-text-3 mt-0.5">{description}</p>
        </div>
      </div>

      {!done && (
        <button
          onClick={onCta}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-bf-surface-2 hover:bg-bf-surface-3 text-bf-text-2 transition-colors border border-bf-border-2"
        >
          {ctaLabel}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

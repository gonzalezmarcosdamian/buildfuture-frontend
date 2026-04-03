"use client";
import { useState, useEffect, useCallback } from "react";
import { Info, X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PerformanceChart } from "./PerformanceChart";
import { PortfolioTabs } from "./PortfolioTabs";

type ViewMode = "composicion" | "rendimientos";
type InfoModal = "tenencia" | "rendimiento" | null;
type Period = "daily" | "monthly" | "annual";

export interface PositionDelta {
  ticker: string;
  asset_type: string;
  source: string;
  value_usd_now: number;
  value_usd_prev: number;
  delta_usd: number;
  delta_pct: number;
  from_date: string;
}

interface Position {
  id: number;
  ticker: string;
  description: string;
  asset_type: string;
  source: string;
  quantity: number;
  current_value_usd: number;
  cost_basis_usd: number;
  performance_pct: number;
  performance_ars_pct: number;
  ppc_ars: number;
  annual_yield_pct: number;
  current_price_usd: number;
  avg_purchase_price_usd: number;
}

interface Props {
  positions: Position[];
  totalUsd: number;
  mep: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: { period: Period; points: any[]; has_data: boolean };
  connectedProviders?: string[];
}

const INFO_CONTENT: Record<NonNullable<InfoModal>, { title: string; items: string[] }> = {
  tenencia: {
    title: "¿Cómo se calcula la tenencia?",
    items: [
      "Valor total del portafolio en cada momento: precio actual × cantidad de cada activo.",
      "Snapshot diario a las 17:30 ART. Hoy se actualiza con precios en tiempo real.",
      "CEDEARs: precio ARS de IOL ÷ MEP del día → USD.",
      "LECAPs y FCI: valor técnico (nominal × precio ARS) ÷ MEP.",
      "Podés ver los valores en USD 🇺🇸 o ARS 🇦🇷 con el selector de moneda.",
    ],
  },
  rendimiento: {
    title: "¿Cómo se calcula el rendimiento del período?",
    items: [
      "Diferencia de valor de cada posición respecto al inicio del período.",
      "Diario: vs ayer · Mensual: vs hace 30 días · Anual: vs hace 365 días.",
      "La barra gris muestra el peso de cada posición en el portafolio total.",
      "Sin historial aún: la primera vez solo se muestra rendimiento desde compra.",
      "Podés ver los valores en USD 🇺🇸 o ARS 🇦🇷 con el selector de moneda.",
    ],
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function PortfolioClient({ positions, totalUsd, mep, history, connectedProviders = [] }: Props) {
  const [mode, setMode] = useState<ViewMode>("composicion");
  const [infoModal, setInfoModal] = useState<InfoModal>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const [positionDeltas, setPositionDeltas] = useState<PositionDelta[]>([]);
  const [deltasLoading, setDeltasLoading] = useState(false);

  const chartMode = mode === "rendimientos" ? "rendimiento" : "tenencia";
  const activeInfoKey: NonNullable<InfoModal> = mode === "rendimientos" ? "rendimiento" : "tenencia";
  const info = INFO_CONTENT[activeInfoKey];

  const fetchDeltas = useCallback(async (p: Period) => {
    setDeltasLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const tok = session.session?.access_token;
      const res = await fetch(`${API_URL}/portfolio/positions/delta?period=${p}`, {
        headers: tok ? { Authorization: `Bearer ${tok}` } : {},
      });
      if (!res.ok) return;
      const json = await res.json();
      setPositionDeltas(json.positions ?? []);
    } catch {
      // silencioso — fallback a desde-compra en PortfolioTabs
    } finally {
      setDeltasLoading(false);
    }
  }, []);

  // Cargar deltas al entrar en rendimientos o cambiar período
  useEffect(() => {
    if (mode === "rendimientos") {
      fetchDeltas(period);
    }
  }, [mode, period, fetchDeltas]);

  function handlePeriodChange(p: Period) {
    setPeriod(p);
  }

  return (
    <div className="space-y-3">
      {/* Unified switch + info icon */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 bg-slate-900 rounded-xl p-1 border border-slate-800 gap-1">
          {(["composicion", "rendimientos"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setInfoModal(null); }}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                mode === m ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {m === "composicion" ? "Composición" : "Rendimientos"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setInfoModal(infoModal === activeInfoKey ? null : activeInfoKey)}
          className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Cómo se calcula"
        >
          <Info size={15} />
        </button>
      </div>

      {/* Info modal inline */}
      {infoModal && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-xs space-y-2.5 relative">
          <button
            onClick={() => setInfoModal(null)}
            className="absolute top-3 right-3 text-slate-500 hover:text-slate-300"
          >
            <X size={14} />
          </button>
          <p className="font-semibold text-slate-200 pr-5">{info.title}</p>
          <ul className="space-y-1.5">
            {info.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-slate-400">
                <span className="text-blue-500 mt-px shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chart — period controlled from here */}
      <PerformanceChart
        initialData={history}
        mep={mep}
        chartMode={chartMode}
        period={period}
        onPeriodChange={handlePeriodChange}
      />

      {/* Assets list */}
      <PortfolioTabs
        positions={positions}
        totalUsd={totalUsd}
        mep={mep}
        activeTab={mode}
        connectedProviders={connectedProviders}
        period={period}
        positionDeltas={positionDeltas}
        deltasLoading={deltasLoading}
      />

      {/* Agregar posición manual — próximamente */}
      <div className="w-full flex items-center gap-3 p-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl opacity-50 cursor-not-allowed">
        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-600">
          <Plus size={16} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Agregar posición manual</p>
          <p className="text-[10px] text-slate-600">
            Próximamente · Cripto, FCI, ETFs internacionales y más
          </p>
        </div>
      </div>
    </div>
  );
}

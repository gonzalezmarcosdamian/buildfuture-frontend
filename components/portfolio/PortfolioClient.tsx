"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";
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
      {/* Switch — solo Composición por ahora; Rendimientos temporalmente oculto */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 bg-bf-surface rounded-xl p-1 border border-bf-border gap-1">
          <button
            className="flex-1 text-xs py-1.5 rounded-lg font-medium bg-bf-surface-3 text-bf-text"
          >
            Composición
          </button>
        </div>
        <button
          onClick={() => setInfoModal(infoModal === "tenencia" ? null : "tenencia")}
          className="w-7 h-7 flex items-center justify-center rounded-full text-bf-text-3 hover:text-bf-text-2 hover:bg-bf-surface-2 transition-colors flex-shrink-0"
          aria-label="Cómo se calcula"
        >
          <Info size={15} />
        </button>
      </div>

      {/* Info modal inline */}
      {infoModal && (
        <div className="bg-bf-surface-2/80 border border-bf-border-2 rounded-2xl p-4 text-xs space-y-2.5 relative">
          <button
            onClick={() => setInfoModal(null)}
            className="absolute top-3 right-3 text-bf-text-3 hover:text-bf-text-2"
          >
            <X size={14} />
          </button>
          <p className="font-semibold text-bf-text-2 pr-5">{INFO_CONTENT.tenencia.title}</p>
          <ul className="space-y-1.5">
            {INFO_CONTENT.tenencia.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-bf-text-3">
                <span className="text-blue-500 mt-px shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chart — solo tenencia */}
      <PerformanceChart
        initialData={history}
        mep={mep}
        chartMode="tenencia"
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

      {/* Agregar posición manual — carrusel */}
      <div className="space-y-2">
        <p className="text-[10px] text-bf-text-4 uppercase tracking-widest px-1">Agregar manualmente</p>
        <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            { mode: "CASH",        icon: "💵", label: "Efectivo",  sub: "ARS o USD",      live: true  },
            { mode: "CRYPTO",      icon: "₿",  label: "Cripto",    sub: "Precio en vivo", live: true  },
            { mode: "REAL_ESTATE", icon: "🏠", label: "Inmueble",  sub: "Con renta",      live: true  },
            { mode: "FCI",         icon: "📈", label: "FCI",       sub: "Próximamente",   live: false },
            { mode: "ETF",         icon: "🌎", label: "ETF",       sub: "Próximamente",   live: false },
          ] as const).map(({ mode, icon, label, sub, live }) =>
            live ? (
              <Link
                key={mode}
                href={`/portfolio/add-manual?mode=${mode}`}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-bf-surface border border-bf-border hover:border-bf-border-2 hover:bg-bf-surface-2 transition-colors shrink-0 min-w-[80px]"
              >
                <span className="text-xl leading-none">{icon}</span>
                <p className="text-[11px] font-semibold text-bf-text-2">{label}</p>
                <p className="text-[9px] text-bf-text-4 text-center leading-tight">{sub}</p>
              </Link>
            ) : (
              <div
                key={mode}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-bf-surface border border-bf-border opacity-35 shrink-0 min-w-[80px]"
              >
                <span className="text-xl leading-none">{icon}</span>
                <p className="text-[11px] font-semibold text-bf-text-2">{label}</p>
                <p className="text-[9px] text-bf-text-4 text-center leading-tight">{sub}</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

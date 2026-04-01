"use client";
import { useState } from "react";
import { Info, X, Clock, Wrench } from "lucide-react";
import { PerformanceChart } from "./PerformanceChart";
import { PortfolioTabs } from "./PortfolioTabs";

type ViewMode = "composicion" | "rendimientos";
type InfoModal = "tenencia" | "rendimiento" | null;

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
  annual_yield_pct: number;
  current_price_usd: number;
  avg_purchase_price_usd: number;
}

interface Props {
  positions: Position[];
  totalUsd: number;
  mep: number;
  history: { period: "daily" | "monthly" | "annual"; points: any[]; has_data: boolean };
}

const INFO_CONTENT: Record<NonNullable<InfoModal>, { title: string; items: string[] }> = {
  tenencia: {
    title: "¿Cómo se calcula la tenencia?",
    items: [
      "Snapshot diario capturado a las 17:30 ART (cierre del mercado).",
      "Cada posición: precio de cierre × cantidad, convertido a USD con el MEP del día.",
      "CEDEARs: precio en ARS desde IOL ÷ MEP vigente.",
      "LECAPs y FCI: valor técnico (nominal × precio de cierre ARS) ÷ MEP.",
      "Total = suma de todas las posiciones en USD.",
    ],
  },
  rendimiento: {
    title: "¿Cómo se calcula el rendimiento del día?",
    items: [
      "Diferencia entre la tenencia de hoy y la del día anterior.",
      "Barra verde: el portafolio creció ese día. Roja: bajó.",
      "LECAPs y FCI: acumulan interés diario (TNA ÷ 365) — casi siempre verde.",
      "CEDEARs: refleja el movimiento del subyacente en USD (via precio IOL).",
      "Porcentaje = variación ÷ tenencia del día anterior × 100.",
    ],
  },
};

export function PortfolioClient({ positions, totalUsd, mep, history }: Props) {
  const [mode, setMode] = useState<ViewMode>("composicion");
  const [infoModal, setInfoModal] = useState<InfoModal>(null);

  const chartMode = mode === "rendimientos" ? "rendimiento" : "tenencia";
  const activeInfoKey: NonNullable<InfoModal> = mode === "rendimientos" ? "rendimiento" : "tenencia";
  const info = INFO_CONTENT[activeInfoKey];

  return (
    <div className="space-y-3">
      {/* Unified switch + info icon */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 bg-slate-900 rounded-xl p-1 border border-slate-800 gap-1">
          {(["composicion", "rendimientos"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
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

      {/* Chart — mode controlled externally */}
      <PerformanceChart initialData={history} mep={mep} chartMode={chartMode} />

      {/* Assets list — tab controlled externally */}
      <PortfolioTabs positions={positions} totalUsd={totalUsd} mep={mep} activeTab={mode} />

      {/* Coming soon: ingreso manual */}
      <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
          <Wrench size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-semibold text-slate-400">Ingreso manual de tenencias</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center gap-1">
              <Clock size={9} /> Próximamente
            </span>
          </div>
          <p className="text-[10px] text-slate-600">
            Agregá posiciones en FCI, cripto u otros activos sin API directa.
          </p>
        </div>
      </div>
    </div>
  );
}

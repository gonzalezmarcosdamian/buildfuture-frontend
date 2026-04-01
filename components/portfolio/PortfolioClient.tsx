"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, X, Plus } from "lucide-react";
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
  history: { period: "daily" | "monthly" | "annual"; points: Record<string, unknown>[]; has_data: boolean };
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
    title: "¿Cómo se calcula el rendimiento del día?",
    items: [
      "Diferencia entre la tenencia de hoy y la del día anterior.",
      "Barra verde: el portafolio creció ese día. Roja: bajó.",
      "LECAPs y FCI: acumulan interés diario (TNA ÷ 365) — casi siempre verde.",
      "CEDEARs: refleja el movimiento del subyacente en USD (via precio IOL).",
      "Podés ver los valores en USD 🇺🇸 o ARS 🇦🇷 con el selector de moneda.",
    ],
  },
};

export function PortfolioClient({ positions, totalUsd, mep, history }: Props) {
  const [mode, setMode] = useState<ViewMode>("composicion");
  const [infoModal, setInfoModal] = useState<InfoModal>(null);
  const router = useRouter();

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

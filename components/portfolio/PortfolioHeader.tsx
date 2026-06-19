"use client";
import { useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { RentaInfoButton } from "@/components/portfolio/RentaModal";
import { formatUSD, formatARS, formatPct } from "@/lib/formatters";
import { AlertTriangle, Clock, Info, X } from "lucide-react";

const TOTAL_INFO: string[] = [
  "Suma el valor de HOY de todas tus posiciones: precio actual × cantidad.",
  "Incluye todas tus fuentes: brokers conectados (IOL, Cocos, PPI, Binance) y tus cargas manuales (efectivo, cripto, inmuebles).",
  "Renta mensual: lo que generan tus instrumentos de renta (LECAP, FCI, bonos), ajustado por la devaluación esperada para mostrarlo en USD real.",
  "Capital acumulado: CEDEARs, ETFs, cripto y efectivo.",
  "El gráfico de abajo solo dibuja el historial de fuentes con movimientos (IOL, Binance); el resto está en este total pero no en la curva.",
];

const STALE_DAYS = 3; // días sin sync → alerta

function useSyncStatus(lastSyncedDate: string | null | undefined) {
  if (!lastSyncedDate) return { label: null, stale: false, daysSince: null };
  const last = new Date(lastSyncedDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - last.getTime()) / 86_400_000);
  const isToday = daysSince === 0;
  const label = isToday
    ? "Actualizado hoy"
    : daysSince === 1
    ? "Actualizado ayer"
    : `Hace ${daysSince} días`;
  return { label, stale: daysSince >= STALE_DAYS, daysSince };
}

const RENTA_TYPES = new Set(["LETRA", "FCI"]);
const CAPITAL_TYPES = new Set(["CEDEAR", "ETF", "CRYPTO"]);

interface Position {
  ticker: string;
  asset_type: string;
  current_value_usd: number;
  annual_yield_pct: number;
}

interface Props {
  totalUsd: number;
  totalArs?: number | null;
  monthlyReturnUsd: number;
  annualReturnPct: number;
  freedomPct: number;
  mep: number;
  positions: Position[];
  capitalTotalUsd?: number | null;
  cashTotalUsd?: number | null;
  expectedDevaluationPct?: number;
  lastSyncedDate?: string | null;
}

export function PortfolioHeader({
  totalUsd,
  totalArs,
  monthlyReturnUsd,
  annualReturnPct,
  freedomPct,
  mep,
  positions,
  capitalTotalUsd,
  cashTotalUsd,
  expectedDevaluationPct = 0.20,
  lastSyncedDate,
}: Props) {
  const { currency } = useCurrency();
  const sync = useSyncStatus(lastSyncedDate);
  const [showTotalInfo, setShowTotalInfo] = useState(false);

  // Renta fija: LETRA/FCI/BOND con yield ajustado por devaluación esperada (valor dinámico del servidor).
  // Misma fórmula que split_portfolio_buckets en backend:
  //   real_usd_yield = (1 + TNA_ARS) / (1 + devaluation_anual) - 1
  // expectedDevaluationPct viene de GET /portfolio/ → summary.expected_devaluation_pct
  const monthlyRentaFija = positions
    .filter((p) => RENTA_TYPES.has(p.asset_type) || p.asset_type === "BOND")
    .reduce((s, p) => {
      const y = p.annual_yield_pct;
      const realUsdYield = Math.max(0, (1 + y) / (1 + expectedDevaluationPct) - 1);
      const monthly = p.asset_type === "BOND"
        ? (p.current_value_usd * realUsdYield * 0.5) / 12
        : (p.current_value_usd * realUsdYield) / 12;
      return s + monthly;
    }, 0);

  // Capital: CEDEAR + ETF + CRYPTO + CASH (del prop o calculado inline)
  const capitalBase = capitalTotalUsd ?? positions
    .filter((p) => CAPITAL_TYPES.has(p.asset_type))
    .reduce((s, p) => s + p.current_value_usd, 0);
  const cashUsd = cashTotalUsd ?? positions
    .filter((p) => p.asset_type === "CASH")
    .reduce((s, p) => s + p.current_value_usd, 0);
  const capitalUsd = capitalTotalUsd != null ? capitalBase : capitalBase + cashUsd;

  const totalArsDisplay = totalArs ?? totalUsd * mep;
  const fmt = (usd: number) =>
    currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);
  const total = currency === "USD" ? formatUSD(totalUsd) : formatARS(totalArsDisplay);
  const hint  = currency === "USD" ? `≈ ${formatARS(totalArsDisplay)}` : `≈ ${formatUSD(totalUsd)}`;

  return (
    <div className="bg-bf-surface rounded-2xl border border-bf-border overflow-hidden bf-card-elevated">
      {/* ── Total + toggle ─────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">Portafolio total</p>
          <button
            onClick={() => setShowTotalInfo((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-bf-text-3 hover:text-bf-text-2 hover:bg-bf-surface-2 transition-colors shrink-0"
            aria-label="Qué incluye tu total"
          >
            <Info size={13} />
          </button>
          <CurrencyToggle />
        </div>
        <p className="text-3xl font-extrabold text-bf-text">{total}</p>
        <p className="text-[10px] text-bf-text-3 mt-0.5">{hint}</p>

        {showTotalInfo && (
          <div className="relative mt-3 bg-bf-surface-2/80 border border-bf-border-2 rounded-2xl p-4 text-xs space-y-2.5">
            <button
              onClick={() => setShowTotalInfo(false)}
              className="absolute top-3 right-3 text-bf-text-3 hover:text-bf-text-2"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
            <p className="font-semibold text-bf-text-2 pr-5">Qué incluye tu total</p>
            <ul className="space-y-1.5">
              {TOTAL_INFO.map((item, i) => (
                <li key={i} className="flex gap-2 text-bf-text-3">
                  <span className="text-blue-500 mt-px shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ══ RENTA ══════════════════════════════════════════ */}
      <div className="border-t border-bf-border/80">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-emerald-500 rounded-full" />
            <p className="text-[10px] text-bf-text-3 uppercase tracking-wider font-semibold">Renta mensual</p>
            <RentaInfoButton mep={mep} />
          </div>
          <div className="flex items-end gap-1">
            <span className="text-lg font-bold text-bf-renta">{fmt(monthlyReturnUsd)}</span>
            <span className="text-[10px] text-bf-text-3 pb-0.5">/mes</span>
          </div>
        </div>

        <div className="px-5 pb-3 grid grid-cols-2 gap-3">
          <div className="bg-bf-surface-2/40 rounded-xl px-3 py-2 text-center">
            <p className="text-[9px] text-bf-text-3 mb-0.5">Renta / año</p>
            <p className="text-sm font-semibold text-bf-renta">{fmt(monthlyReturnUsd * 12)}</p>
          </div>
          <div className="bg-bf-surface-2/40 rounded-xl px-3 py-2 text-center">
            <p className="text-[9px] text-bf-text-3 mb-0.5 flex items-center justify-center gap-1">
              Cobertura gastos
              <span
                title="% de tus gastos mensuales cubiertos por la renta de tu portafolio. 100% = libertad financiera."
                className="inline-flex items-center justify-center w-3 h-3 rounded-full border border-bf-text-3 text-bf-text-3 cursor-help leading-none text-[7px]"
              >?</span>
            </p>
            <p className="text-sm font-semibold text-bf-capital">{formatPct(freedomPct)}</p>
          </div>
        </div>

        {/* Desglose fija vs estimada */}
        {monthlyRentaFija > 0.01 && (
          <div className="px-5 pb-3 flex gap-3">
            <span className="text-[9px] text-bf-renta/70">
              {fmt(monthlyRentaFija)} renta fija (LECAP/FCI)
            </span>
            {annualReturnPct > 0 && (
              <span className="text-[9px] text-bf-text-4">
                · yield portafolio {(annualReturnPct * 100).toFixed(2)}% anual
              </span>
            )}
          </div>
        )}
      </div>

      {/* ══ CAPITAL ════════════════════════════════════════ */}
      <div className="border-t-2 border-bf-border-2/60">
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-violet-500 rounded-full" />
            <p className="text-[10px] text-bf-text-3 uppercase tracking-wider font-semibold">Capital acumulado</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-bf-capital">{fmt(capitalUsd)}</p>
            <p className="text-[9px] text-bf-text-4">CEDEARs · ETFs · Crypto{cashUsd > 0 ? " · Cash" : ""}</p>
          </div>
        </div>
      </div>

      {/* ══ SYNC STATUS ══════════════════════════════════════ */}
      {sync.label && (
        <div className="border-t border-bf-border/40 px-5 py-2.5">
          {sync.stale ? (
            <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-800/50 rounded-xl px-3 py-2">
              <AlertTriangle size={13} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-amber-300">
                  Datos desactualizados · {sync.label}
                </p>
                <p className="text-[10px] text-amber-400/70">
                  Sincronizá tu broker para ver valores actuales
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-bf-text-4" />
              <p className="text-[10px] text-bf-text-4">{sync.label}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

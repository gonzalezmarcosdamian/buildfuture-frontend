"use client";

import { TrendingUp, TrendingDown, Zap, Shield, Droplets, RefreshCw } from "lucide-react";
import { formatUSD, formatARS, formatPct } from "@/lib/formatters";
import { useCurrency } from "@/lib/currency-context";

interface InstrumentData {
  ticker: string;
  description: string;
  asset_type: string;
  source: string;
  quantity: number;
  ppc_ars: number;
  purchase_fx_rate: number;
  avg_purchase_price_usd: number;
  current_price_usd: number;
  current_value_usd: number;
  cost_basis_usd: number;
  performance_pct: number;
  pnl_usd: number;
  annual_yield_pct: number;
  monthly_return_usd: number;
  last_updated: string | null;
  mep: number;
  context: {
    type_label: string;
    full_name: string;
    description: string;
    currency_note: string;
    liquidity: string;
  };
}

const ASSET_BADGES: Record<string, string> = {
  CEDEAR: "bg-blue-900 text-blue-300",
  BOND:   "bg-purple-900 text-purple-300",
  LETRA:  "bg-yellow-900 text-yellow-300",
  CRYPTO: "bg-orange-900 text-orange-300",
  FCI:    "bg-green-900 text-green-300",
  CASH:   "bg-slate-700 text-slate-300",
};

const FLAG: Record<"USD" | "ARS", string> = { USD: "🇺🇸", ARS: "🇦🇷" };

function MetricRow({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: "green" | "red" | null;
}) {
  const valueClass = highlight === "green"
    ? "text-emerald-400 font-semibold"
    : highlight === "red"
    ? "text-red-400 font-semibold"
    : "text-slate-100 font-semibold";

  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="text-right">
        <span className={`text-xs ${valueClass}`}>{value}</span>
        {sub && <p className="text-[10px] text-slate-600 mt-px">{sub}</p>}
      </div>
    </div>
  );
}

function PositionMetrics({ inst, fmt, hint, currency }: {
  inst: InstrumentData;
  fmt: (usd: number) => string;
  hint: (usd: number) => string;
  currency: "USD" | "ARS";
}) {
  const isFCI   = inst.asset_type === "FCI";
  const isLETRA = inst.asset_type === "LETRA";
  const isCEDEAR = inst.asset_type === "CEDEAR";

  // Para FCI: current_price_usd = vcp / mep → vcp_ars = current_price_usd * mep
  const vcp_ars = isFCI ? inst.current_price_usd * inst.mep : null;
  // Para FCI: ppc_ars es el VCP al momento de la compra
  const vcp_compra_ars = isFCI ? inst.ppc_ars : null;
  // Tenencia valorizada en ARS = cuotapartes × VCP actual
  const tenencia_ars = isFCI && vcp_ars ? inst.quantity * vcp_ars : null;

  // Para LETRA: IOL cotiza per 100 nominales
  const ppc_unitario = isLETRA
    ? `$${(inst.ppc_ars / 100).toLocaleString("es-AR", { maximumFractionDigits: 4 })} c/u`
    : null;

  if (isFCI) {
    return (
      <>
        <MetricRow
          label="Cuotapartes"
          value={inst.quantity.toLocaleString("es-AR", { maximumFractionDigits: 6 })}
        />
        <MetricRow
          label="VCP actual"
          value={`$${vcp_ars!.toLocaleString("es-AR", { maximumFractionDigits: 4 })} ARS`}
          sub={`MEP actual: $${inst.mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
        />
        <MetricRow
          label="VCP de compra"
          value={`$${vcp_compra_ars!.toLocaleString("es-AR", { maximumFractionDigits: 4 })} ARS`}
          sub={`MEP compra: $${inst.purchase_fx_rate.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
        />
        <MetricRow
          label="Tenencia valorizada"
          value={`🇦🇷 ${formatARS(tenencia_ars!)}`}
          sub={`≈ ${FLAG[currency]} ${fmt(inst.current_value_usd)}`}
        />
        <MetricRow
          label="Costo base"
          value={`${FLAG[currency]} ${fmt(inst.cost_basis_usd)}`}
          sub={hint(inst.cost_basis_usd)}
        />
        <MetricRow
          label="Ganancia neta"
          value={`${inst.pnl_usd >= 0 ? "+" : ""}${FLAG[currency]} ${fmt(inst.pnl_usd)}`}
          sub={`${formatPct(inst.performance_pct, 2, true)} · ${hint(inst.pnl_usd)}`}
          highlight={inst.pnl_usd >= 0 ? "green" : "red"}
        />
        <MetricRow
          label="Renta mensual estimada"
          value={`${FLAG[currency]} ${fmt(inst.monthly_return_usd)}`}
          sub={`TNA ${(inst.annual_yield_pct * 100).toFixed(2)}%`}
          highlight={inst.monthly_return_usd > 0 ? "green" : null}
        />
      </>
    );
  }

  // CEDEAR, LETRA, BOND, CRYPTO, ETF
  return (
    <>
      <MetricRow
        label="Cantidad"
        value={`${inst.quantity.toLocaleString("es-AR", { maximumFractionDigits: 6 })} u.`}
      />
      {inst.ppc_ars > 0 ? (
        <MetricRow
          label={isLETRA ? "PPC (por 100 nominales)" : "PPC"}
          value={`$${inst.ppc_ars.toLocaleString("es-AR", { maximumFractionDigits: 2 })} ARS`}
          sub={isLETRA && ppc_unitario
            ? `${ppc_unitario} · MEP compra: $${inst.purchase_fx_rate.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
            : isCEDEAR
            ? `MEP compra: $${inst.purchase_fx_rate.toLocaleString("es-AR", { maximumFractionDigits: 0 })} → USD ${formatUSD(inst.ppc_ars / inst.purchase_fx_rate)}`
            : undefined
          }
        />
      ) : (
        <MetricRow
          label="Precio de compra"
          value={`${FLAG.USD} ${formatUSD(inst.avg_purchase_price_usd)}`}
        />
      )}
      <MetricRow
        label="Costo base"
        value={`${FLAG[currency]} ${fmt(inst.cost_basis_usd)}`}
        sub={hint(inst.cost_basis_usd)}
      />
      <MetricRow
        label="Precio actual"
        value={`${FLAG[currency]} ${fmt(inst.current_price_usd)}`}
      />
      <MetricRow
        label="Tenencia valorizada"
        value={`${FLAG[currency]} ${fmt(inst.current_value_usd)}`}
        sub={hint(inst.current_value_usd)}
      />
      <MetricRow
        label="Ganancia neta"
        value={`${inst.pnl_usd >= 0 ? "+" : ""}${FLAG[currency]} ${fmt(inst.pnl_usd)}`}
        sub={`${formatPct(inst.performance_pct, 2, true)} · ${hint(inst.pnl_usd)}`}
        highlight={inst.pnl_usd >= 0 ? "green" : "red"}
      />
      <MetricRow
        label="Renta mensual estimada"
        value={`${FLAG[currency]} ${fmt(inst.monthly_return_usd)}`}
        sub={`TNA ${(inst.annual_yield_pct * 100).toFixed(2)}%`}
        highlight={inst.monthly_return_usd > 0 ? "green" : null}
      />
    </>
  );
}

export function InstrumentDetail({ instrument: inst }: { instrument: InstrumentData }) {
  const { currency } = useCurrency();

  const fmt = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(usd * inst.mep);
  const hint = (usd: number) => currency === "USD"
    ? `≈ ${FLAG.ARS} ${formatARS(usd * inst.mep)}`
    : `≈ ${FLAG.USD} ${formatUSD(usd)}`;

  const positive = inst.performance_pct >= 0;
  const pnlSign  = inst.pnl_usd >= 0;

  const pnlLabel = inst.asset_type === "FCI"
    ? "Ganancia / Pérdida vs VCP compra"
    : inst.asset_type === "CEDEAR"
    ? "Ganancia / Pérdida vs PPC (ARS/MEP)"
    : "Ganancia / Pérdida vs precio compra";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-100">{inst.ticker}</h1>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ASSET_BADGES[inst.asset_type] || "bg-slate-700 text-slate-300"}`}>
                {inst.context.type_label}
              </span>
            </div>
            <p className="text-xs text-slate-400">{inst.description}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-slate-100">
              {FLAG[currency]} {fmt(inst.current_value_usd)}
            </p>
            <p className="text-[10px] text-slate-500">{hint(inst.current_value_usd)}</p>
          </div>
        </div>

        {/* P&L hero */}
        <div className={`rounded-xl p-3 flex items-center justify-between ${
          pnlSign ? "bg-emerald-950/40 border border-emerald-900/40" : "bg-red-950/40 border border-red-900/40"
        }`}>
          <div className="flex items-center gap-2">
            {pnlSign ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
            <div>
              <p className="text-[10px] text-slate-500">{pnlLabel}</p>
              <p className={`text-sm font-bold ${pnlSign ? "text-emerald-400" : "text-red-400"}`}>
                {pnlSign ? "+" : ""}{FLAG[currency]} {fmt(inst.pnl_usd)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 text-right">Rendimiento</p>
            <p className={`text-sm font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
              {formatPct(inst.performance_pct, 2, true)}
            </p>
          </div>
        </div>
      </div>

      {/* Position metrics — layout según tipo */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Mi posición</p>
        <PositionMetrics inst={inst} fmt={fmt} hint={hint} currency={currency} />
      </div>

      {/* Asset context */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sobre este instrumento</p>
        <p className="text-xs text-slate-300">{inst.context.description}</p>
        {inst.context.currency_note && (
          <div className="flex items-start gap-2">
            <RefreshCw size={12} className="text-slate-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-500">{inst.context.currency_note}</p>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Droplets size={12} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-500">
            <span className="text-slate-400">Liquidez:</span> {inst.context.liquidity}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Zap size={12} className="text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-500">
            <span className="text-slate-400">Fuente de datos:</span> {inst.source}
          </p>
        </div>
      </div>

      {/* MEP footer */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={13} className="text-slate-500" />
          <span className="text-xs text-slate-500">MEP actual</span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          ${inst.mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })} ARS/USD
        </span>
      </div>

      {inst.last_updated && (
        <p className="text-[10px] text-slate-700 text-center">
          Última actualización: {new Date(inst.last_updated).toLocaleDateString("es-AR")}
        </p>
      )}
    </div>
  );
}

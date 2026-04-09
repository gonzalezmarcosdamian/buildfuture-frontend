"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Zap, Shield, Droplets, RefreshCw, AlertTriangle, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatUSD, formatARS, formatPct } from "@/lib/formatters";
import { useCurrency } from "@/lib/currency-context";
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

interface InstrumentData {
  id: number;
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
  maturity_date: string | null;
  days_to_maturity: number | null;
  context: {
    type_label: string;
    full_name: string;
    description: string;
    currency_note: string;
    liquidity: string;
  };
}

const ASSET_BADGES: Record<string, string> = {
  CEDEAR:      "bg-blue-900 text-blue-300",
  BOND:        "bg-purple-900 text-purple-300",
  LETRA:       "bg-yellow-900 text-yellow-300",
  CRYPTO:      "bg-orange-900 text-orange-300",
  FCI:         "bg-green-900 text-green-300",
  CASH:        "bg-bf-surface-3 text-bf-text-2",
  REAL_ESTATE: "bg-amber-900/60 text-amber-300",
};

const FLAG: Record<"USD" | "ARS", string> = { USD: "🇺🇸", ARS: "🇦🇷" };

function MetricRow({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: "green" | "red" | null;
}) {
  const valueClass = highlight === "green"
    ? "text-emerald-400 font-semibold"
    : highlight === "red"
    ? "text-red-400 font-semibold"
    : "text-bf-text font-semibold";

  return (
    <div className="flex items-start justify-between py-2.5 border-b border-bf-border last:border-0">
      <span className="text-xs text-bf-text-3">{label}</span>
      <div className="text-right">
        <span className={`text-xs ${valueClass}`}>{value}</span>
        {sub && <p className="text-[10px] text-bf-text-4 mt-px">{sub}</p>}
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
  const isREAL_ESTATE = inst.asset_type === "REAL_ESTATE";
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

  if (isREAL_ESTATE) {
    const yieldPct = inst.annual_yield_pct * 100;
    const monthlyRent = inst.monthly_return_usd;
    return (
      <>
        <MetricRow
          label="Valuación del inmueble"
          value={`${FLAG.USD} ${fmt(inst.current_value_usd)}`}
          sub={hint(inst.current_value_usd)}
        />
        <MetricRow
          label="Renta mensual estimada"
          value={`${FLAG.USD} ${fmt(monthlyRent)}`}
          sub={`Yield anual: ${yieldPct.toFixed(2)}%`}
          highlight={monthlyRent > 0 ? "green" : null}
        />
        <MetricRow
          label="Renta anual estimada"
          value={`${FLAG.USD} ${fmt(monthlyRent * 12)}`}
          sub={hint(monthlyRent * 12)}
          highlight={monthlyRent > 0 ? "green" : null}
        />
        <MetricRow
          label="Yield anual"
          value={`${yieldPct.toFixed(2)}%`}
          sub="Calculado sobre la valuación"
        />
      </>
    );
  }

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
  const maturitySub = isLETRA && inst.maturity_date
    ? `Vence ${new Date(inst.maturity_date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}${inst.days_to_maturity !== null ? ` · ${inst.days_to_maturity} días` : ""}`
    : undefined;

  const rentaSub = isLETRA
    ? `TNA ${(inst.annual_yield_pct * 100).toFixed(2)}%${maturitySub ? ` · ${maturitySub}` : ""}`
    : inst.asset_type === "BOND"
    ? `YTM ${(inst.annual_yield_pct * 100).toFixed(2)}% · cupones semestrales`
    : `TNA ${(inst.annual_yield_pct * 100).toFixed(2)}%`;

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
        sub={rentaSub}
        highlight={inst.monthly_return_usd > 0 ? "green" : null}
      />
    </>
  );
}

export function InstrumentDetail({ instrument: inst }: { instrument: InstrumentData }) {
  const { currency } = useCurrency();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fmt = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(usd * inst.mep);
  const hint = (usd: number) => currency === "USD"
    ? `≈ ${FLAG.ARS} ${formatARS(usd * inst.mep)}`
    : `≈ ${FLAG.USD} ${formatUSD(usd)}`;

  const isManual = inst.source === "MANUAL";
  const isRealEstate = inst.asset_type === "REAL_ESTATE";
  const positive = inst.performance_pct >= 0;
  const pnlSign  = inst.pnl_usd >= 0;

  const pnlLabel = inst.asset_type === "FCI"
    ? "Ganancia / Pérdida vs VCP compra"
    : inst.asset_type === "CEDEAR"
    ? "Ganancia / Pérdida vs PPC (ARS/MEP)"
    : "Ganancia / Pérdida vs precio compra";

  async function handleDelete() {
    if (!confirm("¿Eliminar esta posición? Esta acción no se puede deshacer.")) return;
    setDeleting(true); setDeleteError("");
    try {
      const res = await authFetch(`/positions/manual/${inst.id}`, { method: "DELETE" });
      if (!res.ok) { setDeleteError("No se pudo eliminar"); setDeleting(false); return; }
      router.push("/portfolio");
      router.refresh();
    } catch { setDeleteError("Error de conexión"); setDeleting(false); }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-bf-surface rounded-2xl border border-bf-border p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-bf-text">{isRealEstate ? inst.description : inst.ticker}</h1>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ASSET_BADGES[inst.asset_type] || "bg-bf-surface-3 text-bf-text-2"}`}>
                {inst.context.type_label}
              </span>
              {inst.asset_type === "LETRA" && inst.days_to_maturity !== null && inst.days_to_maturity <= 60 && inst.days_to_maturity > 0 && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-900/60 text-amber-300 border border-amber-700/40">
                  <AlertTriangle size={9} />
                  Rolleo en {inst.days_to_maturity}d
                </span>
              )}
              {inst.asset_type === "LETRA" && inst.days_to_maturity !== null && inst.days_to_maturity <= 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-900/60 text-red-300 border border-red-700/40">
                  Vencida
                </span>
              )}
            </div>
            {isRealEstate
              ? <p className="text-xs text-bf-text-4">{inst.ticker}</p>
              : <p className="text-xs text-bf-text-3">{inst.description}</p>
            }
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-bf-text">
              {FLAG[currency]} {fmt(inst.current_value_usd)}
            </p>
            <p className="text-[10px] text-bf-text-3">{hint(inst.current_value_usd)}</p>
          </div>
        </div>

        {/* P&L hero — oculto para REAL_ESTATE (siempre $0, sin sentido) */}
        {!isRealEstate && (
          <div className={`rounded-xl p-3 flex items-center justify-between ${
            pnlSign ? "bg-emerald-950/40 border border-emerald-900/40" : "bg-red-950/40 border border-red-900/40"
          }`}>
            <div className="flex items-center gap-2">
              {pnlSign ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
              <div>
                <p className="text-[10px] text-bf-text-3">{pnlLabel}</p>
                <p className={`text-sm font-bold ${pnlSign ? "text-emerald-400" : "text-red-400"}`}>
                  {pnlSign ? "+" : ""}{FLAG[currency]} {fmt(inst.pnl_usd)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-bf-text-3 text-right">Rendimiento</p>
              <p className={`text-sm font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {formatPct(inst.performance_pct, 2, true)}
              </p>
            </div>
          </div>
        )}

        {/* Renta hero para REAL_ESTATE */}
        {isRealEstate && inst.monthly_return_usd > 0 && (
          <div className="rounded-xl p-3 flex items-center justify-between bg-emerald-950/40 border border-emerald-900/40">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <div>
                <p className="text-[10px] text-bf-text-3">Renta mensual estimada</p>
                <p className="text-sm font-bold text-emerald-400">
                  +{FLAG[currency]} {fmt(inst.monthly_return_usd)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-bf-text-3 text-right">Yield anual</p>
              <p className="text-sm font-bold text-emerald-400">
                {(inst.annual_yield_pct * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        {/* Edit / Delete para posiciones manuales */}
        {isManual && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => router.push(`/portfolio/add-manual?edit=${inst.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-bf-border text-bf-text-3 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              <Pencil size={12} />
              Editar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-bf-border text-bf-text-3 hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        )}
        {deleteError && (
          <p className="text-[11px] text-red-400 text-center">{deleteError}</p>
        )}
      </div>

      {/* Position metrics — layout según tipo */}
      <div className="bg-bf-surface rounded-2xl border border-bf-border p-4">
        <p className="text-[10px] text-bf-text-3 uppercase tracking-wider mb-1">Mi posición</p>
        <PositionMetrics inst={inst} fmt={fmt} hint={hint} currency={currency} />
      </div>

      {/* Asset context */}
      <div className="bg-bf-surface rounded-2xl border border-bf-border p-4 space-y-3">
        <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">Sobre este instrumento</p>
        <p className="text-xs text-bf-text-2">{inst.context.description}</p>
        {inst.context.currency_note && (
          <div className="flex items-start gap-2">
            <RefreshCw size={12} className="text-bf-text-3 mt-0.5 shrink-0" />
            <p className="text-[11px] text-bf-text-3">{inst.context.currency_note}</p>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Droplets size={12} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-bf-text-3">
            <span className="text-bf-text-3">Liquidez:</span> {inst.context.liquidity}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Zap size={12} className="text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-bf-text-3">
            <span className="text-bf-text-3">Fuente de datos:</span> {inst.source}
          </p>
        </div>
      </div>

      {/* MEP footer */}
      <div className="bg-bf-surface/50 rounded-2xl border border-bf-border p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={13} className="text-bf-text-3" />
          <span className="text-xs text-bf-text-3">MEP actual</span>
        </div>
        <span className="text-xs text-bf-text-3 font-medium">
          ${inst.mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })} ARS/USD
        </span>
      </div>

      {inst.last_updated && (
        <p className="text-[10px] text-bf-text-5 text-center">
          Última actualización: {new Date(inst.last_updated).toLocaleDateString("es-AR")}
        </p>
      )}
    </div>
  );
}

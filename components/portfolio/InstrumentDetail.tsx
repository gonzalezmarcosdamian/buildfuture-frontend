"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Zap, Shield, Droplets, RefreshCw, AlertTriangle, Pencil, Trash2, Loader2, MapPin, ExternalLink } from "lucide-react";
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
  external_id: string | null;
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

// ── Mini mapa OSM para REAL_ESTATE ──────────────────────────────────────────

function MiniMap({ address, mapsUrl }: { address: string; mapsUrl: string }) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "es", "User-Agent": "BuildFuture/1.0" } }
    )
      .then((r) => r.json())
      .then((d) => {
        if (d[0]) setCoords({ lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) {
    return (
      <div className="h-32 rounded-xl bg-bf-surface-2 border border-bf-border animate-pulse flex items-center justify-center">
        <span className="text-[11px] text-bf-text-4">Cargando mapa…</span>
      </div>
    );
  }

  if (!coords) return null;

  const { lat, lon } = coords;
  const delta = 0.006;
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-bf-border relative group">
      <iframe
        src={src}
        className="w-full h-36 pointer-events-none"
        loading="lazy"
        title="Ubicación del inmueble"
      />
      <div className="absolute inset-0 flex items-end justify-end p-2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="flex items-center gap-1 text-[10px] text-white bg-black/60 rounded-lg px-2 py-1">
          <ExternalLink size={9} /> Abrir en Maps
        </span>
      </div>
    </a>
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
    // external_id stores the full address for new entries; description is the user-defined name
    const addressForMap = inst.external_id ?? inst.description;
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(addressForMap)}`;
    return (
      <>
        <div className="mb-3">
          <MiniMap address={addressForMap} mapsUrl={mapsUrl} />
        </div>
        <MetricRow
          label="Valuación del inmueble"
          value={`${FLAG.USD} ${fmt(inst.current_value_usd)}`}
          sub={hint(inst.current_value_usd)}
        />
        <MetricRow
          label="Renta estimada / mes"
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
          label="Renta estimada / mes *"
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
    ? `YTM ${(inst.annual_yield_pct * 100).toFixed(2)}%`
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
      {inst.asset_type !== "CASH" && (
        <MetricRow
          label="Renta estimada / mes *"
          value={`${FLAG[currency]} ${fmt(inst.monthly_return_usd)}`}
          sub={rentaSub}
          highlight={inst.monthly_return_usd > 0 ? "green" : null}
        />
      )}
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

  // Para REAL_ESTATE: description = nombre definido por usuario, external_id = dirección completa
  // Legacy (posiciones viejas): external_id es null → usar description como fallback
  const restateAddress = isRealEstate ? (inst.external_id ?? inst.description) : null;
  const restateName = isRealEstate ? inst.description : null;
  const mapsUrl = isRealEstate
    ? `https://maps.google.com/?q=${encodeURIComponent(restateAddress!)}`
    : null;

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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-bf-text">
                {isRealEstate ? (restateName ?? inst.ticker) : inst.ticker}
              </h1>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ASSET_BADGES[inst.asset_type] || "bg-bf-surface-3 text-bf-text-2"}`}>
                {isRealEstate ? "🏠 Inmueble" : inst.context.type_label}
              </span>
              {inst.asset_type === "LETRA" && inst.days_to_maturity !== null && inst.days_to_maturity <= 60 && inst.days_to_maturity > 0 && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-900/60 text-amber-300 border border-amber-700/40">
                  <AlertTriangle size={9} />
                  Vence en {inst.days_to_maturity}d
                </span>
              )}
              {inst.asset_type === "LETRA" && inst.days_to_maturity !== null && inst.days_to_maturity <= 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-900/60 text-red-300 border border-red-700/40">
                  Vencida
                </span>
              )}
            </div>
            {isRealEstate && restateAddress ? (
              <a
                href={mapsUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1 group mt-0.5"
              >
                <MapPin size={11} className="text-amber-400 mt-0.5 shrink-0" />
                <span className="text-[11px] text-bf-text-3 group-hover:text-amber-300 transition-colors leading-tight line-clamp-2">
                  {restateAddress}
                </span>
                <ExternalLink size={10} className="text-bf-text-4 group-hover:text-amber-300 mt-0.5 shrink-0 transition-colors" />
              </a>
            ) : (
              <p className="text-xs text-bf-text-3">{inst.description}</p>
            )}
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
              <p className="text-[10px] text-bf-text-3 text-right">% desde compra</p>
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
                <p className="text-[10px] text-bf-text-3">Renta estimada / mes</p>
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
              onClick={() => router.push(`/portfolio/add-manual?mode=${inst.asset_type}&edit=${inst.id}`)}
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
        {inst.asset_type !== "CASH" && !isRealEstate && (
          <p className="text-[10px] text-bf-text-4 mt-2 px-0.5">* Proyección basada en TNA/YTM. No garantiza rendimiento futuro.</p>
        )}
      </div>

      {/* Mapa para REAL_ESTATE */}
      {isRealEstate && mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 bg-bf-surface rounded-2xl border border-bf-border p-4 hover:border-amber-700/60 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-800/40 flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-bf-text group-hover:text-amber-300 transition-colors">
              Ver en el mapa
            </p>
            <p className="text-[10px] text-bf-text-4 truncate mt-0.5">{restateAddress ?? inst.description}</p>
          </div>
          <ExternalLink size={14} className="text-bf-text-4 group-hover:text-amber-300 shrink-0 transition-colors" />
        </a>
      )}

      {/* Asset context */}
      <div className="bg-bf-surface rounded-2xl border border-bf-border p-4 space-y-3">
        <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">
          {isRealEstate ? "Sobre este inmueble" : "Sobre este instrumento"}
        </p>
        {isRealEstate ? (
          <>
            <p className="text-xs text-bf-text-2">
              Propiedad registrada manualmente. La valuación y la renta son estimaciones ingresadas por vos y pueden actualizarse cuando cambien las condiciones del mercado o del contrato.
            </p>
            <div className="flex items-start gap-2">
              <RefreshCw size={12} className="text-bf-text-3 mt-0.5 shrink-0" />
              <p className="text-[11px] text-bf-text-3">
                Valuación en USD. Renta mensual convertida al MEP actual para el cálculo de cobertura de gastos.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Droplets size={12} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-bf-text-3">
                <span className="text-bf-text-3">Liquidez:</span> Baja — venta requiere proceso legal. La renta es mensual.
              </p>
            </div>
          </>
        ) : (
          <>
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
                <span className="text-bf-text-3">Broker:</span> {inst.source === "IOL" ? "InvertirOnline" : inst.source === "COCOS" ? "Cocos Capital" : inst.source === "PPI" ? "Portfolio Personal" : inst.source === "BINANCE" ? "Binance" : inst.source === "MANUAL" ? "Carga manual" : inst.source}
              </p>
            </div>
          </>
        )}
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

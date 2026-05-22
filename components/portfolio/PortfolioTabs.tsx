"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, Trash2, Pencil, Check, X, AlertTriangle, Clock } from "lucide-react";
import { formatUSD, formatARS, formatPct } from "@/lib/formatters";
import { assetLabelWithEmoji } from "@/lib/assetLabels";
import { useCurrency } from "@/lib/currency-context";
import { SyncButton } from "@/components/portfolio/SyncButton";
import { supabase } from "@/lib/supabase";
import type { PositionDelta } from "./PortfolioClient";

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

interface Position {
  id: number;
  ticker: string;
  description: string;
  asset_type: string;
  source: string | null;
  quantity: number;
  current_value_usd: number;
  cost_basis_usd: number;
  performance_pct: number;
  performance_ars_pct: number;
  ppc_ars: number;
  annual_yield_pct: number;
  current_price_usd: number;
  avg_purchase_price_usd: number;
  snapshot_date?: string | null;
}

// Instrumentos ARS: su rendimiento nativo (ARS vs VCP) es siempre correcto,
// independientemente del MEP histórico de compra.
const ARS_DENOMINATED = new Set(["FCI", "LETRA", "ON"]);

export type TabMode = "composicion" | "rendimientos";

const PERIOD_LABELS: Record<string, string> = {
  daily: "hoy vs ayer",
  monthly: "último mes",
  annual: "último año",
};

interface Props {
  positions: Position[];
  totalUsd: number;
  mep: number;
  activeTab: TabMode;
  connectedProviders?: string[];
  period?: string;
  positionDeltas?: PositionDelta[];
  deltasLoading?: boolean;
  expectedDevaluationPct?: number;
}

// Propósito de cada tipo de activo: renta (flujo mensual) | capital (apreciación)
const ASSET_JOB: Record<string, "renta" | "capital" | "ambos"> = {
  LETRA:  "renta",
  FCI:    "renta",
  ON:     "renta",
  BOND:   "ambos",
  CEDEAR: "capital",
  STOCK:  "capital",
  ETF:    "capital",
  CRYPTO: "capital",
  CASH:   "renta",
};


const ASSET_COLORS: Record<string, string> = {
  CEDEAR: "#3b82f6",
  BOND:   "#a855f7",
  LETRA:  "#eab308",
  CRYPTO: "#f97316",
  FCI:    "#22c55e",
  CASH:   "#64748b",
};

const ASSET_BADGES: Record<string, string> = {
  CEDEAR: "bf-chip-cedear",
  BOND:   "bf-chip-bond",
  LETRA:  "bf-chip-letra",
  CRYPTO: "bf-chip-crypto",
  FCI:    "bf-chip-fci",
  ETF:    "bf-chip-etf",
  CASH:   "bf-chip-cash",
};

const SOURCE_BADGES: Record<string, string> = {
  IOL:     "bf-chip-iol",
  PPI:     "bf-chip-ppi",
  COCOS:   "bf-chip-cocos",
  BINANCE: "bf-chip-binance",
  MANUAL:  "bf-chip-manual",
};

const SOURCE_LABELS: Record<string, string> = {
  IOL:     "InvertirOnline",
  PPI:     "Portfolio Personal",
  COCOS:   "Cocos Capital",
  BINANCE: "Binance",
  MANUAL:  "Manual",
};

const FLAG: Record<"USD" | "ARS", string> = { USD: "🇺🇸", ARS: "🇦🇷" };

const STALE_DAYS = 3;

function brokerSyncStatus(positions: Position[]): { label: string; stale: boolean } | null {
  const dates = positions
    .filter(p => p.snapshot_date)
    .map(p => new Date(p.snapshot_date!));
  if (dates.length === 0) return null;
  const latest = new Date(Math.max(...dates.map(d => d.getTime())));
  const daysSince = Math.floor((Date.now() - latest.getTime()) / 86_400_000);
  const label = daysSince === 0 ? "hoy" : daysSince === 1 ? "ayer" : `hace ${daysSince}d`;
  return { label, stale: daysSince >= STALE_DAYS };
}

function cashLabel(ticker: string): string {
  if (ticker.includes("USD")) return "Disponible USD";
  if (ticker.includes("ARS")) return "Disponible ARS";
  return "Disponible";
}

function cashSubtitle(ticker: string): string {
  if (ticker.includes("USD")) return "Dólares sin invertir";
  if (ticker.includes("ARS")) return "Pesos sin invertir";
  return "Sin invertir";
}

function SourceGroupHeader({
  source,
  collapsed,
  groupTotal,
  fmt,
  currency,
  onToggle,
}: {
  source: string;
  collapsed: boolean;
  groupTotal: number;
  fmt: (n: number) => string;
  currency: "USD" | "ARS";
  onToggle: () => void;
}) {
  const badgeCls = SOURCE_BADGES[source] ?? "bf-chip-manual";
  const label    = SOURCE_LABELS[source] ?? source;
  const flag     = FLAG[currency];
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-0.5 hover:opacity-80 transition-opacity"
    >
      <div className="flex items-center gap-2">
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${badgeCls}`}>
          {source}
        </span>
        <span className="text-[10px] text-bf-text-4">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {collapsed && (
          <span className="text-[10px] text-bf-text-3">{flag} {fmt(groupTotal)}</span>
        )}
        <ChevronDown
          size={12}
          className={`text-bf-text-4 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </div>
    </button>
  );
}

// ── PositionRow — componente a nivel de módulo para evitar remount en cada render ──
interface PositionRowProps {
  p: Position;
  totalUsd: number;
  mep: number;
  currency: "USD" | "ARS";
  // mep passed to onStartEdit for CASH_ARS amount calculation
  fmt: (n: number) => string;
  hint: (n: number) => string;
  editingId: number | null;
  editAmount: string;
  savingEdit: boolean;
  onStartEdit: (id: number, amount: string) => void;
  onSaveEdit: (id: number, ticker: string) => void;
  onCancelEdit: () => void;
  onSetEditAmount: (v: string) => void;
  onDelete: (id: number) => void;
  onNavigate: (ticker: string, id: number) => void;
}

function PositionRow({ p, totalUsd, mep, currency, fmt, hint, editingId, editAmount, savingEdit, onStartEdit, onSaveEdit, onCancelEdit, onSetEditAmount, onDelete, onNavigate }: PositionRowProps) {
  if (p.asset_type === "CASH") {
    const isManual = p.source === "MANUAL";
    const isEditing = editingId === p.id;
    return (
      <div className="flex flex-col gap-1 py-2 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm leading-none">💵</span>
            <div>
              <p className="text-xs font-semibold text-bf-text-2">{cashLabel(p.ticker)}</p>
              <p className="text-[10px] text-bf-text-4">{cashSubtitle(p.ticker)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-medium text-bf-text-2">{FLAG[currency]} {fmt(p.current_value_usd)}</p>
              <p className="text-[10px] text-bf-text-4">{hint(p.current_value_usd)}</p>
            </div>
            {isManual && !isEditing && (
              <div className="flex gap-0.5">
                <button
                  onClick={() => onStartEdit(p.id, String(p.ticker === "CASH_ARS" ? Math.round(p.current_value_usd * mep) : p.current_value_usd))}
                  className="p-2 text-bf-text-4 hover:text-bf-text-2"
                >
                  <Pencil size={12} />
                </button>
                <button onClick={() => onDelete(p.id)} className="p-2 text-bf-text-4 hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
        {isEditing && (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*"
              value={editAmount} onChange={(e) => onSetEditAmount(e.target.value)}
              autoFocus placeholder="0"
              className="flex-1 bg-bf-surface-2 border border-bf-border-2 rounded-lg px-2 py-1.5 text-[16px] text-bf-text focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-bf-text-3 shrink-0">{p.ticker === "CASH_ARS" ? "ARS" : "USD"}</span>
            <button onClick={() => onSaveEdit(p.id, p.ticker)} disabled={savingEdit}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-blue-600 rounded-lg disabled:opacity-40">
              <Check size={12} />
            </button>
            <button onClick={onCancelEdit}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-bf-text-3">
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    );
  }
  return (
    <button
      onClick={() => onNavigate(p.ticker, p.id)}
      className="w-full flex items-center justify-between py-2 px-2 rounded-xl hover:bg-bf-surface-2/60 active:scale-[0.98] transition-all duration-75 text-left"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-bf-text-2 truncate">
              {p.asset_type === "REAL_ESTATE" ? p.description : p.ticker}
            </span>
            <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${ASSET_BADGES[p.asset_type] || "bg-bf-surface-3 text-bf-text-2"}`}>
              {p.asset_type === "REAL_ESTATE" ? "🏠" : p.asset_type}
            </span>
          </div>
          <p className="text-[10px] text-bf-text-4">
            {p.asset_type === "REAL_ESTATE" ? "Inmueble" : `${p.quantity.toLocaleString("es-AR")} u.`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div className="text-right">
          <p className="text-xs font-medium text-bf-text-2">{FLAG[currency]} {fmt(p.current_value_usd)}</p>
          <p className="text-[10px] text-bf-text-3">{((p.current_value_usd / totalUsd) * 100).toFixed(1)}%</p>
        </div>
        <ChevronRight size={12} className="text-bf-text-4 ml-0.5" />
      </div>
    </button>
  );
}

export function PortfolioTabs({ positions, totalUsd, mep, activeTab, period = "daily", positionDeltas = [], deltasLoading = false, expectedDevaluationPct = 0.20 }: Omit<Props, "connectedProviders"> & { connectedProviders?: string[] }) {
  const tab = activeTab;
  const { currency } = useCurrency();
  const router = useRouter();
  const [collapsedSources, setCollapsedSources] = useState<Record<string, boolean>>(() => {
    const sources = [...new Set(positions.map(p => p.source ?? "MANUAL"))];
    const initial: Record<string, boolean> = {};
    sources.forEach(src => { initial[src] = true; initial[`r_${src}`] = true; });
    return initial;
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function toggleSource(source: string) {
    setCollapsedSources((prev) => ({ ...prev, [source]: !prev[source] }));
  }

  async function deletePosition(id: number) {
    const res = await authFetch(`/positions/manual/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("No se pudo eliminar la posición"); return; }
    toast.success("Posición eliminada");
    router.refresh();
  }

  async function saveEdit(id: number, ticker: string) {
    const num = parseFloat(editAmount);
    if (!num || num <= 0) return;
    setSavingEdit(true);
    try {
    const isARS = ticker === "CASH_ARS";
    const mepRate = mep || 1430;
    const qtyUsd = isARS ? num / mepRate : num;
      await authFetch(`/positions/manual/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: qtyUsd, ppc_ars: isARS ? num : num * mepRate, purchase_fx_rate: mepRate }),
      });
      toast.success("Saldo actualizado");
    } finally {
      setSavingEdit(false);
      setEditingId(null);
      router.refresh();
    }
  }

  const fmt  = (usd: number) => currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);
  const hint = (usd: number) => currency === "USD"
    ? `≈ ${FLAG.ARS} ${formatARS(usd * mep)}`
    : `≈ ${FLAG.USD} ${formatUSD(usd)}`;

  const byType = positions.reduce((acc: Record<string, number>, p) => {
    acc[p.asset_type] = (acc[p.asset_type] || 0) + p.current_value_usd;
    return acc;
  }, {});

  // Subtotales renta vs capital
  const rentaTotal   = positions.filter(p => (ASSET_JOB[p.asset_type] ?? "renta") !== "capital").reduce((s, p) => s + p.current_value_usd, 0);
  const capitalTotal = positions.filter(p => ASSET_JOB[p.asset_type] === "capital").reduce((s, p) => s + p.current_value_usd, 0);
  const rentaMonthly = positions
    .filter(p => (ASSET_JOB[p.asset_type] ?? "renta") !== "capital" && p.asset_type !== "CASH")
    .reduce((s, p) => {
      const yRaw = p.annual_yield_pct ?? 0;
      // FCI y LETRA tienen yield en TNA ARS nominal. Para expresar en USD real:
      // yield_usd = max(0, (1 + tna_ars) / (1 + deval) - 1)
      const isARS = p.asset_type === "FCI" || p.asset_type === "LETRA";
      const y = isARS
        ? Math.max(0, (1 + yRaw) / (1 + expectedDevaluationPct) - 1)
        : yRaw;
      // BOND: 50% del valor va a renta (cupón), 50% a capital (apreciación)
      const monthly = p.asset_type === "BOND"
        ? (p.current_value_usd * y * 0.5) / 12
        : (p.current_value_usd * y) / 12;
      return s + monthly;
    }, 0);

  // Agrupar por fuente — NEXO se agrupa igual pero sin label ALYC especial
  const bySource = positions.reduce((acc: Record<string, Position[]>, p) => {
    const src = p.source ?? "MANUAL";
    if (!acc[src]) acc[src] = [];
    acc[src].push(p);
    return acc;
  }, {});

  // Para rendimientos: por fuente, sin CASH, ordenado por performance dentro de cada grupo
  const bySourceRendimientos: Record<string, Position[]> = Object.fromEntries(
    Object.entries(bySource)
      .map(([src, ps]): [string, Position[]] => [
        src,
        ps.filter((p) => p.asset_type !== "CASH").sort((a, b) => b.performance_pct - a.performance_pct),
      ])
      .filter(([, ps]) => (ps as Position[]).length > 0)
  );

  // Ordenar posiciones: CASH al fondo, resto por valor descendente
  function sortPositions(ps: Position[]): Position[] {
    return [...ps].sort((a, b) => {
      if (a.asset_type === "CASH" && b.asset_type !== "CASH") return 1;
      if (a.asset_type !== "CASH" && b.asset_type === "CASH") return -1;
      return b.current_value_usd - a.current_value_usd;
    });
  }

  // Separar brokers conectados de manual
  const brokerSources = Object.entries(bySource)
    .filter(([src]) => src !== "MANUAL")
    .map(([src, ps]): [string, Position[]] => [src, sortPositions(ps)]);
  const manualPositions = sortPositions(bySource["MANUAL"] ?? []);

  return (
    <div>
      {tab === "composicion" ? (
        <div className="space-y-3">

          {/* ── SECCIÓN 1: CONSOLIDADO ─────────────────────────────── */}
          <div className="bg-bf-surface rounded-2xl border border-bf-border overflow-hidden">
            {/* Barra de composición */}
            <div className="h-2 flex gap-px">
              {Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([type, value]) => (
                <div key={type} style={{ width: `${(value/totalUsd)*100}%`, backgroundColor: ASSET_COLORS[type] || "#64748b" }} />
              ))}
            </div>

            <div className="p-4 space-y-3">
              {/* Renta vs Capital */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-emerald-400 font-medium mb-1">💰 Renta mensual</p>
                  <p className="text-sm font-bold text-bf-text">+{fmt(rentaMonthly)}<span className="text-[10px] text-bf-text-3 font-normal">/mes</span></p>
                  <p className="text-[10px] text-bf-text-4 mt-0.5">{totalUsd > 0 ? ((rentaTotal/totalUsd)*100).toFixed(0) : 0}% del portafolio</p>
                </div>
                <div className="bg-violet-950/20 border border-violet-800/30 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-violet-400 font-medium mb-1">📈 Capital</p>
                  <p className="text-sm font-bold text-bf-text">{fmt(capitalTotal)}</p>
                  <p className="text-[10px] text-bf-text-4 mt-0.5">{totalUsd > 0 ? ((capitalTotal/totalUsd)*100).toFixed(0) : 0}% del portafolio</p>
                </div>
              </div>

              {/* Leyenda por tipo */}
              <div className="space-y-1.5 pt-1 border-t border-bf-border/50">
                {Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([type, value]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ASSET_COLORS[type] || "#64748b" }} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ASSET_BADGES[type] || "bf-chip-cash"}`}>{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-bf-text-2">{fmt(value)}</span>
                      <span className="text-[10px] text-bf-text-4 w-8 text-right">{((value/totalUsd)*100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 2: BROKERS CONECTADOS ─────────────────────── */}
          {brokerSources.length > 0 && (
            <div className="bg-bf-surface rounded-2xl border border-bf-border overflow-hidden">
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <p className="text-[10px] text-bf-text-4 uppercase tracking-widest font-medium">Brokers conectados</p>
              </div>
              <div className="divide-y divide-bf-border/40">
                {brokerSources.map(([source, sourcePositions]) => {
                  const collapsed = !!collapsedSources[source];
                  const groupTotal = sourcePositions.reduce((s, p) => s + p.current_value_usd, 0);
                  const sync = brokerSyncStatus(sourcePositions);
                  return (
                    <div key={source} className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleSource(source)}
                          className="flex-1 flex items-center justify-between py-1 hover:opacity-80 transition-opacity">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${SOURCE_BADGES[source] ?? "bf-chip-manual"}`}>{source}</span>
                            <div className="min-w-0">
                              <span className="text-[11px] text-bf-text-3">{SOURCE_LABELS[source] ?? source}</span>
                              {sync && (
                                <div className={`flex items-center gap-1 mt-0.5 ${sync.stale ? "text-amber-400" : "text-bf-text-4"}`}>
                                  {sync.stale
                                    ? <AlertTriangle size={9} className="shrink-0" />
                                    : <Clock size={9} className="shrink-0" />
                                  }
                                  <span className="text-[9px]">
                                    {sync.stale ? `Sin sync desde ${sync.label}` : `Sync ${sync.label}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-semibold text-bf-text-2">{fmt(groupTotal)}</span>
                            <ChevronDown size={12} className={`text-bf-text-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
                          </div>
                        </button>
                        <SyncButton connectedProviders={[source]} />
                      </div>
                      {!collapsed && (
                        <div className="mt-1 space-y-0.5">
                          {sourcePositions.map(p => <PositionRow key={p.id} p={p} totalUsd={totalUsd} mep={mep} currency={currency as "USD"|"ARS"} fmt={fmt} hint={hint} editingId={editingId} editAmount={editAmount} savingEdit={savingEdit} onStartEdit={(id, amt) => { setEditingId(id); setEditAmount(amt); }} onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)} onSetEditAmount={setEditAmount} onDelete={deletePosition} onNavigate={(ticker, id) => router.push(`/portfolio/${encodeURIComponent(ticker)}?id=${id}`)} />)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SECCIÓN 3: MANUAL ─────────────────────────────────── */}
          {manualPositions.length > 0 && (
            <div className="bg-bf-surface rounded-2xl border border-bf-border overflow-hidden">
              <div className="px-4 py-2">
                <button onClick={() => toggleSource("MANUAL")}
                  className="w-full flex items-center justify-between py-1 hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-bf-text-4 uppercase tracking-widest font-medium">Manual</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-bf-text-2">{fmt(manualPositions.reduce((s,p)=>s+p.current_value_usd,0))}</span>
                    <ChevronDown size={12} className={`text-bf-text-4 transition-transform ${collapsedSources["MANUAL"] ? "-rotate-90" : ""}`} />
                  </div>
                </button>
                {!collapsedSources["MANUAL"] && (
                  <div className="mt-1 space-y-0.5">
                    {manualPositions.map(p => <PositionRow key={p.id} p={p} totalUsd={totalUsd} mep={mep} currency={currency as "USD"|"ARS"} fmt={fmt} hint={hint} editingId={editingId} editAmount={editAmount} savingEdit={savingEdit} onStartEdit={(id, amt) => { setEditingId(id); setEditAmount(amt); }} onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)} onSetEditAmount={setEditAmount} onDelete={deletePosition} onNavigate={(ticker, id) => router.push(`/portfolio/${encodeURIComponent(ticker)}?id=${id}`)} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border space-y-3">
          {/* Period label — consistent with chart */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-bf-text-3 uppercase tracking-wider">
              Variación · {PERIOD_LABELS[period] ?? period}
            </p>
            {deltasLoading && (
              <span className="text-[9px] text-bf-text-4">Cargando…</span>
            )}
          </div>

          {Object.entries(bySourceRendimientos).map(([source, sourcePositions]) => {
            const collapsed  = !!collapsedSources[`r_${source}`];
            const groupTotal = sourcePositions.reduce((s, p) => s + p.current_value_usd, 0);

            // Build delta lookup for this render
            const deltaMap = Object.fromEntries(
              positionDeltas.map((d) => [d.ticker, d])
            );

            return (
              <div key={source}>
                <SourceGroupHeader
                  source={source}
                  collapsed={collapsed}
                  groupTotal={groupTotal}
                  fmt={fmt}
                  currency={currency as "USD" | "ARS"}
                  onToggle={() => toggleSource(`r_${source}`)}
                />

                {!collapsed && (
                  <div className="space-y-3 mt-2">
                    {sourcePositions.map((p) => {
                      const delta = deltaMap[p.ticker];
                      const weightPct = totalUsd > 0 ? (p.current_value_usd / totalUsd) * 100 : 0;

                      // When period delta is available: use it
                      // Fallback: desde-compra (performance_pct / pnlUsd)
                      const hasDelta = !!delta && !deltasLoading;
                      const useArs = !hasDelta && ARS_DENOMINATED.has(p.asset_type) && p.ppc_ars > 0;

                      const perfPct  = hasDelta
                        ? delta.delta_pct
                        : (useArs ? p.performance_ars_pct : p.performance_pct);
                      const pnlUsd   = hasDelta
                        ? delta.delta_usd
                        : (p.current_value_usd - p.cost_basis_usd);
                      const positive = perfPct >= 0 || pnlUsd >= 0;

                      return (
                        <button
                          key={p.id}
                          onClick={() => router.push(`/portfolio/${encodeURIComponent(p.ticker)}`)}
                          className="w-full text-left space-y-1 hover:opacity-80 active:scale-[0.98] active:opacity-60 transition-all duration-75"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-bf-text-2">
                                {p.asset_type === "REAL_ESTATE" ? p.description : p.ticker}
                              </span>
                              <p className="text-[10px] text-bf-text-3">
                                {p.asset_type === "REAL_ESTATE" ? assetLabelWithEmoji("REAL_ESTATE") : p.description.split(" ").slice(0, 3).join(" ")}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="text-right">
                                <div className={`flex items-center gap-0.5 text-xs ${positive ? "text-bf-gain" : "text-bf-loss"}`}>
                                  {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                  <span className="font-semibold">{formatPct(perfPct, 1, true)}</span>
                                  {!hasDelta && useArs && (
                                    <span className="text-[9px] text-bf-text-3 ml-0.5">ARS</span>
                                  )}
                                  {!hasDelta && (
                                    <span className="text-[9px] text-bf-text-4 ml-0.5">compra</span>
                                  )}
                                </div>
                                <p className={`text-[10px] ${positive ? "text-emerald-600" : "text-red-600"}`}>
                                  {positive ? "+" : ""}{FLAG[currency]} {fmt(pnlUsd)}
                                </p>
                              </div>
                              <ChevronRight size={12} className="text-bf-text-4 shrink-0 ml-1" />
                            </div>
                          </div>
                          <div className="h-1 bg-bf-surface-2/60 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-600 transition-all"
                              style={{ width: `${weightPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-bf-text-4">
                            <span>{weightPct.toFixed(1)}% del portafolio</span>
                            <span>{positive ? "+" : ""}{FLAG[currency]} {fmt(pnlUsd)} Δ</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

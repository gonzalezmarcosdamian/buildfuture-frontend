"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
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

type AssetType = "CRYPTO" | "FCI" | "ETF" | "OTRO";

const ASSET_TYPES: { value: AssetType; label: string; desc: string; icon: string }[] = [
  { value: "CRYPTO", label: "Cripto", desc: "BTC, ETH, stablecoins", icon: "₿" },
  { value: "FCI", label: "FCI", desc: "Cocos, Balanz, Santander...", icon: "🏦" },
  { value: "ETF", label: "ETF / Acción", desc: "SPY, QQQ, AAPL en USD", icon: "📈" },
  { value: "OTRO", label: "Otro", desc: "Activo sin precio externo", icon: "📦" },
];

interface SearchResult {
  id?: string;      // CoinGecko ID o fondo name
  name: string;
  symbol?: string;
  fondo?: string;
  categoria?: string;
  vcp?: number;
  price_usd?: number;
  ticker?: string;
  market_cap_rank?: number;
}

export function AddManualPosition() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [assetType, setAssetType] = useState<AssetType | null>(null);

  // search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);

  // form
  const [quantity, setQuantity] = useState("");
  const [purchasePriceUsd, setPurchasePriceUsd] = useState("");
  const [ppcArs, setPpcArs] = useState("");
  const [purchaseFxRate, setPurchaseFxRate] = useState("");
  const [manualYield, setManualYield] = useState("");
  const [customTicker, setCustomTicker] = useState("");
  const [customName, setCustomName] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // FCI: carga todos los fondos al entrar al step 2
  const [allFci, setAllFci] = useState<SearchResult[]>([]);
  const [loadingFci, setLoadingFci] = useState(false);

  useEffect(() => {
    if (assetType === "FCI" && step === 2 && allFci.length === 0) {
      setLoadingFci(true);
      authFetch("/positions/search/fci?q=")
        .then((r) => r.json())
        .then((d) => setAllFci(d.results || []))
        .catch(() => {})
        .finally(() => setLoadingFci(false));
    }
  }, [assetType, step]);

  // FCI: filtro local mientras escribe
  const filteredFci = useMemo(() => {
    if (!searchQuery.trim()) return allFci;
    const q = searchQuery.toLowerCase();
    return allFci.filter((r) => (r.fondo ?? r.name ?? "").toLowerCase().includes(q));
  }, [searchQuery, allFci]);

  async function doSearch() {
    if (!searchQuery.trim() || !assetType) return;
    if (assetType === "FCI") return; // FCI usa filtro local
    setSearching(true);
    setSearchResults([]);
    try {
      let path = "";
      if (assetType === "CRYPTO") path = `/positions/search/crypto?q=${encodeURIComponent(searchQuery)}`;
      else if (assetType === "ETF") path = `/positions/search/etf?ticker=${encodeURIComponent(searchQuery)}`;
      const res = await authFetch(path);
      if (!res.ok) {
        if (assetType === "ETF") setError("Ticker no encontrado en Yahoo Finance");
        return;
      }
      const data = await res.json();
      if (assetType === "ETF") {
        setSelected({ ...data, id: data.ticker, name: data.name });
        setStep(3);
        return;
      }
      setSearchResults(data.results || []);
    } catch {
      setError("No se pudo conectar");
    } finally {
      setSearching(false);
    }
  }

  function pickResult(r: SearchResult) {
    setSelected(r);
    setStep(3);
  }

  async function save() {
    if (!assetType || !quantity) return;
    setSaving(true);
    setError("");
    try {
      const isOTRO = assetType === "OTRO";
      const isFCI = assetType === "FCI";
      const isCrypto = assetType === "CRYPTO";
      const isETF = assetType === "ETF";

      const body: Record<string, unknown> = {
        asset_type: assetType,
        ticker: isOTRO
          ? customTicker.toUpperCase()
          : isFCI
          ? (selected?.fondo ?? selected?.name ?? "FCI")
          : isCrypto
          ? (selected?.symbol ?? selected?.name ?? "CRYPTO")
          : (selected?.ticker ?? searchQuery.toUpperCase()),
        description: isOTRO
          ? customName
          : (selected?.name ?? selected?.fondo ?? ""),
        quantity: parseFloat(quantity),
        purchase_price_usd: parseFloat(purchasePriceUsd || "0"),
        ppc_ars: parseFloat(ppcArs || "0"),
        purchase_fx_rate: parseFloat(purchaseFxRate || "0"),
        external_id: isOTRO ? null : isFCI ? (selected?.fondo ?? null) : (selected?.id ?? selected?.ticker ?? null),
        fci_categoria: isFCI ? (selected?.categoria ?? null) : null,
        manual_yield_pct: manualYield ? parseFloat(manualYield) / 100 : null,
      };

      const res = await authFetch("/positions/manual", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || `Error ${res.status}`);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/portfolio"), 1500);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <CheckCircle2 size={40} className="text-emerald-400" />
        <p className="text-sm font-semibold text-slate-100">Posición agregada</p>
        <p className="text-xs text-slate-500">Redirigiendo al portafolio…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Agregar posición manual</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Crypto, FCI, ETFs internacionales y más
        </p>
      </div>

      {/* Step 1: elegir tipo */}
      {step === 1 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider">¿Qué tipo de activo?</p>
          {ASSET_TYPES.map((a) => (
            <button
              key={a.value}
              onClick={() => { setAssetType(a.value); setStep(a.value === "OTRO" ? 3 : 2); }}
              className="w-full flex items-center gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors text-left"
            >
              <span className="text-xl w-8 text-center">{a.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-100">{a.label}</p>
                <p className="text-[11px] text-slate-500">{a.desc}</p>
              </div>
              <ChevronRight size={14} className="text-slate-600" />
            </button>
          ))}
        </div>
      )}

      {/* Step 2: buscar activo */}
      {step === 2 && assetType && assetType !== "OTRO" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => { setStep(1); setSearchQuery(""); setSearchResults([]); }} className="hover:text-slate-200">← Tipo</button>
            <span>/</span>
            <span className="text-slate-200">
              {assetType === "FCI" ? "Elegir fondo" : assetType === "CRYPTO" ? "Buscar cripto" : "Buscar ticker"}
            </span>
          </div>

          {/* Input: para FCI filtra local, para CRYPTO/ETF dispara búsqueda */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder={
                assetType === "CRYPTO" ? "Ej: bitcoin, ethereum..."
                : assetType === "FCI" ? "Filtrar por nombre..."
                : "Ej: SPY, QQQ, AAPL"
              }
              autoFocus
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {assetType !== "FCI" && (
              <button
                onClick={doSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-3 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl transition-colors"
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          {/* FCI: lista completa con filtro local */}
          {assetType === "FCI" && (
            <div className="space-y-1 max-h-96 overflow-y-auto pr-0.5">
              {loadingFci ? (
                <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-xs">
                  <Loader2 size={14} className="animate-spin" /> Cargando fondos...
                </div>
              ) : filteredFci.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">Sin resultados para "{searchQuery}"</p>
              ) : (
                <>
                  <p className="text-[10px] text-slate-600 pb-1">
                    {filteredFci.length} {filteredFci.length === 1 ? "fondo" : "fondos"}
                    {searchQuery && ` · filtrado por "${searchQuery}"`}
                  </p>
                  {filteredFci.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => pickResult(r)}
                      className="w-full flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 hover:bg-slate-800/60 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-100 truncate">{r.fondo ?? r.name}</p>
                        <p className="text-[10px] text-slate-500">{r.categoria}</p>
                      </div>
                      {r.vcp && (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                          VCP ${r.vcp.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* CRYPTO / ETF: resultados de búsqueda */}
          {assetType !== "FCI" && (
            <div className="space-y-1.5">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pickResult(r)}
                  className="w-full flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 transition-colors text-left"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-100">
                      {r.name}
                      {r.symbol && <span className="ml-1.5 text-slate-500 font-normal">{r.symbol}</span>}
                    </p>
                    {r.market_cap_rank && <p className="text-[10px] text-slate-500">Rank #{r.market_cap_rank}</p>}
                  </div>
                  {r.price_usd && (
                    <span className="text-xs text-slate-400">${r.price_usd.toLocaleString()}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: datos de la posición */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => setStep(assetType === "OTRO" ? 1 : 2)} className="hover:text-slate-200">←</button>
            <span>/</span>
            <span className="text-slate-200 truncate max-w-[200px]">
              {assetType === "OTRO" ? "Activo manual"
               : selected?.fondo ?? selected?.name ?? searchQuery}
            </span>
          </div>

          {/* Activo seleccionado o campos manuales */}
          {assetType === "OTRO" ? (
            <div className="space-y-2">
              <Field label="Ticker / símbolo corto">
                <input
                  type="text"
                  value={customTicker}
                  onChange={(e) => setCustomTicker(e.target.value)}
                  placeholder="Ej: BONO2026"
                  className={inputCls}
                />
              </Field>
              <Field label="Nombre / descripción">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej: Bono corporativo YPF 2026"
                  className={inputCls}
                />
              </Field>
            </div>
          ) : (
            <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-300">
              <span className="font-semibold">{selected?.fondo ?? selected?.name}</span>
              {selected?.symbol && <span className="ml-1.5 text-slate-500">{selected.symbol}</span>}
              {selected?.categoria && <span className="ml-1.5 text-slate-500">· {selected.categoria}</span>}
            </div>
          )}

          <Field label="Cantidad">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              min="0"
              step="any"
              className={inputCls}
            />
          </Field>

          {assetType === "FCI" ? (
            <>
              <Field label="Cuotapartes compradas (VCP promedio en ARS)">
                <input type="number" value={ppcArs} onChange={(e) => setPpcArs(e.target.value)}
                  placeholder="0" min="0" step="any" className={inputCls} />
              </Field>
              <Field label="MEP al momento de la compra (ARS/USD)">
                <input type="number" value={purchaseFxRate} onChange={(e) => setPurchaseFxRate(e.target.value)}
                  placeholder="1430" min="0" step="any" className={inputCls} />
              </Field>
            </>
          ) : assetType === "CRYPTO" || assetType === "ETF" ? (
            <Field label="Precio de compra promedio (USD)">
              <input type="number" value={purchasePriceUsd} onChange={(e) => setPurchasePriceUsd(e.target.value)}
                placeholder="0" min="0" step="any" className={inputCls} />
            </Field>
          ) : (
            <>
              <Field label="Precio de compra (USD)">
                <input type="number" value={purchasePriceUsd} onChange={(e) => setPurchasePriceUsd(e.target.value)}
                  placeholder="0" min="0" step="any" className={inputCls} />
              </Field>
              <Field label="Yield / renta anual estimada (%)">
                <input type="number" value={manualYield} onChange={(e) => setManualYield(e.target.value)}
                  placeholder="0" min="0" max="999" step="any" className={inputCls} />
              </Field>
            </>
          )}

          {(assetType === "CRYPTO" || assetType === "ETF") && (
            <p className="text-[10px] text-slate-600 px-1">
              El yield se calcula automáticamente de la variación de precio de los últimos 30 días.
            </p>
          )}
          {assetType === "FCI" && (
            <p className="text-[10px] text-slate-600 px-1">
              El rendimiento se calcula automáticamente de la variación del VCP de los últimos 30 días.
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !quantity || (assetType === "OTRO" && !customTicker)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Guardando..." : "Agregar al portafolio"}
          </button>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

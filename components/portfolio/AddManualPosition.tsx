"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Search, X, MapPin } from "lucide-react";
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

type AssetMode = "CASH" | "CRYPTO" | "REAL_ESTATE";

interface CryptoResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank: number | null;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
}

// ── Subcomponent: Cash form ─────────────────────────────────────────────────

function CashForm({ onSuccess }: { onSuccess: () => void }) {
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");
  const [amount, setAmount] = useState("");
  const [mep, setMep] = useState(1430);
  const [mepLoaded, setMepLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares/bolsa")
      .then((r) => r.json())
      .then((d) => { if (d.venta) setMep(parseFloat(d.venta)); })
      .catch(() => {})
      .finally(() => setMepLoaded(true));
  }, []);

  async function save() {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    setSaving(true); setError("");
    try {
      const isARS = currency === "ARS";
      const qtyUsd = isARS ? num / mep : num;
      const res = await authFetch("/positions/manual", {
        method: "POST",
        body: JSON.stringify({
          asset_type: "CASH",
          ticker: isARS ? "CASH_ARS" : "CASH_USD",
          description: isARS ? "Efectivo en pesos" : "Efectivo en dólares",
          quantity: qtyUsd,
          purchase_price_usd: 1.0,
          ppc_ars: isARS ? num : num * mep,
          purchase_fx_rate: mep,
          external_id: null, fci_categoria: null, manual_yield_pct: null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || `Error ${res.status}`); return; }
      onSuccess();
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setSaving(false); }
  }

  const num = parseFloat(amount);
  const valid = !!amount && num > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-bf-text">Efectivo</h2>
        <p className="text-xs text-bf-text-3 mt-0.5">Dólares o pesos en mano / caja de ahorro</p>
      </div>
      <div className="flex gap-2">
        {(["USD", "ARS"] as const).map((c) => (
          <button key={c} onClick={() => { setCurrency(c); setAmount(""); }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${currency === c ? "bg-blue-600 text-white" : "bg-bf-surface border border-bf-border text-bf-text-3"}`}>
            {c}
          </button>
        ))}
      </div>
      <div>
        <label className="text-xs text-bf-text-3 mb-1.5 block">{currency === "USD" ? "Monto en dólares" : "Monto en pesos"}</label>
        <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder="0" autoFocus
          className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl px-4 py-3 text-bf-text text-lg focus:outline-none focus:border-blue-500 transition-colors" />
        {mepLoaded && num > 0 && (
          <p className="text-[11px] text-bf-text-4 mt-1.5 px-1">
            {currency === "ARS"
              ? `≈ USD ${(num / mep).toLocaleString("es-AR", { maximumFractionDigits: 2 })} · MEP $${mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
              : `≈ ARS ${(num * mep).toLocaleString("es-AR", { maximumFractionDigits: 0 })} · MEP $${mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
          </p>
        )}
      </div>
      {error && <ErrorBanner msg={error} />}
      <SaveButton onClick={save} saving={saving} disabled={!valid} />
    </div>
  );
}

// ── Subcomponent: Crypto form ───────────────────────────────────────────────

function CryptoForm({ onSuccess }: { onSuccess: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CryptoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CryptoResult | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    authFetch(`/positions/search/crypto?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    setSelected(null);
    setPrice(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function selectCoin(coin: CryptoResult) {
    setSelected(coin);
    setQuery(`${coin.name} (${coin.symbol})`);
    setResults([]);
    // Precio lo obtenemos al guardar vía external_id — mostramos un placeholder
    setPrice(null);
  }

  function clear() { setSelected(null); setQuery(""); setResults([]); setPrice(null); }

  async function save() {
    if (!selected || !quantity || parseFloat(quantity) <= 0) return;
    setSaving(true); setError("");
    try {
      const res = await authFetch("/positions/manual", {
        method: "POST",
        body: JSON.stringify({
          asset_type: "CRYPTO",
          ticker: selected.symbol,
          description: selected.name,
          quantity: parseFloat(quantity),
          purchase_price_usd: price ?? 0,
          ppc_ars: 0,
          purchase_fx_rate: 0,
          external_id: selected.id,
          fci_categoria: null,
          manual_yield_pct: null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || `Error ${res.status}`); return; }
      onSuccess();
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setSaving(false); }
  }

  const qty = parseFloat(quantity);
  const valid = !!selected && !!quantity && qty > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-bf-text">Cripto</h2>
        <p className="text-xs text-bf-text-3 mt-0.5">El precio actual se obtiene automáticamente de CoinGecko</p>
      </div>

      {/* Search crypto */}
      <div className="relative">
        <label className="text-xs text-bf-text-3 mb-1.5 block">Buscar criptomoneda</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bf-text-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Bitcoin, ETH, SOL..."
            className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl pl-9 pr-9 py-3 text-bf-text text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          {(query || searching) && (
            <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-bf-text-3 hover:text-bf-text-2">
              {searching ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            </button>
          )}
        </div>

        {/* Dropdown */}
        {results.length > 0 && !selected && (
          <div className="absolute z-20 mt-1 w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl overflow-hidden shadow-xl">
            {results.map((coin) => (
              <button key={coin.id} onClick={() => selectCoin(coin)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bf-surface-3 transition-colors text-left">
                {coin.thumb ? (
                  <img src={coin.thumb} alt={coin.name} className="w-6 h-6 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-bf-surface-3 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-bf-text truncate">{coin.name}</p>
                  <p className="text-[10px] text-bf-text-4">{coin.symbol}{coin.market_cap_rank ? ` · #${coin.market_cap_rank}` : ""}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected coin badge */}
      {selected && (
        <div className="flex items-center gap-3 bg-blue-600/10 border border-blue-500/30 rounded-xl px-4 py-3">
          {selected.thumb && <img src={selected.thumb} alt={selected.name} className="w-8 h-8 rounded-full" />}
          <div>
            <p className="text-sm font-semibold text-bf-text">{selected.name}</p>
            <p className="text-[11px] text-bf-text-4">{selected.symbol} · Precio al guardar: CoinGecko en vivo</p>
          </div>
          <button onClick={clear} className="ml-auto text-bf-text-3 hover:text-bf-text-2"><X size={14} /></button>
        </div>
      )}

      {/* Cantidad */}
      <div>
        <label className="text-xs text-bf-text-3 mb-1.5 block">Cantidad</label>
        <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={quantity}
          onChange={(e) => { setQuantity(e.target.value); setError(""); }}
          placeholder="0.05"
          className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl px-4 py-3 text-bf-text text-lg focus:outline-none focus:border-blue-500 transition-colors" />
        {selected && qty > 0 && (
          <p className="text-[11px] text-bf-text-4 mt-1.5 px-1">
            {qty} {selected.symbol} · valor se calculará al guardar
          </p>
        )}
      </div>

      {error && <ErrorBanner msg={error} />}
      <SaveButton onClick={save} saving={saving} disabled={!valid} />
    </div>
  );
}

// ── Subcomponent: Real Estate form ──────────────────────────────────────────

interface ExistingRestate {
  id: number;
  ticker: string;
  description: string;
  current_value_usd: number;
  annual_yield_pct: number;
  monthly_return_usd: number;
}

type RentMode = "rent" | "yield";

function RealEstateForm({ onSuccess, initialEditId }: { onSuccess: () => void; initialEditId?: number }) {
  // Existing properties
  const [existing, setExisting] = useState<ExistingRestate[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const autoOpenedRef = useRef(false);
  const [editValuation, setEditValuation] = useState("");
  const [editRent, setEditRent] = useState("");
  const [editRentMode, setEditRentMode] = useState<RentMode>("rent");
  const [editYieldPct, setEditYieldPct] = useState("");
  const [updateSaving, setUpdateSaving] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // New property
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<NominatimResult[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false);
  const [valuation, setValuation] = useState("");
  const [rentMode, setRentMode] = useState<RentMode>("rent");
  const [rent, setRent] = useState("");
  const [yieldInput, setYieldInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    authFetch("/positions/manual")
      .then((r) => r.json())
      .then((data: ExistingRestate[]) => {
        const filtered = (data as ExistingRestate[]).filter((p) => p.ticker.startsWith("RESTATE"));
        setExisting(filtered);
        // Auto-abrir edición si llega con un ID específico desde InstrumentDetail
        if (initialEditId && !autoOpenedRef.current) {
          autoOpenedRef.current = true;
          const target = filtered.find((p) => p.id === initialEditId);
          if (target) startEdit(target);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAddressChange(val: string) {
    setAddress(val);
    setAddressSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 4) { setAddressSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      setLoadingAddress(true);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=0`, {
        headers: { "Accept-Language": "es", "User-Agent": "BuildFuture/1.0" }
      })
        .then((r) => r.json())
        .then((d: NominatimResult[]) => setAddressSuggestions(d))
        .catch(() => setAddressSuggestions([]))
        .finally(() => setLoadingAddress(false));
    }, 400);
  }

  function selectAddress(place: NominatimResult) {
    setAddress(place.display_name);
    setAddressSuggestions([]);
    setAddressSelected(true);
  }

  // Derived values for new property
  const valuationNum = parseFloat(valuation);
  const rentNum = rentMode === "rent" ? parseFloat(rent) : 0;
  const yieldFromRent = valuationNum > 0 && rentNum > 0 ? (rentNum * 12) / valuationNum * 100 : null;
  const rentFromYield = rentMode === "yield" && valuationNum > 0 && parseFloat(yieldInput) > 0
    ? (parseFloat(yieldInput) / 100) * valuationNum / 12
    : null;

  const displayYield = rentMode === "rent" ? yieldFromRent : (parseFloat(yieldInput) || null);
  const displayRent = rentMode === "yield" ? rentFromYield : (rentNum || null);

  const valid = name.trim().length > 1 && address.trim().length > 3 && valuationNum > 0 && (
    rentMode === "rent" ? rentNum > 0 : parseFloat(yieldInput) > 0
  );

  // Derived for edit form
  const editValNum = parseFloat(editValuation);
  const editRentNum = editRentMode === "rent" ? parseFloat(editRent) : 0;
  const editYieldFromRent = editValNum > 0 && editRentNum > 0 ? (editRentNum * 12) / editValNum * 100 : null;
  const editRentFromYield = editRentMode === "yield" && editValNum > 0 && parseFloat(editYieldPct) > 0
    ? (parseFloat(editYieldPct) / 100) * editValNum / 12
    : null;

  function startEdit(prop: ExistingRestate) {
    setEditingId(prop.id);
    setEditValuation(prop.current_value_usd.toString());
    // Pre-cargar renta mensual si existe
    if (prop.monthly_return_usd > 0) {
      setEditRentMode("rent");
      setEditRent(prop.monthly_return_usd.toFixed(0));
      setEditYieldPct("");
    } else if (prop.annual_yield_pct > 0) {
      setEditRentMode("yield");
      setEditYieldPct((prop.annual_yield_pct * 100).toFixed(2));
      setEditRent("");
    } else {
      setEditRentMode("rent");
      setEditRent("");
      setEditYieldPct("");
    }
    setUpdateError("");
  }

  async function saveUpdate() {
    if (!editingId) return;
    setUpdateSaving(true); setUpdateError("");
    try {
      const body: Record<string, number> = { purchase_price_usd: editValNum };
      if (editRentMode === "rent" && editRentNum > 0) {
        body.monthly_rent_usd = editRentNum;
      } else if (editRentMode === "yield" && parseFloat(editYieldPct) > 0) {
        body.manual_yield_pct = parseFloat(editYieldPct) / 100;
      }
      const res = await authFetch(`/positions/manual/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setUpdateError(d.detail || `Error ${res.status}`); return; }
      // Si venía desde InstrumentDetail (initialEditId), redirigir con feedback de éxito
      if (initialEditId) {
        onSuccess();
        return;
      }
      setEditingId(null);
      // Refresh list
      const fresh = await authFetch("/positions/manual").then((r) => r.json());
      setExisting((fresh as ExistingRestate[]).filter((p) => p.ticker.startsWith("RESTATE")));
    } catch (e) { setUpdateError(e instanceof Error ? e.message : "Error de conexión"); }
    finally { setUpdateSaving(false); }
  }

  async function save() {
    if (!valid) return;
    setSaving(true); setError("");
    const monthlyRent = rentMode === "rent" ? rentNum : rentFromYield ?? 0;
    try {
      const res = await authFetch("/positions/manual", {
        method: "POST",
        body: JSON.stringify({
          asset_type: "REAL_ESTATE",
          ticker: "RESTATE",
          description: name.trim().slice(0, 80),
          quantity: 1.0,
          purchase_price_usd: valuationNum,
          ppc_ars: 0,
          purchase_fx_rate: 0,
          external_id: address.slice(0, 200),
          fci_categoria: null,
          manual_yield_pct: null,
          monthly_rent_usd: monthlyRent,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || `Error ${res.status}`); return; }
      onSuccess();
    } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-bf-text">Inmueble</h2>
        <p className="text-xs text-bf-text-3 mt-0.5">Departamento, casa o local que alquilás</p>
      </div>

      {/* Existing properties */}
      {!loadingExisting && existing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-bf-text-2 uppercase tracking-wide">Mis inmuebles</p>
          {existing.map((prop) => (
            <div key={prop.id} className="bg-bf-surface-2 border border-bf-border-2 rounded-xl px-4 py-3">
              {editingId === prop.id ? (
                <div className="space-y-3">
                  <p className="text-xs text-bf-text-2 font-medium truncate">{prop.description}</p>
                  {/* Valuation */}
                  <div>
                    <label className="text-[11px] text-bf-text-3 mb-1 block">Nueva valuación (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bf-text-3 text-xs">$</span>
                      <input type="text" inputMode="decimal" value={editValuation}
                        onChange={(e) => setEditValuation(e.target.value)}
                        className="w-full bg-bf-surface border border-bf-border rounded-lg pl-6 pr-3 py-2 text-bf-text text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  {/* Rent mode toggle */}
                  <div className="flex gap-1.5">
                    {(["rent", "yield"] as RentMode[]).map((m) => (
                      <button key={m} onClick={() => setEditRentMode(m)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${editRentMode === m ? "bg-blue-600 text-white" : "bg-bf-surface border border-bf-border text-bf-text-3"}`}>
                        {m === "rent" ? "Renta mensual (USD)" : "Yield anual (%)"}
                      </button>
                    ))}
                  </div>
                  {editRentMode === "rent" ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bf-text-3 text-xs">$</span>
                      <input type="text" inputMode="decimal" value={editRent}
                        onChange={(e) => setEditRent(e.target.value)} placeholder="600"
                        className="w-full bg-bf-surface border border-bf-border rounded-lg pl-6 pr-3 py-2 text-bf-text text-sm focus:outline-none focus:border-blue-500" />
                      {editYieldFromRent !== null && (
                        <p className="text-[10px] text-bf-text-4 mt-1">≈ {editYieldFromRent.toFixed(2)}% anual</p>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="text" inputMode="decimal" value={editYieldPct}
                        onChange={(e) => setEditYieldPct(e.target.value)} placeholder="6.0"
                        className="w-full bg-bf-surface border border-bf-border rounded-lg px-3 py-2 text-bf-text text-sm focus:outline-none focus:border-blue-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-bf-text-3 text-xs">%</span>
                      {editRentFromYield !== null && (
                        <p className="text-[10px] text-bf-text-4 mt-1">≈ USD {editRentFromYield.toFixed(0)}/mes</p>
                      )}
                    </div>
                  )}
                  {updateError && <ErrorBanner msg={updateError} />}
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium border border-bf-border text-bf-text-3 hover:text-bf-text transition-colors">
                      Cancelar
                    </button>
                    <button onClick={saveUpdate} disabled={updateSaving || !editValNum}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors flex items-center justify-center gap-1">
                      {updateSaving && <Loader2 size={11} className="animate-spin" />}
                      {updateSaving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-bf-text truncate">{prop.description}</p>
                    <p className="text-[11px] text-bf-text-4 mt-0.5">
                      USD {prop.current_value_usd.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <button onClick={() => startEdit(prop)}
                    className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors shrink-0 ml-3">
                    Actualizar
                  </button>
                </div>
              )}
            </div>
          ))}
          {!initialEditId && (
            <div className="border-t border-bf-border pt-4">
              <p className="text-xs font-semibold text-bf-text-2 uppercase tracking-wide mb-3">Agregar otro inmueble</p>
            </div>
          )}
        </div>
      )}

      {/* Form para agregar nuevo inmueble — se oculta cuando se viene a editar uno existente */}
      {!initialEditId && (
        <>
          {/* Nombre del inmueble */}
          <div>
            <label className="text-xs text-bf-text-3 mb-1.5 block">Nombre del inmueble *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Departamento en Córdoba, Local comercial"
              className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl px-4 py-3 text-bf-text text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-[11px] text-bf-text-4 mt-1.5 px-1">Este nombre aparecerá en tu listado de posiciones</p>
          </div>

          {/* Dirección con autocomplete */}
          <div className="relative">
            <label className="text-xs text-bf-text-3 mb-1.5 block">Ubicación del inmueble *</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bf-text-3 pointer-events-none" />
              <input
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Av. Corrientes 1234, CABA"
                className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl pl-9 pr-4 py-3 text-bf-text text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              {loadingAddress && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-bf-text-3 animate-spin" />
              )}
            </div>
            {addressSuggestions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                {addressSuggestions.map((place) => (
                  <button key={place.place_id} onClick={() => selectAddress(place)}
                    className="w-full flex items-start gap-2.5 px-4 py-3 hover:bg-bf-surface-3 transition-colors text-left">
                    <MapPin size={12} className="text-bf-text-4 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-bf-text-2 leading-tight">{place.display_name}</span>
                  </button>
                ))}
              </div>
            )}
            {addressSelected && (
              <p className="text-[11px] text-emerald-400 mt-1.5 px-1">✓ Dirección confirmada</p>
            )}
          </div>

          {/* Valuación */}
          <div>
            <label className="text-xs text-bf-text-3 mb-1.5 block">Valuación del inmueble (USD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bf-text-3 text-sm">$</span>
              <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={valuation}
                onChange={(e) => { setValuation(e.target.value); setError(""); }}
                placeholder="120.000"
                className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl pl-7 pr-4 py-3 text-bf-text text-lg focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <p className="text-[11px] text-bf-text-4 mt-1.5 px-1">Tu estimación del valor de mercado en dólares</p>
          </div>

          {/* Renta / Yield toggle */}
          <div className="space-y-2">
            <label className="text-xs text-bf-text-3 block">Rentabilidad *</label>
            <div className="flex gap-2">
              {(["rent", "yield"] as RentMode[]).map((m) => (
                <button key={m} onClick={() => { setRentMode(m); setRent(""); setYieldInput(""); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors border ${rentMode === m ? "bg-blue-600 text-white border-blue-500" : "bg-bf-surface border-bf-border text-bf-text-3"}`}>
                  {m === "rent" ? "Renta mensual (USD)" : "Yield anual (%)"}
                </button>
              ))}
            </div>
            {rentMode === "rent" ? (
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bf-text-3 text-sm">$</span>
                  <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={rent}
                    onChange={(e) => { setRent(e.target.value); setError(""); }}
                    placeholder="600"
                    className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl pl-7 pr-4 py-3 text-bf-text text-lg focus:outline-none focus:border-blue-500 transition-colors" />
                  {displayYield !== null && (
                    <p className="text-[11px] text-bf-text-4 mt-1.5 px-1">≈ {displayYield.toFixed(2)}% anual</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={yieldInput}
                    onChange={(e) => { setYieldInput(e.target.value); setError(""); }}
                    placeholder="6.0"
                    className="w-full bg-bf-surface-2 border border-bf-border-2 rounded-xl pl-4 pr-8 py-3 text-bf-text text-lg focus:outline-none focus:border-blue-500 transition-colors" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-bf-text-3 text-sm">%</span>
                  {displayRent !== null && (
                    <p className="text-[11px] text-bf-text-4 mt-1.5 px-1">≈ USD {displayRent.toFixed(0)}/mes</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Yield preview */}
          {displayYield !== null && displayYield > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-bf-text-3">Yield anual estimado</span>
              <span className="text-sm font-bold text-emerald-400">{displayYield.toFixed(2)}% anual</span>
            </div>
          )}

          {error && <ErrorBanner msg={error} />}
          <SaveButton onClick={save} saving={saving} disabled={!valid} label="Agregar inmueble" />
        </>
      )}
    </div>
  );
}

// ── Shared UI ───────────────────────────────────────────────────────────────

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
      <AlertCircle size={12} /> {msg}
    </div>
  );
}

function SaveButton({ onClick, saving, disabled, label = "Agregar al portafolio" }: {
  onClick: () => void; saving: boolean; disabled: boolean; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={saving || disabled}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors">
      {saving && <Loader2 size={14} className="animate-spin" />}
      {saving ? "Guardando..." : label}
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function AddManualPosition({
  initialMode = "CASH",
  initialEditId,
}: {
  initialMode?: AssetMode;
  initialEditId?: number;
}) {
  const router = useRouter();
  const mode: AssetMode = initialMode;
  const [success, setSuccess] = useState<AssetMode | null>(null);

  const SUCCESS_LABELS: Record<AssetMode, string> = {
    CASH: "Efectivo agregado",
    CRYPTO: "Cripto agregada",
    REAL_ESTATE: "Inmueble guardado",
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <CheckCircle2 size={40} className="text-emerald-400" />
        <p className="text-sm font-semibold text-bf-text">{SUCCESS_LABELS[success]}</p>
        <p className="text-xs text-bf-text-3">Redirigiendo al portafolio…</p>
      </div>
    );
  }

  function handleSuccess() {
    setSuccess(mode);
    setTimeout(() => router.push("/portfolio"), 1500);
  }

  return (
    <div className="space-y-5">

      {/* Form by mode */}
      {mode === "CASH"        && <CashForm       onSuccess={handleSuccess} />}
      {mode === "CRYPTO"      && <CryptoForm     onSuccess={handleSuccess} />}
      {mode === "REAL_ESTATE" && <RealEstateForm onSuccess={handleSuccess} initialEditId={initialEditId} />}
    </div>
  );
}

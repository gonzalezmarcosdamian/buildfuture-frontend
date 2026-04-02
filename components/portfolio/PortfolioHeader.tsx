"use client";
import { useCurrency } from "@/lib/currency-context";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { RentaInfoButton } from "@/components/portfolio/RentaModal";
import { formatUSD, formatARS, formatPct } from "@/lib/formatters";

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
}: Props) {
  const { currency } = useCurrency();

  // Renta fija: LETRA/FCI/BOND con el yield real del instrumento (directo de IOL)
  const monthlyRentaFija = positions
    .filter((p) => RENTA_TYPES.has(p.asset_type) || p.asset_type === "BOND")
    .reduce((s, p) => {
      const y = p.annual_yield_pct;
      const monthly = p.asset_type === "BOND"
        ? (p.current_value_usd * y * 0.5) / 12   // BOND: 50% va a renta
        : (p.current_value_usd * y) / 12;
      return s + monthly;
    }, 0);

  // Capital: CEDEAR + ETF + CRYPTO (del prop o calculado inline)
  const capitalUsd = capitalTotalUsd ?? positions
    .filter((p) => CAPITAL_TYPES.has(p.asset_type))
    .reduce((s, p) => s + p.current_value_usd, 0);

  const totalArsDisplay = totalArs ?? totalUsd * mep;
  const fmt = (usd: number) =>
    currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);
  const total = currency === "USD" ? formatUSD(totalUsd) : formatARS(totalArsDisplay);
  const hint  = currency === "USD" ? `≈ ${formatARS(totalArsDisplay)}` : `≈ ${formatUSD(totalUsd)}`;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      {/* ── Total + toggle ─────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Portafolio total</p>
          <CurrencyToggle />
        </div>
        <p className="text-3xl font-extrabold text-slate-100">{total}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>
      </div>

      {/* ══ RENTA ══════════════════════════════════════════ */}
      <div className="border-t border-slate-800/80">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-emerald-500 rounded-full" />
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Renta mensual</p>
            <RentaInfoButton mep={mep} />
          </div>
          <div className="flex items-end gap-1">
            <span className="text-lg font-bold text-emerald-400">{fmt(monthlyReturnUsd)}</span>
            <span className="text-[10px] text-slate-500 pb-0.5">/mes</span>
          </div>
        </div>

        <div className="px-5 pb-3 grid grid-cols-2 gap-3">
          <div className="bg-slate-800/40 rounded-xl px-3 py-2 text-center">
            <p className="text-[9px] text-slate-500 mb-0.5">Renta / año</p>
            <p className="text-sm font-semibold text-emerald-400">{fmt(monthlyReturnUsd * 12)}</p>
          </div>
          <div className="bg-slate-800/40 rounded-xl px-3 py-2 text-center">
            <p className="text-[9px] text-slate-500 mb-0.5">Cobertura gastos</p>
            <p className="text-sm font-semibold text-blue-400">{formatPct(freedomPct)}</p>
          </div>
        </div>

        {/* Desglose fija vs estimada */}
        {monthlyRentaFija > 0.01 && (
          <div className="px-5 pb-3 flex gap-3">
            <span className="text-[9px] text-emerald-700">
              {fmt(monthlyRentaFija)} renta fija (LECAP/FCI)
            </span>
            {annualReturnPct > 0 && (
              <span className="text-[9px] text-slate-600">
                · yield portafolio {(annualReturnPct * 100).toFixed(1)}% anual
              </span>
            )}
          </div>
        )}
      </div>

      {/* ══ CAPITAL ════════════════════════════════════════ */}
      <div className="border-t-2 border-slate-700/60">
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-violet-500 rounded-full" />
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Capital acumulado</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-violet-300">{fmt(capitalUsd)}</p>
            <p className="text-[9px] text-slate-600">CEDEARs · ETFs · Crypto</p>
          </div>
        </div>
      </div>
    </div>
  );
}

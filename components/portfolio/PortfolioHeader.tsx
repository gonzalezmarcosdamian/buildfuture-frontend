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
  cashTotalUsd?: number | null;
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
          <CurrencyToggle />
        </div>
        <p className="text-3xl font-extrabold text-bf-text">{total}</p>
        <p className="text-[10px] text-bf-text-3 mt-0.5">{hint}</p>
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
    </div>
  );
}

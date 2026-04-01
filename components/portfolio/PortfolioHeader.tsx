"use client";
import { useCurrency } from "@/lib/currency-context";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { RentaInfoButton } from "@/components/portfolio/RentaModal";
import { formatUSD, formatARS, formatPct } from "@/lib/formatters";

const FIXED_TYPES = new Set(["LETRA", "FCI", "BOND", "ON"]);

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
}

export function PortfolioHeader({
  totalUsd,
  totalArs,
  monthlyReturnUsd,
  annualReturnPct,
  freedomPct,
  mep,
  positions,
}: Props) {
  const { currency } = useCurrency();

  const monthlyFixed = positions
    .filter((p) => FIXED_TYPES.has(p.asset_type))
    .reduce((s, p) => s + (p.current_value_usd * p.annual_yield_pct) / 12, 0);
  const monthlyVar = monthlyReturnUsd - monthlyFixed;

  // Si tenemos total_ars directo de IOL, usarlo para evitar error de MEP
  const totalArsDisplay = totalArs ?? totalUsd * mep;
  const fmt = (usd: number) =>
    currency === "USD" ? formatUSD(usd) : formatARS(usd * mep);

  const total    = currency === "USD" ? formatUSD(totalUsd) : formatARS(totalArsDisplay);
  const monthly  = fmt(monthlyReturnUsd);
  const annual   = fmt(monthlyReturnUsd * 12);
  const hint     = currency === "USD" ? `≈ ${formatARS(totalArsDisplay)}` : `≈ ${formatUSD(totalUsd)}`;
  const monthHint= currency === "USD" ? `≈ ${formatARS(monthlyReturnUsd * mep)}` : `≈ ${formatUSD(monthlyReturnUsd)}`;

  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
      <div className="flex justify-between items-start mb-3">
        {/* Total */}
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
            <CurrencyToggle />
          </div>
          <p className="text-3xl font-extrabold text-slate-100">{total}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>
        </div>

        {/* Renta mensual */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 mb-0.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Renta mensual</p>
            <RentaInfoButton mep={mep} />
          </div>
          <p className="text-xl font-bold text-emerald-400">{monthly}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{monthHint}</p>
          {monthlyVar > 0.01 && (
            <div className="flex gap-2 mt-1 justify-end">
              <span className="text-[9px] text-emerald-600">{fmt(monthlyFixed)} fija</span>
              <span className="text-[9px] text-blue-600">~{fmt(monthlyVar)} estimada</span>
            </div>
          )}
        </div>
      </div>

      {/* Renta anual + Freedom */}
      <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Renta estimada / año</p>
          <p className="text-sm font-semibold text-emerald-400">{annual}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Cobertura gastos</p>
          <p className="text-sm font-semibold text-blue-400">
            {formatPct(freedomPct)}
          </p>
        </div>
      </div>
    </div>
  );
}

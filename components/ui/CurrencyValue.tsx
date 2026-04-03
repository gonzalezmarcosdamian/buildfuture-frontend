"use client";
import { useCurrency } from "@/lib/currency-context";
import { formatUSD, formatARS } from "@/lib/formatters";

interface Props {
  usd: number;
  mep: number;
  className?: string;
  /** Muestra el valor de la moneda secundaria como hint */
  hint?: boolean;
  /** Oculta la banderita (útil cuando el contenedor ya la muestra) */
  noFlag?: boolean;
}

const FLAG: Record<"USD" | "ARS", string> = {
  USD: "🇺🇸",
  ARS: "🇦🇷",
};

export function CurrencyValue({ usd, mep, className, hint, noFlag }: Props) {
  const { currency } = useCurrency();
  const primary   = currency === "USD" ? formatUSD(usd)       : formatARS(usd * mep);
  const secondary = currency === "USD" ? formatARS(usd * mep) : formatUSD(usd);

  return (
    <span className={className}>
      {!noFlag && (
        <span className="mr-0.5 text-[11px] leading-none">{FLAG[currency]}</span>
      )}
      {primary}
      {hint && (
        <span className="text-[10px] text-bf-text-3 ml-1 font-normal">
          ≈ {FLAG[currency === "USD" ? "ARS" : "USD"]} {secondary}
        </span>
      )}
    </span>
  );
}

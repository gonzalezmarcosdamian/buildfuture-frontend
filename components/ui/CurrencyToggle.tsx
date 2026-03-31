"use client";
import { useCurrency } from "@/lib/currency-context";

export function CurrencyToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { currency, toggle } = useCurrency();

  const pill = size === "sm"
    ? "text-[10px] px-1 py-px gap-1"
    : "text-[11px] px-1.5 py-0.5 gap-1.5";

  const opt = size === "sm"
    ? "px-1.5 py-px rounded-md text-[10px]"
    : "px-2 py-1 rounded-lg text-[11px]";

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center bg-slate-800 border border-slate-700 rounded-xl ${pill} transition-colors hover:border-slate-600`}
      aria-label="Cambiar moneda"
    >
      <span className={`font-semibold transition-all ${opt} ${
        currency === "USD"
          ? "bg-slate-700 text-slate-100 shadow-sm"
          : "text-slate-500"
      }`}>
        🇺🇸 USD
      </span>
      <span className={`font-semibold transition-all ${opt} ${
        currency === "ARS"
          ? "bg-slate-700 text-slate-100 shadow-sm"
          : "text-slate-500"
      }`}>
        🇦🇷 ARS
      </span>
    </button>
  );
}

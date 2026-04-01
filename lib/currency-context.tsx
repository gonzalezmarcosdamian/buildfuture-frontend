"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Currency = "USD" | "ARS";

interface CurrencyCtx {
  currency: Currency;
  toggle: () => void;
}

const Ctx = createContext<CurrencyCtx>({ currency: "USD", toggle: () => {} });

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    const stored = localStorage.getItem("bf_currency") as Currency | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "USD" || stored === "ARS") setCurrency(stored);
  }, []);

  function toggle() {
    setCurrency((c) => {
      const next: Currency = c === "USD" ? "ARS" : "USD";
      localStorage.setItem("bf_currency", next);
      return next;
    });
  }

  return <Ctx.Provider value={{ currency, toggle }}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  return useContext(Ctx);
}

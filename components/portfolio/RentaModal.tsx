"use client";
import { useState } from "react";
import { Info, X, TrendingUp, Shield } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import { formatUSD, formatARS } from "@/lib/formatters";

interface Props {
  mep: number;
}

const FLAG: Record<"USD" | "ARS", string> = { USD: "🇺🇸", ARS: "🇦🇷" };

function RentaModal({ mep, onClose }: Props & { onClose: () => void }) {
  const { currency } = useCurrency();

  const fmt = (usd: number) =>
    `${FLAG[currency]} ${currency === "USD" ? formatUSD(usd) : formatARS(usd * mep)}`;

  // Ejemplos didácticos
  const letraCapitalUsd = 1_000_000 / mep;
  const letraMonthly    = letraCapitalUsd * Math.min(0.68, 0.15) / 12; // cap 15% USD
  const fciCapitalUsd   = 500;
  const fciMonthly      = fciCapitalUsd * 0.08 / 12;
  const cedearUsd       = 5_000;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-t-2xl p-5 w-full max-w-lg border-t border-slate-700 space-y-5 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100">¿Cómo se calcula la renta?</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          El portafolio se divide en dos carriles con lógicas distintas:
          <span className="text-emerald-300 font-medium"> renta</span> (lo que genera por mes)
          y <span className="text-violet-300 font-medium"> capital</span> (lo que acumula a largo plazo).
        </p>

        {/* ── RENTA ─────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">💰 Renta mensual — LECAP / FCI / Bonos</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Son instrumentos que generan ingreso periódico predecible. Su rendimiento alimenta la{" "}
            <span className="text-emerald-400">barra de cobertura de gastos</span>: cuántos de tus gastos mensuales cubre el portafolio hoy.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-yellow-400 bg-yellow-900/40 px-1.5 py-0.5 rounded">LECAP</span>
              <span className="text-[11px] text-slate-300 font-medium">Letras del Tesoro en ARS</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              TNA nominal ~68% ARS. Para proyectar en USD lo convertimos a rendimiento real:
              usamos un techo de <span className="text-emerald-400 font-medium">15% anual USD</span> para evitar que la inflación ARS infle el número.
            </p>
            <div className="bg-slate-900 rounded-lg p-2.5 font-mono text-[10px] space-y-1">
              <div className="text-slate-500">$1.000.000 ARS → {fmt(letraCapitalUsd)} · cap 15% USD</div>
              <div className="text-slate-400">
                {fmt(letraCapitalUsd)} × 15% ÷ 12 ={" "}
                <span className="text-emerald-400 font-bold">{fmt(letraMonthly)}/mes</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-teal-400 bg-teal-900/40 px-1.5 py-0.5 rounded">FCI</span>
              <span className="text-[11px] text-slate-300 font-medium">Fondos Money Market / Renta Fija</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              La cuotaparte sube todos los días. Rendimiento estable, alineado con la tasa del BCRA.
            </p>
            <div className="bg-slate-900 rounded-lg p-2.5 font-mono text-[10px] space-y-1">
              <div className="text-slate-500">{fmt(fciCapitalUsd)} en el fondo, TNA ~8% USD</div>
              <div className="text-slate-400">
                {fmt(fciCapitalUsd)} × 8% ÷ 12 ={" "}
                <span className="text-emerald-400 font-bold">{fmt(fciMonthly)}/mes</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CAPITAL ───────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-violet-400" />
            <span className="text-xs font-bold text-violet-300">📈 Capital — CEDEAR / ETF / Crypto</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            No generan renta mensual fija. Su valor <span className="text-violet-300">se acumula como capital</span> y alimenta la{" "}
            <span className="text-violet-400">proyección a 10 años</span> y tus metas de largo plazo (casa, auto, viaje).
          </p>

          <div className="bg-slate-800/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-violet-400 bg-violet-900/40 px-1.5 py-0.5 rounded">CEDEAR / ETF</span>
              <span className="text-[11px] text-slate-300 font-medium">Acciones y fondos USA</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Su retorno es apreciación de precio, no cupón. Aparecen en tu total de capital acumulado
              y en la curva de proyección — no en la barra de renta mensual.
            </p>
            <div className="bg-slate-900 rounded-lg p-2.5 font-mono text-[10px] space-y-1">
              <div className="text-slate-500">{fmt(cedearUsd)} en QQQ/SPY → van al bucket capital</div>
              <div className="text-violet-400 font-bold">{fmt(cedearUsd)} acumulado · crece con el tiempo</div>
              <div className="text-slate-600 mt-1">Historial S&amp;P 500 ~10% anual USD → aparece en proyección</div>
            </div>
          </div>
        </div>

        {/* ── Resumen ─────────────────────────────────────────── */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3.5 space-y-2">
          <p className="text-[11px] font-semibold text-slate-200">Dos carriles, dos métricas</p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">💰</span>
              <p className="text-[11px] text-slate-400">
                <span className="text-emerald-400 font-medium">Renta mensual</span>: lo que tu portafolio genera hoy.
                Cubre gastos actuales. Aparece en la barra de libertad financiera.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">📈</span>
              <p className="text-[11px] text-slate-400">
                <span className="text-violet-300 font-medium">Capital acumulado</span>: lo que creció y sigue creciendo.
                Alimenta tus metas a largo plazo y la proyección de interés compuesto.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 text-center">
          MEP: 🇦🇷 ${mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })} · Yields actualizados según IOL
        </p>
      </div>
    </div>
  );
}

export function RentaInfoButton({ mep }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="¿Cómo se calcula?"
      >
        <Info size={13} />
      </button>
      {open && <RentaModal mep={mep} onClose={() => setOpen(false)} />}
    </>
  );
}

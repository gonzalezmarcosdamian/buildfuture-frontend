"use client";
import { useState } from "react";
import { Info, X, TrendingUp, Shield, Repeat, DollarSign } from "lucide-react";
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
  const fmtHint = (usd: number) =>
    currency === "USD"
      ? `≈ 🇦🇷 ${formatARS(usd * mep)}`
      : `≈ 🇺🇸 ${formatUSD(usd)}`;

  // Ejemplos didácticos fijos (no datos reales del usuario)
  const letraCapital = 1_000_000; // ARS → USD
  const letraCapitalUsd = letraCapital / mep;
  const letraTNA = 0.68;
  const letraMonthlyUsd = letraCapitalUsd * letraTNA / 12;

  const fciCapitalUsd = 500;
  const fciTNA = 0.08;
  const fciMonthlyUsd = fciCapitalUsd * fciTNA / 12;

  const cedearCapitalUsd = 1_000;
  const cedearYield = 0.15;
  const cedearMonthlyUsd = cedearCapitalUsd * cedearYield / 12;

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

        {/* Intro */}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          El portafolio mezcla instrumentos que generan renta de formas distintas.
          Los separamos en dos grupos: lo que es <span className="text-emerald-300 font-medium">predecible</span> y lo que es <span className="text-blue-300 font-medium">estimado</span>.
        </p>

        {/* ── RENTA FIJA ─────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">Renta fija — predecible</span>
          </div>

          {/* LECAP */}
          <div className="bg-slate-800/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-yellow-400 bg-yellow-900/40 px-1.5 py-0.5 rounded">LECAP</span>
              <span className="text-[11px] text-slate-300 font-medium">Letras del Tesoro en ARS</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Capitalizan diariamente a una TNA fija. La renta se acumula sola, como un plazo fijo que nunca para.
            </p>
            <div className="bg-slate-900 rounded-lg p-2.5 space-y-1 font-mono text-[10px]">
              <div className="text-slate-500">Ejemplo: $1.000.000 ARS invertidos, TNA 68%</div>
              <div className="text-slate-400">
                {fmt(letraCapitalUsd)} × 68% ÷ 12 ={" "}
                <span className="text-emerald-400 font-bold">{fmt(letraMonthlyUsd)}/mes</span>
              </div>
              <div className="text-slate-600">{fmtHint(letraMonthlyUsd)}/mes</div>
            </div>
          </div>

          {/* FCI */}
          <div className="bg-slate-800/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-teal-400 bg-teal-900/40 px-1.5 py-0.5 rounded">FCI</span>
              <span className="text-[11px] text-slate-300 font-medium">Fondo Money Market</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              El fondo invierte en cauciones y plazos fijos mayoristas. La cuotaparte sube todos los días. La tasa varía con la política del BCRA, pero sin sorpresas bruscas.
            </p>
            <div className="bg-slate-900 rounded-lg p-2.5 space-y-1 font-mono text-[10px]">
              <div className="text-slate-500">Ejemplo: {fmt(fciCapitalUsd)} en el fondo, TNA ~8%</div>
              <div className="text-slate-400">
                {fmt(fciCapitalUsd)} × 8% ÷ 12 ={" "}
                <span className="text-emerald-400 font-bold">{fmt(fciMonthlyUsd)}/mes</span>
              </div>
              <div className="text-slate-600">{fmtHint(fciMonthlyUsd)}/mes</div>
            </div>
          </div>
        </div>

        {/* ── RENTA VARIABLE ─────────────────────────────────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" />
            <span className="text-xs font-bold text-blue-300">Apreciación estimada — variable</span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded">CEDEAR / ETF</span>
              <span className="text-[11px] text-slate-300 font-medium">Acciones y ETFs USA</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No pagan cupón. Su "renta" es la suba de precio. Mostramos la apreciación histórica anualizada ÷ 12 como referencia — pero cada mes puede ser muy distinto.
            </p>
            <div className="bg-slate-900 rounded-lg p-2.5 space-y-1 font-mono text-[10px]">
              <div className="text-slate-500">Ejemplo: {fmt(cedearCapitalUsd)} en QQQ, historial ~15%/año</div>
              <div className="text-slate-400">
                {fmt(cedearCapitalUsd)} × 15% ÷ 12 ={" "}
                <span className="text-blue-400 font-bold">~{fmt(cedearMonthlyUsd)}/mes</span>
              </div>
              <div className="text-slate-600">{fmtHint(cedearMonthlyUsd)}/mes</div>
              <div className="text-red-500/70 mt-1">⚠ En un mes malo puede ser −8% en vez de +1.25%</div>
            </div>
          </div>
        </div>

        {/* ── ¿Por qué sumamos los dos? ───────────────────────── */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3.5 space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-200">¿Por qué sumamos renta fija + estimada?</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            La renta fija es tu <span className="text-emerald-400">piso garantizado</span> — lo que llegás a fin de mes sin importar nada.
            La apreciación variable es tu <span className="text-blue-400">potencial de crecimiento</span> a largo plazo.
            Juntos te dan el número de libertad financiera real: cuánto trabaja el portafolio hoy,
            y cuánto puede trabajar mañana.
          </p>
        </div>

        <p className="text-[10px] text-slate-600 text-center">
          MEP usado: 🇦🇷 ${mep.toLocaleString("es-AR", { maximumFractionDigits: 0 })} · Yields actualizados según IOL
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

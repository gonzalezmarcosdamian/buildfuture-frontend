"use client";
import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";

export function ManualIntegrationCard() {
  return (
    <div className="bg-bf-surface rounded-2xl p-4 border border-bf-border">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-emerald-400">Cargas Manuales</p>
            <span className="text-[10px] bg-bf-surface-2 text-bf-text-3 px-1.5 py-0.5 rounded">
              MANUAL
            </span>
          </div>
          <p className="text-xs text-bf-text-3 mt-0.5">Efectivo en mano o caja de ahorro</p>
        </div>
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
      </div>

      <div className="mt-3 space-y-2">
        <Link
          href="/portfolio/add-manual"
          className="w-full flex items-center justify-center gap-2 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-800 text-emerald-400 text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          <Plus size={14} />
          Agregar efectivo
        </Link>

        <div className="space-y-1.5 pt-0.5">
          {(["Cripto", "FCI", "ETF / Acción", "Otro"] as const).map((label) => (
            <div
              key={label}
              className="flex items-center justify-between px-1 opacity-40"
            >
              <p className="text-xs text-bf-text-3">{label}</p>
              <span className="text-[10px] bg-bf-surface-2 text-bf-text-4 px-1.5 py-0.5 rounded">
                Próximamente
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


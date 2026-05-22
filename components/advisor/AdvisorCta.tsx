import Link from "next/link";
import { Bot, ChevronRight } from "lucide-react";

export function AdvisorCta() {
  return (
    <Link
      href="/advisor"
      className="flex items-center justify-between bg-bf-surface border border-bf-border hover:border-blue-700/50 rounded-2xl px-4 py-3.5 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-center shrink-0">
          <Bot size={16} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-bf-text">Invest Advisor</p>
          <p className="text-[11px] text-bf-text-3">Analizá tu cartera con IA · 5 consultas/día</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-bf-text-4 group-hover:text-blue-400 transition-colors" />
    </Link>
  );
}

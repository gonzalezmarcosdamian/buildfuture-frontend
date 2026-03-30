"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Wallet, Target, Settings, Home } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Inicio" },
  { href: "/portfolio", icon: Wallet, label: "Portafolio" },
  { href: "/budget", icon: BarChart2, label: "Presupuesto" },
  { href: "/goals", icon: Target, label: "Metas" },
  { href: "/settings", icon: Settings, label: "Config" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors ${
                active ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

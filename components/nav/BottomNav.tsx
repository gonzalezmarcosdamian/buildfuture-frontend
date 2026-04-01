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

  if (pathname === "/login") return null;

  return (
    <nav
      className="fixed left-3 right-3 z-50 bg-slate-900/95 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl shadow-black/40"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl transition-colors ${
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

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wallet, Target, Settings, Home } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home,    label: "Inicio" },
  { href: "/portfolio", icon: Wallet,  label: "Portafolio" },
  { href: "/goals",     icon: Target,  label: "Metas" },
  { href: "/settings",  icon: Settings, label: "Config" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);

  // Cuando el pathname cambia, la navegación completó
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(null);
  }, [pathname]);

  if (pathname === "/login") return null;

  const isLoading = pending !== null && pending !== pathname;

  return (
    <>
      {/* Top progress bar durante navegación */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 overflow-hidden">
          <div className="h-full bg-blue-500 animate-[progress_600ms_ease-out_forwards]" />
        </div>
      )}

      <nav
        className="fixed left-4 right-4 z-50 bg-bf-surface/70 backdrop-blur-xl border border-bf-border-2/50 rounded-2xl shadow-lg shadow-black/30"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            const isPending = pending === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => { if (!active) setPending(href); }}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl transition-colors ${
                  active ? "text-blue-400" : isPending ? "text-blue-300 opacity-70" : "text-bf-text-3 hover:text-bf-text-2"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.5}
                  className={isPending ? "animate-pulse" : ""}
                />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

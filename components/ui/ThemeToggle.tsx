"use client";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";

const OPTIONS = [
  { value: "light", icon: Sun,     label: "Claro" },
  { value: "system", icon: Monitor, label: "Sistema" },
  { value: "dark",  icon: Moon,    label: "Oscuro" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="flex bg-bf-surface-2 rounded-xl p-1 gap-1">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            theme === value
              ? "bg-bf-surface text-bf-text shadow-sm"
              : "text-bf-text-3 hover:text-bf-text-2"
          }`}
          aria-label={label}
        >
          <Icon size={13} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

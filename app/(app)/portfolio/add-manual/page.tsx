import { AddManualPosition } from "@/components/portfolio/AddManualPosition";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const MODE_TITLES: Record<string, { label: string; icon: string }> = {
  CASH:        { label: "Efectivo",  icon: "💵" },
  CRYPTO:      { label: "Cripto",    icon: "₿"  },
  REAL_ESTATE: { label: "Inmueble",  icon: "🏠"  },
};

export default async function AddManualPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode = "CASH" } = await searchParams;
  const { label, icon } = MODE_TITLES[mode] ?? MODE_TITLES.CASH;

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <Link
        href="/portfolio"
        className="flex items-center gap-1 text-bf-text-3 hover:text-bf-text-2 text-sm transition-colors w-fit"
      >
        <ChevronLeft size={16} />
        Portafolio
      </Link>
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">{icon}</span>
        <h1 className="text-xl font-bold text-bf-text">Agregar {label}</h1>
      </div>
      <AddManualPosition initialMode={mode as "CASH" | "CRYPTO" | "REAL_ESTATE"} />
    </div>
  );
}

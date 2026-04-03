import { AddManualPosition } from "@/components/portfolio/AddManualPosition";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AddManualPage() {
  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <Link
        href="/portfolio"
        className="flex items-center gap-1 text-bf-text-3 hover:text-bf-text-2 text-sm transition-colors w-fit"
      >
        <ChevronLeft size={16} />
        Portafolio
      </Link>
      <AddManualPosition />
    </div>
  );
}

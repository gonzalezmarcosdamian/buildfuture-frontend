import { fetchInstrumentDetail } from "@/lib/api-server";
import { InstrumentDetail } from "@/components/portfolio/InstrumentDetail";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InstrumentPage({ params }: { params: { ticker: string } }) {
  const instrument = await fetchInstrumentDetail(decodeURIComponent(params.ticker)).catch(() => null);
  if (!instrument) return notFound();

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <Link
        href="/portfolio"
        className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm transition-colors w-fit"
      >
        <ChevronLeft size={16} />
        Portafolio
      </Link>
      <InstrumentDetail instrument={instrument} />
    </div>
  );
}

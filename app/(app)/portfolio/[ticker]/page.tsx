import { fetchInstrumentDetail } from "@/lib/api-server";
import { InstrumentDetail } from "@/components/portfolio/InstrumentDetail";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InstrumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { ticker } = await params;
  const { id } = await searchParams;
  const instrument = await fetchInstrumentDetail(decodeURIComponent(ticker), id ? parseInt(id) : undefined).catch(() => null);
  if (!instrument) return notFound();

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <Link
        href="/portfolio"
        className="flex items-center gap-1 text-bf-text-3 hover:text-bf-text-2 text-sm transition-colors w-fit"
      >
        <ChevronLeft size={16} />
        Portafolio
      </Link>
      <InstrumentDetail instrument={instrument} />
    </div>
  );
}

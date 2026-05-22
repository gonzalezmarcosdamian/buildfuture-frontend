import { AdvisorFlow } from "@/components/advisor/AdvisorFlow";

export const dynamic = "force-dynamic";

export default function AdvisorPage() {
  return (
    <div className="px-4 pt-8 pb-24 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold text-bf-text">Invest Advisor</h1>
        <p className="text-xs text-bf-text-3 mt-0.5">Análisis con IA sobre tu portafolio real</p>
      </div>
      <AdvisorFlow />
    </div>
  );
}

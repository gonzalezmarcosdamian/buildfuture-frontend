import { fetchBudget } from "@/lib/api-server";
import { BudgetEditor } from "@/components/budget/BudgetEditor";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const budget = await fetchBudget();

  return (
    <div className="px-4 pt-8 space-y-5 pb-8">
      <div className="flex items-center gap-2">
        <Wallet size={20} className="text-bf-text-3" />
        <h1 className="text-xl font-bold text-bf-text">Mi presupuesto</h1>
      </div>

      <p className="text-sm text-bf-text-3">
        Configurá tu sueldo y distribución de gastos para calcular cuánto podés invertir cada mes.
      </p>

      {budget ? (
        <BudgetEditor initial={budget} />
      ) : (
        <p className="text-sm text-bf-text-3">No hay presupuesto configurado aún.</p>
      )}
    </div>
  );
}

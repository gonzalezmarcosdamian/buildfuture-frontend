"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TosModal } from "@/components/ui/TosModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8008";

interface TosStatus {
  accepted: boolean;
  version: string | null;
  summary: string | null;
}

export function TosGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<TosStatus | null>(null);

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        // No autenticado — no bloquear (rutas públicas)
        setStatus({ accepted: true, version: null, summary: null });
        return;
      }
      try {
        const res = await fetch(`${API_URL}/tos/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data2: TosStatus = await res.json();
        setStatus(data2);
      } catch {
        // Si falla el check no bloqueamos al usuario
        setStatus({ accepted: true, version: null, summary: null });
      }
    }
    check();
  }, []);

  // Mientras carga, render transparente (el layout ya tiene su propio loading)
  if (status === null) return <>{children}</>;

  return (
    <>
      {children}
      {!status.accepted && status.version && (
        <TosModal
          version={status.version}
          summary={status.summary}
          onAccepted={() => setStatus((s) => s ? { ...s, accepted: true } : s)}
        />
      )}
    </>
  );
}

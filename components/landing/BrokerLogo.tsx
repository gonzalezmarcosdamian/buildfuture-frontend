"use client";
import Image from "next/image";
import { useState } from "react";

/**
 * Logo de broker con fallback. Isla cliente (useState para error de imagen)
 * para que el resto de la landing pueda renderizarse como Server Component.
 */
export function BrokerLogo({
  domain,
  name,
  localLogo,
}: {
  domain: string | null;
  name: string;
  localLogo: string | null;
}) {
  const [err, setErr] = useState(false);
  if (localLogo) {
    return <Image src={localLogo} alt={name} width={32} height={32} className="object-contain" />;
  }
  if (domain && !err) {
    return (
      <Image
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={name}
        width={28}
        height={28}
        className="rounded-lg"
        onError={() => setErr(true)}
        unoptimized
      />
    );
  }
  return <span className="text-base font-bold text-slate-400">+</span>;
}

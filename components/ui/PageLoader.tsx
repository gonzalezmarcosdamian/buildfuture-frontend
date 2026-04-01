"use client";
import { useEffect, useState } from "react";

export function PageLoader() {
  const [width, setWidth] = useState(15);

  useEffect(() => {
    const t1 = setTimeout(() => setWidth(60), 80);
    const t2 = setTimeout(() => setWidth(85), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Top progress bar */}
      <div
        className="absolute top-0 left-0 h-0.5 bg-blue-500 transition-all duration-500 ease-out"
        style={{ width: `${width}%` }}
      />
      {/* Page skeleton */}
      <div className="px-4 pt-8 space-y-4 max-w-lg mx-auto">
        <div className="h-6 w-32 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
        <div className="h-24 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
        <div className="h-40 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
      </div>
    </div>
  );
}

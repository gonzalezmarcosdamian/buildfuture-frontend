"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Credits { used: number; remaining: number; limit: number }

const QUERY_TYPES = [
  { id: "portfolio",   icon: "📊", label: "Mi cartera",        placeholder: "¿Cómo está mi portafolio?" },
  { id: "technical",   icon: "📈", label: "Técnico",           placeholder: "Ej: AL30, GGAL, BTC..." },
  { id: "fundamental", icon: "🏢", label: "Fundamental",       placeholder: "Ej: MELI, YPF, GD35..." },
  { id: "macro",       icon: "🌍", label: "Macro ARG",         placeholder: "¿Pesos o dólares ahora?" },
  { id: "scenario",    icon: "🎯", label: "Escenario",         placeholder: "Ej: sube la tasa de la FED..." },
] as const;

type QueryTypeId = (typeof QUERY_TYPES)[number]["id"];

async function authFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

function MarkdownText({ text }: { text: string }) {
  // Render básico: bold, italic, headers, hr
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <p key={i} className="text-xs font-bold text-bf-text mt-2">{line.slice(4)}</p>;
        if (line.startsWith("## "))  return <p key={i} className="text-xs font-bold text-bf-text mt-2">{line.slice(3)}</p>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-xs font-semibold text-bf-text-2">{line.slice(2, -2)}</p>;
        if (line === "---") return <hr key={i} className="border-bf-border my-2" />;
        if (line.startsWith("- ")) return <p key={i} className="text-xs text-bf-text-2 pl-3 before:content-['·'] before:mr-1.5 before:text-bf-text-3">{line.slice(2)}</p>;
        if (line === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-xs text-bf-text-2 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export function AdvisorCard({ initialCredits }: { initialCredits?: Credits }) {
  const [credits, setCredits] = useState<Credits>(
    initialCredits ?? { used: 0, remaining: 5, limit: 5 }
  );
  const [selectedType, setSelectedType] = useState<QueryTypeId>("portfolio");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  const selected = QUERY_TYPES.find((t) => t.id === selectedType)!;
  const hasNoCredits = credits.remaining === 0;

  // Cargar créditos al montar
  useEffect(() => {
    authFetch("/advisor/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d))
      .catch(() => {});
  }, []);

  // Auto-scroll durante streaming
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  async function handleSubmit() {
    if (!query.trim() || loading || hasNoCredits) return;

    setLoading(true);
    setResponse("");
    setShowResponse(true);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch(`${API_URL}/advisor/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type: selectedType,
        query,
        ticker: ["technical", "fundamental"].includes(selectedType) ? query.split(" ")[0].toUpperCase() : undefined,
      }),
    });

    if (!res.body) { setLoading(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const raw = decoder.decode(value, { stream: true });
      for (const line of raw.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.chunk) {
            fullText += parsed.chunk;
            setResponse(fullText);
          }
          if (parsed.done) {
            setCredits((c) => ({ ...c, remaining: parsed.credits_remaining, used: c.limit - parsed.credits_remaining }));
          }
          if (parsed.error) {
            setResponse(`⚠️ ${parsed.error}`);
          }
        } catch { /* skip malformed */ }
      }
    }

    setLoading(false);
  }

  const creditColor = credits.remaining >= 3 ? "text-emerald-400" : credits.remaining >= 1 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="bg-bf-surface border border-bf-border rounded-2xl overflow-hidden">
      {/* Header — siempre visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-blue-400" />
          <span className="text-sm font-semibold text-bf-text">Invest Advisor</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-bf-surface-2 ${creditColor}`}>
            {credits.remaining}/{credits.limit} hoy
          </span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-bf-text-4" /> : <ChevronDown size={14} className="text-bf-text-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-bf-border/60 pt-3">

          {/* Chips de tipo */}
          <div className="flex gap-1.5 flex-wrap">
            {QUERY_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedType(t.id);
                  setQuery("");
                  setShowResponse(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  selectedType === t.id
                    ? "bg-blue-950/40 border-blue-700 text-blue-300"
                    : "bg-bf-surface-2 border-bf-border text-bf-text-3 hover:border-bf-border-2"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={selected.placeholder}
              disabled={hasNoCredits || loading}
              className="flex-1 bg-bf-surface-2 border border-bf-border rounded-xl px-3 py-2 text-xs text-bf-text placeholder:text-bf-text-4 outline-none focus:border-blue-700 disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={!query.trim() || loading || hasNoCredits}
              className="px-3 py-2 bg-blue-700/80 hover:bg-blue-700 disabled:opacity-40 rounded-xl transition-colors"
            >
              {loading
                ? <Loader2 size={14} className="text-white animate-spin" />
                : <RefreshCw size={14} className="text-white" />
              }
            </button>
          </div>

          {hasNoCredits && (
            <p className="text-[11px] text-red-400 text-center">
              Usaste tus 5 consultas de hoy. Volvé mañana.
            </p>
          )}

          {/* Respuesta streaming */}
          {showResponse && (
            <div
              ref={responseRef}
              className="bg-bf-surface-2/60 border border-bf-border rounded-xl p-3 max-h-72 overflow-y-auto"
            >
              {response
                ? <MarkdownText text={response} />
                : <div className="flex items-center gap-2 text-xs text-bf-text-3"><Loader2 size={12} className="animate-spin" /> Analizando...</div>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

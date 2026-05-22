"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Loader2, Send, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Credits { used: number; remaining: number; limit: number }

// Tipos que disparan solos (no necesitan input del usuario)
const AUTO_TRIGGER = new Set(["portfolio", "macro"]);

const QUERY_TYPES = [
  {
    id: "portfolio",
    icon: "📊",
    label: "Mi cartera",
    autoQuery: "Analizá mi portafolio actual. Dame un diagnóstico honesto: concentración, balance renta/capital, freedom %, y la acción más importante que debería tomar.",
    inputPlaceholder: null,
  },
  {
    id: "technical",
    icon: "📈",
    label: "Técnico",
    autoQuery: null,
    inputPlaceholder: "¿Qué instrumento? (ej: AL30, GGAL, BTC)",
  },
  {
    id: "fundamental",
    icon: "🏢",
    label: "Fundamental",
    autoQuery: null,
    inputPlaceholder: "¿Qué instrumento? (ej: MELI, YPF, GD35)",
  },
  {
    id: "macro",
    icon: "🌍",
    label: "Macro ARG",
    autoQuery: "Dame un análisis del contexto macro argentino actual: régimen, tipo de cambio, tasa vs inflación, y qué posicionamiento tiene sentido ahora.",
    inputPlaceholder: null,
  },
  {
    id: "scenario",
    icon: "🎯",
    label: "Escenario",
    autoQuery: null,
    inputPlaceholder: "Describí un evento o noticia (ej: sube la tasa de la Fed...)",
  },
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
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("### ") || line.startsWith("## "))
          return <p key={i} className="text-xs font-bold text-bf-text mt-2 first:mt-0">{line.replace(/^#+\s/, "")}</p>;
        if (/^\*\*(.+)\*\*$/.test(line))
          return <p key={i} className="text-xs font-semibold text-bf-text-2">{line.slice(2, -2)}</p>;
        if (line === "---") return <hr key={i} className="border-bf-border my-2" />;
        if (line.startsWith("- "))
          return <p key={i} className="text-xs text-bf-text-2 pl-3 before:content-['·'] before:mr-1.5 before:text-bf-text-3">{line.slice(2)}</p>;
        if (line === "") return <div key={i} className="h-0.5" />;
        return <p key={i} className="text-xs text-bf-text-2 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export function AdvisorCard() {
  const [credits, setCredits] = useState<Credits>({ used: 0, remaining: 5, limit: 5 });
  const [selectedType, setSelectedType] = useState<QueryTypeId>("portfolio");
  const [inputValue, setInputValue] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = QUERY_TYPES.find((t) => t.id === selectedType)!;
  const isAutoType = AUTO_TRIGGER.has(selectedType);
  const hasNoCredits = credits.remaining === 0;
  const canSubmit = !loading && !hasNoCredits && (isAutoType || inputValue.trim().length > 0);

  useEffect(() => {
    authFetch("/advisor/credits").then((r) => r.json()).then(setCredits).catch(() => {});
  }, []);

  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [response]);

  const runQuery = useCallback(async (type: QueryTypeId, userInput: string) => {
    const typeConfig = QUERY_TYPES.find((t) => t.id === type)!;
    const query = AUTO_TRIGGER.has(type) ? typeConfig.autoQuery! : userInput;

    setLoading(true);
    setResponse("");
    setHasResponse(true);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch(`${API_URL}/advisor/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type,
        query,
        ticker: ["technical", "fundamental"].includes(type)
          ? userInput.split(" ")[0].toUpperCase()
          : undefined,
      }),
    });

    if (!res.body) { setLoading(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value, { stream: true }).split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.chunk) { fullText += parsed.chunk; setResponse(fullText); }
          if (parsed.done) setCredits((c) => ({ ...c, remaining: parsed.credits_remaining, used: c.limit - parsed.credits_remaining }));
          if (parsed.error) setResponse(`⚠️ ${parsed.error}`);
        } catch { /* skip */ }
      }
    }
    setLoading(false);
  }, []);

  function handleTypeSelect(id: QueryTypeId) {
    setSelectedType(id);
    setInputValue("");
    setHasResponse(false);
    setResponse("");
    // Para tipos auto, disparar inmediatamente
    if (AUTO_TRIGGER.has(id) && !hasNoCredits) {
      runQuery(id, "");
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;
    runQuery(selectedType, inputValue);
  }

  const creditColor = credits.remaining >= 3 ? "text-emerald-400"
    : credits.remaining >= 1 ? "text-yellow-400"
    : "text-red-400";

  return (
    <div className="bg-bf-surface border border-bf-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-bf-border/60">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-blue-400" />
          <span className="text-sm font-semibold text-bf-text">Invest Advisor</span>
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-bf-surface-2 ${creditColor}`}>
          {credits.remaining}/{credits.limit} consultas hoy
        </span>
      </div>

      <div className="px-4 pt-3 pb-4 space-y-3">
        {/* Tipo de análisis */}
        <div className="flex gap-1.5 flex-wrap">
          {QUERY_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTypeSelect(t.id)}
              disabled={hasNoCredits || loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all disabled:opacity-40 ${
                selectedType === t.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-bf-surface-2 border-bf-border text-bf-text-3 hover:border-bf-border-2 hover:text-bf-text-2"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Input — solo para tipos que lo necesitan */}
        {!isAutoType && (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={selected.inputPlaceholder ?? ""}
              disabled={hasNoCredits || loading}
              className="flex-1 bg-bf-surface-2 border border-bf-border rounded-xl px-3 py-2.5 text-xs text-bf-text placeholder:text-bf-text-4 outline-none focus:border-blue-600 disabled:opacity-50 transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl transition-colors shrink-0"
            >
              {loading
                ? <Loader2 size={14} className="text-white animate-spin" />
                : <Send size={13} className="text-white" />
              }
            </button>
          </div>
        )}

        {/* Loading spinner para tipos auto */}
        {isAutoType && loading && !response && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={13} className="text-blue-400 animate-spin shrink-0" />
            <p className="text-xs text-bf-text-3">Analizando tu portafolio...</p>
          </div>
        )}

        {/* Respuesta */}
        {hasResponse && (
          <div className="space-y-2">
            <div
              ref={responseRef}
              className="bg-bf-surface-2/50 border border-bf-border/60 rounded-xl p-3 max-h-80 overflow-y-auto"
            >
              {response
                ? <MarkdownText text={response} />
                : loading
                  ? <div className="flex items-center gap-2 text-xs text-bf-text-3"><Loader2 size={11} className="animate-spin" /> Generando análisis...</div>
                  : null
              }
            </div>

            {/* Repetir análisis */}
            {!loading && response && (
              <button
                onClick={() => runQuery(selectedType, inputValue)}
                disabled={hasNoCredits}
                className="flex items-center gap-1.5 text-[11px] text-bf-text-4 hover:text-bf-text-3 transition-colors disabled:opacity-40"
              >
                <RotateCcw size={11} />
                Nuevo análisis {!isAutoType && inputValue ? `de ${inputValue.split(" ")[0].toUpperCase()}` : ""}
              </button>
            )}
          </div>
        )}

        {hasNoCredits && (
          <p className="text-[11px] text-red-400 text-center py-1">
            Usaste tus 5 consultas de hoy · Volvé mañana
          </p>
        )}
      </div>
    </div>
  );
}

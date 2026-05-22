"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Loader2, Send, RotateCcw, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Cuestionario por tipo ──────────────────────────────────────────────────────

const QUESTIONNAIRES = {
  portfolio: {
    label: "📊 Analizar mi cartera",
    questions: [
      {
        id: "concern",
        text: "¿Qué te preocupa o querés revisar?",
        options: [
          "Saber si estoy bien diversificado",
          "Entender si genero suficiente renta",
          "Ver si tengo mucho riesgo en pesos",
          "Saber cuánto me falta para la libertad financiera",
          "Qué haría diferente si empezara hoy",
        ],
      },
      {
        id: "horizon",
        text: "¿Cuándo podrías necesitar la plata?",
        options: [
          "Menos de 6 meses (necesito liquidez)",
          "1 a 3 años (mediano plazo)",
          "3 a 10 años (largo plazo)",
          "No la necesito en el corto plazo",
        ],
      },
      {
        id: "goal",
        text: "¿Qué querés que mejore tu portafolio?",
        options: [
          "Que genere más renta mensual en USD",
          "Que esté más dolarizado",
          "Que tenga menos riesgo ARG",
          "Que crezca más en capital",
          "Que sea más simple y fácil de entender",
        ],
      },
    ],
  },
  technical: {
    label: "📈 Análisis técnico",
    questions: [
      {
        id: "instrument",
        text: "¿Qué instrumento querés analizar?",
        inputType: "text" as const,
        placeholder: "Ej: AL30, GGAL, BTC, SPY...",
      },
      {
        id: "horizon",
        text: "¿Cuál es tu horizonte para este instrumento?",
        options: ["Muy corto (días a semanas)", "Corto (1-3 meses)", "Mediano (3-12 meses)", "Largo (+1 año)"],
      },
      {
        id: "intention",
        text: "¿Tenés posición o estás evaluando entrar?",
        options: ["Tengo posición y evalúo si seguir", "Estoy evaluando entrar", "Quiero saber si es buen momento para comprar más", "Evalúo salir"],
      },
    ],
  },
  fundamental: {
    label: "🏢 Análisis fundamental",
    questions: [
      {
        id: "instrument",
        text: "¿Qué instrumento querés analizar?",
        inputType: "text" as const,
        placeholder: "Ej: MELI, YPF, GD35, TLSA...",
      },
      {
        id: "focus",
        text: "¿Qué te interesa saber?",
        options: ["Si está barato o caro hoy", "Riesgo crediticio / solidez del emisor", "Perspectivas a 6-12 meses", "Comparación con alternativas similares"],
      },
    ],
  },
  macro: {
    label: "🌍 Contexto macro ARG",
    questions: [
      {
        id: "decision",
        text: "¿Qué decisión necesitás tomar?",
        options: [
          "¿Conviene estar en pesos o dólares ahora?",
          "¿Es buen momento para comprar CEDEAR/ETF?",
          "¿Conviene alargar duration en pesos (LECAP larga)?",
          "¿Qué pasa con los bonos soberanos?",
          "Solo quiero entender el contexto actual",
        ],
      },
      {
        id: "exposure",
        text: "¿Cuál es tu mayor exposición hoy?",
        options: ["Mayormente en pesos (LECAPs, FCI)", "Mayormente en dólares (bonos, CEDEARs)", "Mixto pesos y dólares", "Cripto / stablecoins"],
      },
    ],
  },
  scenario: {
    label: "🎯 Analizar un escenario",
    questions: [
      {
        id: "event",
        text: "Describí el evento o noticia a analizar",
        inputType: "text" as const,
        placeholder: "Ej: Sube la tasa de la Fed, Argentina entra al FMI, cae el gobierno...",
      },
      {
        id: "position",
        text: "¿Cuáles son tus posiciones más relevantes?",
        inputType: "text" as const,
        placeholder: "Ej: tengo AL30, CEDEARs de tech y IOLCAMA...",
      },
    ],
  },
} as const;

type QueryType = keyof typeof QUESTIONNAIRES;

interface Question {
  id: string;
  text: string;
  options?: readonly string[];
  inputType?: "text";
  placeholder?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## ") || line.startsWith("### "))
          return <p key={i} className="text-sm font-bold text-bf-text mt-3 first:mt-0">{line.replace(/^#+\s/, "")}</p>;
        if (/^\*\*(.+)\*\*$/.test(line))
          return <p key={i} className="text-sm font-semibold text-bf-text-2">{line.slice(2, -2)}</p>;
        const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
        if (boldParts.length > 1)
          return <p key={i} className="text-sm text-bf-text-2 leading-relaxed">{boldParts.map((p, j) =>
            p.startsWith("**") ? <strong key={j} className="font-semibold text-bf-text">{p.slice(2, -2)}</strong> : p
          )}</p>;
        if (line === "---") return <hr key={i} className="border-bf-border my-2" />;
        if (line.startsWith("- "))
          return <p key={i} className="text-sm text-bf-text-2 pl-3 before:content-['·'] before:mr-1.5 before:text-bf-text-3">{line.slice(2)}</p>;
        if (line === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-sm text-bf-text-2 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

interface HistoryItem {
  id: number;
  query_type: string;
  ticker: string | null;
  context_answers: Record<string, string> | null;
  response: string;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  portfolio: "📊", technical: "📈", fundamental: "🏢", macro: "🌍", scenario: "🎯",
};

function HistoryCard({ item, onReopen }: { item: HistoryItem; onReopen: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const label = QUESTIONNAIRES[item.query_type as QueryType]?.label ?? item.query_type;
  const firstAnswer = item.context_answers ? Object.values(item.context_answers)[0] : null;
  const time = item.created_at
    ? new Date(item.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="bg-bf-surface-2/60 border border-bf-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-bf-surface-3/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0">{TYPE_ICONS[item.query_type] ?? "💬"}</span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-bf-text-2 truncate">{label}</p>
            {firstAnswer && <p className="text-[10px] text-bf-text-4 truncate">{firstAnswer}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[10px] text-bf-text-4">{time}</span>
          <span className="text-bf-text-4 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-bf-border/40 pt-2">
          {item.context_answers && Object.entries(item.context_answers).map(([q, a]) => (
            <p key={q} className="text-[11px] text-bf-text-3">
              <span className="text-bf-text-4">{q.replace(/[¿?]/g, "").trim().substring(0, 40)}:</span> {a}
            </p>
          ))}
          <div className="bg-bf-surface border border-bf-border/40 rounded-xl p-3 mt-2">
            <MarkdownText text={item.response} />
          </div>
          <button onClick={onReopen}
            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
            Hacer otra consulta similar →
          </button>
        </div>
      )}
    </div>
  );
}

export function AdvisorFlow() {
  const [credits, setCredits] = useState<{ remaining: number; limit: number }>({ remaining: 5, limit: 5 });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [step, setStep] = useState<"type" | "questions" | "response">("type");
  const [selectedType, setSelectedType] = useState<QueryType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  const refreshHistory = useCallback(() => {
    authFetch("/advisor/history").then((r) => r.json()).then(setHistory).catch(() => {});
  }, []);

  useEffect(() => {
    authFetch("/advisor/credits").then((r) => r.json()).then(setCredits).catch(() => {});
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [response]);

  const questions = useMemo(
    () => (selectedType ? (QUESTIONNAIRES[selectedType].questions as readonly Question[]) : []),
    [selectedType]
  );
  const currentQuestion = questions[currentQ] as Question | undefined;
  const hasNoCredits = credits.remaining === 0;

  function selectType(type: QueryType) {
    setSelectedType(type);
    setAnswers({});
    setCurrentQ(0);
    setInputValue("");
    setStep("questions");
  }

  function answerOption(option: string) {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.text]: option };
    setAnswers(newAnswers);
    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
      setInputValue("");
    } else {
      runQuery(newAnswers);
    }
  }

  function submitInput() {
    if (!inputValue.trim() || !currentQuestion) return;
    answerOption(inputValue.trim());
    setInputValue("");
  }

  const runQuery = useCallback(async (finalAnswers: Record<string, string>) => {
    if (!selectedType) return;
    setStep("response");
    setLoading(true);
    setResponse("");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    // Extraer ticker de las respuestas si aplica
    const tickerAnswer = finalAnswers[questions.find(q => q.id === "instrument")?.text ?? ""] ?? "";
    const ticker = tickerAnswer ? tickerAnswer.split(/[\s,]/)[0].toUpperCase() : undefined;

    const res = await fetch(`${API_URL}/advisor/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        type: selectedType,
        query: "",
        ticker: ticker || undefined,
        context_answers: finalAnswers,
      }),
    });

    if (!res.body) { setLoading(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value, { stream: true }).split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const p = JSON.parse(line.slice(6));
          if (p.chunk) { full += p.chunk; setResponse(full); }
          if (p.done) setCredits((c) => ({ ...c, remaining: p.credits_remaining }));
          if (p.error) setResponse(`⚠️ ${p.error}`);
        } catch { /* skip */ }
      }
    }
    setLoading(false);
    refreshHistory();
  }, [selectedType, questions, refreshHistory]);

  function restart() {
    setStep("type");
    setSelectedType(null);
    setAnswers({});
    setCurrentQ(0);
    setInputValue("");
    setResponse("");
  }

  const creditColor = credits.remaining >= 3 ? "text-emerald-400" : credits.remaining >= 1 ? "text-yellow-400" : "text-red-400";

  // ── STEP 1: Elegir tipo ────────────────────────────────────────────────────

  if (step === "type") {
    return (
      <div className="space-y-5">
        {/* Historial del día */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-bf-text-4 uppercase tracking-widest">Consultas de hoy</p>
            {history.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onReopen={() => item.query_type in QUESTIONNAIRES && selectType(item.query_type as QueryType)}
              />
            ))}
          </div>
        )}

        {/* Nueva consulta */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-bf-text-3">Nueva consulta</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-bf-surface-2 ${creditColor}`}>
              {credits.remaining}/{credits.limit} restantes
            </span>
          </div>

          {hasNoCredits && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
              Usaste tus 5 consultas de hoy · Volvé mañana
            </div>
          )}

          <div className="space-y-2">
            {(Object.entries(QUESTIONNAIRES) as [QueryType, typeof QUESTIONNAIRES[QueryType]][]).map(([type, config]) => (
              <button
                key={type}
                onClick={() => !hasNoCredits && selectType(type)}
                disabled={hasNoCredits}
                className="w-full flex items-center justify-between bg-bf-surface border border-bf-border hover:border-bf-border-2 rounded-2xl px-4 py-3.5 text-left transition-colors disabled:opacity-40"
              >
                <span className="text-sm font-medium text-bf-text">{config.label}</span>
                <ChevronRight size={16} className="text-bf-text-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Cuestionario ───────────────────────────────────────────────────

  if (step === "questions" && currentQuestion) {
    const progress = ((currentQ) / questions.length) * 100;
    return (
      <div className="space-y-5">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-bf-text-4">
            <span>{QUESTIONNAIRES[selectedType!].label}</span>
            <span>{currentQ + 1} / {questions.length}</span>
          </div>
          <div className="h-1 bg-bf-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Pregunta */}
        <div className="bg-bf-surface border border-bf-border rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold text-bf-text">{currentQuestion.text}</p>

          {currentQuestion.inputType === "text" ? (
            <div className="flex gap-2">
              <input
                type="text" autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitInput()}
                placeholder={currentQuestion.placeholder}
                className="flex-1 bg-bf-surface-2 border border-bf-border rounded-xl px-3 py-2.5 text-sm text-bf-text placeholder:text-bf-text-4 outline-none focus:border-blue-600"
              />
              <button onClick={submitInput} disabled={!inputValue.trim()}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl transition-colors">
                <Send size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {currentQuestion.options?.map((opt) => (
                <button key={opt} onClick={() => answerOption(opt)}
                  className="w-full text-left text-sm text-bf-text-2 bg-bf-surface-2 hover:bg-bf-surface-3 border border-bf-border hover:border-blue-700 rounded-xl px-4 py-3 transition-colors">
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={restart} className="text-xs text-bf-text-4 hover:text-bf-text-3 transition-colors">
          ← Cambiar tipo de análisis
        </button>
      </div>
    );
  }

  // ── STEP 3: Respuesta ──────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Contexto respondido */}
      <div className="bg-bf-surface-2/60 border border-bf-border/60 rounded-xl px-3 py-2.5 space-y-1">
        <p className="text-[10px] text-bf-text-4 uppercase tracking-wider">{QUESTIONNAIRES[selectedType!].label}</p>
        {Object.entries(answers).map(([q, a]) => (
          <p key={q} className="text-[11px] text-bf-text-3">
            <span className="text-bf-text-4">{q.split("¿")[1]?.split("?")[0] ?? q.substring(0, 30)}:</span> {a}
          </p>
        ))}
      </div>

      {/* Respuesta streaming */}
      <div ref={responseRef} className="bg-bf-surface border border-bf-border rounded-2xl p-4 min-h-32">
        {loading && !response ? (
          <div className="flex items-center gap-2 text-sm text-bf-text-3 py-4">
            <Loader2 size={14} className="animate-spin text-blue-400" />
            Analizando con tu portafolio real...
          </div>
        ) : response ? (
          <MarkdownText text={response} />
        ) : null}
        {loading && response && (
          <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
        )}
      </div>

      {/* Acciones post-respuesta */}
      {!loading && response && (
        <div className="flex gap-2">
          <button onClick={restart}
            className="flex items-center gap-1.5 text-xs text-bf-text-3 hover:text-bf-text-2 bg-bf-surface-2 border border-bf-border hover:border-bf-border-2 rounded-xl px-3 py-2 transition-colors">
            <RotateCcw size={12} />
            Nueva consulta
          </button>
          <button onClick={() => { setStep("type"); setSelectedType(null); }}
            className="flex items-center gap-1.5 text-xs text-bf-text-3 hover:text-bf-text-2 bg-bf-surface-2 border border-bf-border hover:border-bf-border-2 rounded-xl px-3 py-2 transition-colors">
            Otro tipo de análisis
          </button>
          <span className={`ml-auto text-[11px] ${creditColor} self-center`}>
            {credits.remaining} consultas restantes
          </span>
        </div>
      )}
    </div>
  );
}

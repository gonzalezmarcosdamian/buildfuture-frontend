"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Lock, LogOut, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservador", desc: "Preservo capital, acepto menor rendimiento." },
  { value: "moderate",     label: "Moderado",    desc: "Equilibrio entre rendimiento y riesgo." },
  { value: "aggressive",   label: "Agresivo",    desc: "Máximo crecimiento, acepto volatilidad." },
];

type Section = "personal" | "password" | "risk" | null;

export function ProfileSection() {
  const router = useRouter();
  const [email, setEmail]         = useState("");
  const [fullName, setFullName]   = useState("");
  const [riskProfile, setRiskProfile] = useState<string | null>(null);
  const [open, setOpen]           = useState<Section>(null);

  // personal data form
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  // password form
  const [newPass, setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  // risk form
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [savingRisk, setSavingRisk] = useState(false);
  const [riskMsg, setRiskMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? "");
      const name = (u.user_metadata?.full_name as string) ?? "";
      setFullName(name);
      setNameInput(name);
    });

    authFetch("/profile/").then(async (res) => {
      if (!res.ok) return;
      const d = await res.json();
      setRiskProfile(d.risk_profile ?? null);
      setSelectedRisk(d.risk_profile ?? null);
    }).catch(() => {});
  }, []);

  function toggle(s: Section) {
    setOpen((prev) => (prev === s ? null : s));
    // Reset messages when toggling
    setNameMsg(null);
    setPassMsg(null);
    setRiskMsg(null);
  }

  async function saveName() {
    setSavingName(true);
    setNameMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: nameInput } });
      if (error) { setNameMsg({ ok: false, text: error.message }); return; }
      setFullName(nameInput);
      setNameMsg({ ok: true, text: "Nombre actualizado." });
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword() {
    if (newPass !== confirmPass) { setPassMsg({ ok: false, text: "Las contraseñas no coinciden." }); return; }
    if (newPass.length < 6)      { setPassMsg({ ok: false, text: "Mínimo 6 caracteres." }); return; }
    setSavingPass(true);
    setPassMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) { setPassMsg({ ok: false, text: error.message }); return; }
      setPassMsg({ ok: true, text: "Contraseña actualizada." });
      setNewPass("");
      setConfirmPass("");
    } finally {
      setSavingPass(false);
    }
  }

  async function saveRisk() {
    if (!selectedRisk) return;
    setSavingRisk(true);
    setRiskMsg(null);
    try {
      const res = await authFetch("/profile/", {
        method: "PUT",
        body: JSON.stringify({ risk_profile: selectedRisk }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setRiskMsg({ ok: false, text: b.detail || "Error al guardar." });
        return;
      }
      setRiskProfile(selectedRisk);
      setRiskMsg({ ok: true, text: "Perfil de riesgo actualizado." });
    } finally {
      setSavingRisk(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initial = (fullName || email || "?")[0].toUpperCase();
  const riskLabel = RISK_OPTIONS.find((o) => o.value === riskProfile)?.label;

  return (
    <div className="space-y-3">
      {/* Avatar + email header */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          {fullName && <p className="text-sm font-semibold text-slate-100 truncate">{fullName}</p>}
          <p className="text-xs text-slate-400 truncate">{email}</p>
          {riskLabel && (
            <span className="text-[10px] text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded mt-0.5 inline-block">
              {riskLabel}
            </span>
          )}
        </div>
      </div>

      {/* Datos personales */}
      <AccordionCard
        icon={<User size={15} />}
        label="Datos personales"
        open={open === "personal"}
        onToggle={() => toggle("personal")}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nombre completo</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Tu nombre"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <p className="text-sm text-slate-500 px-1">{email}</p>
          </div>
          <Feedback msg={nameMsg} />
          <ActionButton loading={savingName} onClick={saveName} label="Guardar" />
        </div>
      </AccordionCard>

      {/* Perfil de riesgo */}
      <AccordionCard
        icon={<span className="text-[13px]">🛡</span>}
        label="Perfil de riesgo"
        sublabel={riskLabel}
        open={open === "risk"}
        onToggle={() => toggle("risk")}
      >
        <div className="space-y-2">
          {RISK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedRisk(opt.value)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selectedRisk === opt.value
                  ? "border-blue-600 bg-blue-950/30 text-blue-300"
                  : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600"
              }`}
            >
              <p className="text-xs font-semibold">{opt.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
          <Feedback msg={riskMsg} />
          <ActionButton
            loading={savingRisk}
            onClick={saveRisk}
            disabled={!selectedRisk || selectedRisk === riskProfile}
            label="Guardar perfil"
          />
        </div>
      </AccordionCard>

      {/* Cambiar contraseña */}
      <AccordionCard
        icon={<Lock size={15} />}
        label="Cambiar contraseña"
        open={open === "password"}
        onToggle={() => toggle("password")}
      >
        <div className="space-y-3">
          <PasswordInput
            label="Nueva contraseña"
            value={newPass}
            onChange={setNewPass}
            show={showPass}
            onToggleShow={() => setShowPass(!showPass)}
          />
          <PasswordInput
            label="Confirmar contraseña"
            value={confirmPass}
            onChange={setConfirmPass}
            show={showPass}
          />
          <Feedback msg={passMsg} />
          <ActionButton loading={savingPass} onClick={savePassword} label="Actualizar contraseña" />
        </div>
      </AccordionCard>

      {/* Cerrar sesión */}
      <button
        onClick={signOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-900/50 text-red-400 bg-red-950/20 hover:bg-red-950/40 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {signingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
        {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function AccordionCard({
  icon, label, sublabel, open, onToggle, children,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-slate-400">{icon}</span>
        <span className="flex-1 text-left text-sm font-medium text-slate-200">{label}</span>
        {sublabel && (
          <span className="text-[10px] text-slate-500 mr-1">{sublabel}</span>
        )}
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-800 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
      msg.ok
        ? "text-emerald-400 bg-emerald-950/30 border border-emerald-900"
        : "text-red-400 bg-red-950/30 border border-red-900"
    }`}>
      {msg.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      {msg.text}
    </div>
  );
}

function ActionButton({
  loading, onClick, label, disabled = false,
}: {
  loading: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {loading ? "Guardando..." : label}
    </button>
  );
}

function PasswordInput({
  label, value, onChange, show, onToggleShow,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  show: boolean;
  onToggleShow?: () => void;
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={!onChange}
          autoComplete="new-password"
          placeholder="••••••••"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-10 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
        {onToggleShow && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

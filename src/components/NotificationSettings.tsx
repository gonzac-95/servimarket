// NotificationSettings.tsx — cómo recibe avisos el usuario (navegador + email),
// y PushPrompt: tarjeta para invitar a activar las notificaciones del navegador.
import { useEffect, useState, type CSSProperties } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/theme";
import { disablePush, enablePush, getPushState, type PushState } from "../lib/webpush";
import { toast } from "./mobile/kit";
import { Icon } from "./mobile/Icon";

function Toggle({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <button role="switch" aria-checked={on} disabled={disabled} onClick={() => !disabled && onChange(!on)} style={{
      all: "unset", cursor: disabled ? "not-allowed" : "pointer", width: 44, height: 26, borderRadius: 999, flexShrink: 0,
      background: on ? t.green : t.line, position: "relative", transition: "background .15s", opacity: disabled ? 0.5 : 1,
    }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left .15s" }} />
    </button>
  );
}

const PUSH_HINT: Record<PushState, string> = {
  enabled: "Te avisamos al instante en este dispositivo.",
  disabled: "Recibí un aviso al instante cuando pase algo en tus trabajos.",
  denied: "Las bloqueaste en el navegador. Habilitalas desde la configuración del sitio (el candado junto a la dirección).",
  "ios-install": "En iPhone, primero agregá ServiMarket a tu pantalla de inicio (Compartir → Agregar a inicio) y abrila desde ahí.",
  unsupported: "Este navegador no permite notificaciones.",
};

export function NotificationSettings() {
  const t = useTheme();
  const { user, refreshUser } = useAuth();
  const [push, setPush] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState<boolean>(user?.email_notifications ?? true);

  useEffect(() => { getPushState().then(setPush).catch(() => setPush("unsupported")); }, []);
  useEffect(() => { setEmail(user?.email_notifications ?? true); }, [user?.email_notifications]);

  async function togglePush(next: boolean) {
    if (!user) return;
    setBusy(true);
    try {
      const st = next ? await enablePush(user.id) : await disablePush(user.id);
      setPush(st);
      if (next && st === "enabled") toast("Notificaciones activadas");
      if (next && st === "denied") toast("El navegador bloqueó las notificaciones", "close");
    } catch (e) {
      console.warn(e);
      toast("No se pudieron activar las notificaciones", "close");
    }
    setBusy(false);
  }

  async function toggleEmail(next: boolean) {
    if (!user) return;
    setEmail(next);
    const { error } = await supabase.from("users").update({ email_notifications: next }).eq("id", user.id);
    if (error) { setEmail(!next); toast("No se pudo guardar", "close"); return; }
    refreshUser();
    toast(next ? "Avisos por email activados" : "Avisos por email desactivados");
  }

  const row = (icon: string, title: string, hint: string, control: JSX.Element, last?: boolean) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: last ? "none" : `1px solid ${t.lineSoft}` }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: t.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={16} color={t.ink} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 600, color: t.ink }}>{title}</div>
        <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkMute, marginTop: 2, lineHeight: 1.4 }}>{hint}</div>
      </div>
      {control}
    </div>
  );

  const pushUsable = push === "enabled" || push === "disabled";
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, overflow: "hidden" }}>
      {row("bell", "Notificaciones en este dispositivo", push ? PUSH_HINT[push] : "…",
        <Toggle on={push === "enabled"} disabled={busy || !pushUsable} onChange={togglePush} />)}
      {row("chat", "Avisos por email", user?.email ? `A ${user.email}. Nuevas solicitudes, cotizaciones y cambios en tus trabajos.` : "Nuevas solicitudes, cotizaciones y cambios en tus trabajos.",
        <Toggle on={email} onChange={toggleEmail} />, true)}
    </div>
  );
}

/** Tarjeta para invitar a activar las notificaciones (se oculta si ya están o si se descartó). */
export function PushPrompt({ message, style }: { message: string; style?: CSSProperties }) {
  const t = useTheme();
  const { user } = useAuth();
  const [state, setState] = useState<PushState | null>(null);
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem("sm_push_prompt_dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => { getPushState().then(setState).catch(() => setState("unsupported")); }, []);

  if (hidden || !user || state !== "disabled") return null;

  async function activate() {
    try {
      const st = await enablePush(user!.id);
      setState(st);
      if (st === "enabled") toast("Notificaciones activadas");
    } catch { toast("No se pudieron activar las notificaciones", "close"); }
  }
  function dismiss() {
    setHidden(true);
    try { localStorage.setItem("sm_push_prompt_dismissed", "1"); } catch { /* sin storage */ }
  }

  return (
    <div style={{ background: t.greenSoft, borderRadius: t.radius, padding: 14, display: "flex", alignItems: "center", gap: 12, ...style }}>
      <div style={{ width: 38, height: 38, borderRadius: 999, background: t.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="bell" size={18} color="#fff" />
      </div>
      <div style={{ flex: 1, fontFamily: t.fontBody, fontSize: 13, color: t.greenDeep, lineHeight: 1.45 }}>{message}</div>
      <button onClick={activate} style={{ all: "unset", cursor: "pointer", padding: "8px 14px", borderRadius: 999, background: t.green, color: "#fff", fontFamily: t.fontBody, fontSize: 13, fontWeight: 700 }}>Activar</button>
      <button onClick={dismiss} aria-label="Descartar" style={{ all: "unset", cursor: "pointer", display: "flex", padding: 4 }}>
        <Icon name="close" size={16} color={t.greenDeep} />
      </button>
    </div>
  );
}

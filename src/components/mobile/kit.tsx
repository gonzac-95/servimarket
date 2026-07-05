// kit.tsx — UI primitives del rediseño mobile (portado del handoff)
import { type ReactNode, useEffect, useState, type CSSProperties } from "react";
import { useTheme, shade } from "../../lib/theme";
import { Icon } from "./Icon";

// ── Avatar ──────────────────────────────────────────
export function Avatar({ initials, hue = "#15803D", size = 44, ring, src }: {
  initials?: string; hue?: string; size?: number; ring?: boolean; src?: string | null;
}) {
  const t = useTheme();
  if (src) {
    return <img src={src} alt="" style={{ width: size, height: size, borderRadius: 999, objectFit: "cover", flexShrink: 0,
      boxShadow: ring ? `0 0 0 3px ${t.surface}, 0 0 0 4.5px ${hue}` : "none" }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: `linear-gradient(140deg, ${hue} 0%, ${shade(hue, -18)} 100%)`,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: t.fontBody, fontWeight: 700, fontSize: size * 0.36, letterSpacing: "0.02em",
      boxShadow: ring ? `0 0 0 3px ${t.surface}, 0 0 0 4.5px ${hue}` : "none", flexShrink: 0,
    }}>{initials}</div>
  );
}

// ── Button ──────────────────────────────────────────
type BtnVariant = "primary" | "green" | "secondary" | "outline" | "ghost" | "dark";
type BtnSize = "sm" | "md" | "lg";
export function Button({ children, variant = "primary", size = "md", onClick, full, icon, iconRight, disabled, type = "button" }: {
  children: ReactNode; variant?: BtnVariant; size?: BtnSize; onClick?: () => void; full?: boolean;
  icon?: ReactNode; iconRight?: ReactNode; disabled?: boolean; type?: "button" | "submit";
}) {
  const t = useTheme();
  const sizes = {
    sm: { h: 36, px: 14, fs: 14, gap: 6, r: t.radiusSm },
    md: { h: 48, px: 18, fs: 15, gap: 8, r: t.radiusSm + 2 },
    lg: { h: 56, px: 22, fs: 16, gap: 10, r: t.radius },
  }[size];
  const variants: Record<BtnVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: t.accent, fg: t.accentInk, border: "transparent" },
    green: { bg: t.green, fg: "#fff", border: "transparent" },
    secondary: { bg: t.surfaceAlt, fg: t.ink, border: "transparent" },
    outline: { bg: "transparent", fg: t.ink, border: t.line },
    ghost: { bg: "transparent", fg: t.ink, border: "transparent" },
    dark: { bg: t.surfaceDeep, fg: "#fff", border: "transparent" },
  };
  const v = variants[variant];
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{
        height: sizes.h, padding: `0 ${sizes.px}px`, gap: sizes.gap,
        background: v.bg, color: v.fg, border: `1px solid ${v.border}`,
        borderRadius: sizes.r, fontFamily: t.fontBody, fontWeight: 600, fontSize: sizes.fs,
        letterSpacing: "-0.005em", width: full ? "100%" : undefined,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
        transition: "transform .12s ease, opacity .12s", WebkitTapHighlightColor: "transparent",
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={e => (e.currentTarget.style.transform = "")}
      onMouseLeave={e => (e.currentTarget.style.transform = "")}
    >
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      <span>{children}</span>
      {iconRight && <span style={{ display: "flex" }}>{iconRight}</span>}
    </button>
  );
}

// ── Chip ────────────────────────────────────────────
export function Chip({ children, active, onClick, icon }: { children: ReactNode; active?: boolean; onClick?: () => void; icon?: ReactNode }) {
  const t = useTheme();
  return (
    <button onClick={onClick} style={{
      height: 36, padding: "0 14px",
      background: active ? t.ink : t.surface, color: active ? t.surface : t.ink,
      border: `1px solid ${active ? t.ink : t.line}`, borderRadius: 999,
      fontFamily: t.fontBody, fontWeight: 600, fontSize: 13.5,
      display: "inline-flex", alignItems: "center", gap: 6,
      cursor: "pointer", flexShrink: 0, letterSpacing: "-0.005em", WebkitTapHighlightColor: "transparent",
    }}>{icon}{children}</button>
  );
}

// ── Tag ─────────────────────────────────────────────
type TagTone = "neutral" | "green" | "star" | "dark";
export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: TagTone }) {
  const t = useTheme();
  const tones: Record<TagTone, { bg: string; fg: string }> = {
    neutral: { bg: t.surfaceAlt, fg: t.inkMute },
    green: { bg: t.greenSoft, fg: t.greenDeep },
    star: { bg: "rgba(232,168,43,0.14)", fg: "#9B6B12" },
    dark: { bg: t.ink, fg: t.surface },
  };
  const v = tones[tone];
  return (
    <span style={{
      padding: "4px 10px", background: v.bg, color: v.fg, borderRadius: 999,
      fontFamily: t.fontBody, fontWeight: 600, fontSize: 11.5, letterSpacing: "0.02em",
      textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4, lineHeight: 1.2,
    }}>{children}</span>
  );
}

// ── Rating ──────────────────────────────────────────
export function Rating({ value, count, size = 14, showCount = true, dark }: {
  value: number; count?: number | null; size?: number; showCount?: boolean; dark?: boolean;
}) {
  const t = useTheme();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontFamily: t.fontBody,
      fontWeight: 600, fontSize: size, color: dark ? "#fff" : t.ink, letterSpacing: "-0.01em",
    }}>
      <Icon name="star" size={size + 2} color={t.star} />
      <span>{value.toFixed(1)}</span>
      {showCount && count != null && <span style={{ color: dark ? "rgba(255,255,255,0.6)" : t.inkSoft, fontWeight: 500 }}>({count})</span>}
    </span>
  );
}

// ── Logo ────────────────────────────────────────────
export function Logo({ size = 28, mark = true, text = true, dark }: { size?: number; mark?: boolean; text?: boolean; dark?: boolean }) {
  const t = useTheme();
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {mark && (
        <div style={{
          width: size, height: size, borderRadius: size * 0.25,
          background: `linear-gradient(135deg, ${t.greenBright}, ${t.greenDeep})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 3px 8px rgba(14,92,44,0.25)",
        }}>
          <svg width={size * 0.74} height={size * 0.74} viewBox="0 0 120 120" fill="none">
            <path d="M 22 56 L 60 22 L 98 56 L 98 94 a4 4 0 0 1 -4 4 L 26 98 a4 4 0 0 1 -4 -4 Z" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
            <path d="M 76 50 Q 76 44 70 44 L 52 44 Q 44 44 44 52 Q 44 60 52 62 L 68 64 Q 78 66 78 74 Q 78 82 70 82 L 42 82" fill="none" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {text && (
        <span style={{ fontFamily: t.fontDisplay, fontSize: size * 0.7, fontWeight: 700, color: dark ? "#fff" : t.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>
          Servi<span style={{ color: t.greenBright }}>Market</span>
        </span>
      )}
    </div>
  );
}

// ── ProviderCard ────────────────────────────────────
export interface ProviderCardData {
  initials?: string; avatarHue?: string; name: string; categoryLabel?: string;
  rating: number; reviews: number; jobs?: number; verified?: boolean;
  neighborhood?: string; distanceKm?: number; responseMin?: number; isNew?: boolean;
  avatarUrl?: string | null;
}
export function ProviderCard({ provider, onClick, layout = "list" }: { provider: ProviderCardData; onClick?: () => void; layout?: "list" | "compact" }) {
  const t = useTheme();
  const p = provider;
  if (layout === "compact") {
    return (
      <button onClick={onClick} style={{
        all: "unset", cursor: "pointer", width: 224, flexShrink: 0,
        background: t.surface, borderRadius: t.radius, padding: 14,
        border: `1px solid ${t.lineSoft}`, boxShadow: t.shadow,
        display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={p.initials} hue={p.avatarHue} size={42} src={p.avatarUrl} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 14, color: t.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkMute }}>{p.categoryLabel}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {p.isNew ? <Tag tone="green">Nuevo</Tag> : <Rating value={p.rating} count={p.reviews} />}
          {p.distanceKm != null && <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkSoft }}>{p.distanceKm} km</div>}
        </div>
      </button>
    );
  }
  return (
    <button onClick={onClick} style={{
      all: "unset", cursor: "pointer", display: "block",
      background: t.surface, borderRadius: t.radius, padding: 16,
      border: `1px solid ${t.lineSoft}`, boxShadow: t.shadow, width: "100%", boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Avatar initials={p.initials} hue={p.avatarHue} size={52} src={p.avatarUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 16, color: t.ink, letterSpacing: "-0.01em" }}>{p.name}</div>
            {p.verified && <Icon name="check-circle" size={14} color={t.green} />}
          </div>
          {p.categoryLabel && <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.inkMute, marginTop: 1 }}>{p.categoryLabel}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            {p.isNew ? <Tag tone="green">Nuevo en ServiMarket</Tag> : <>
              <Rating value={p.rating} count={p.reviews} size={13} />
              {p.jobs != null && <><span style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkSoft }}>·</span>
                <span style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.inkMute }}>{p.jobs} trabajos</span></>}
            </>}
          </div>
        </div>
      </div>
      {(p.neighborhood || p.distanceKm != null || p.responseMin != null) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${t.line}` }}>
          <Icon name="pin" size={13} color={t.inkSoft} />
          <span style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.inkMute }}>
            {[p.neighborhood, p.distanceKm != null ? `${p.distanceKm} km` : null].filter(Boolean).join(" · ")}
          </span>
          {p.responseMin != null && (
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: t.fontBody, fontSize: 12.5, color: t.green, fontWeight: 600 }}>
              <Icon name="clock" size={12} color={t.green} /> responde en {p.responseMin}m
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ── SectionHeader ───────────────────────────────────
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 20px", marginBottom: 12 }}>
      <h2 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 700, color: t.ink, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      {action && <button onClick={onAction} style={{ all: "unset", cursor: "pointer", fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 600, color: t.green }}>{action}</button>}
    </div>
  );
}

// ── TopBar ──────────────────────────────────────────
export function TopBar({ title, onBack, right, transparent, dark }: { title?: string; onBack?: () => void; right?: ReactNode; transparent?: boolean; dark?: boolean }) {
  const t = useTheme();
  const ink = dark ? "#fff" : t.ink;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 12px", position: "relative", background: transparent ? "transparent" : t.bg, zIndex: 5 }}>
      {onBack && (
        <button onClick={onBack} style={{
          all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 999,
          background: transparent ? "rgba(255,255,255,0.10)" : t.surface,
          border: `1px solid ${transparent ? "rgba(255,255,255,0.15)" : t.line}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name="arrow-left" size={20} color={ink} /></button>
      )}
      <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 17, color: ink, letterSpacing: "-0.01em", flex: 1, textAlign: "center", marginRight: onBack ? 0 : -40 }}>{title}</div>
      <div style={{ minWidth: 40, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}

// ── BottomNav ───────────────────────────────────────
export function BottomNav({ active, onChange, role = "client" }: { active?: string; onChange: (id: string) => void; role?: "client" | "provider" }) {
  const t = useTheme();
  const tabs = role === "client" ? [
    { id: "home", label: "Inicio", icon: "home", iconActive: "home-fill" },
    { id: "search", label: "Buscar", icon: "search", iconActive: "search" },
    { id: "jobs", label: "Trabajos", icon: "briefcase", iconActive: "briefcase-fill" },
    { id: "profile", label: "Perfil", icon: "user", iconActive: "user-fill" },
  ] : [
    { id: "home", label: "Resumen", icon: "home", iconActive: "home-fill" },
    { id: "inbox", label: "Bandeja", icon: "chat", iconActive: "chat-fill" },
    { id: "jobs", label: "Mis trab.", icon: "briefcase", iconActive: "briefcase-fill" },
    { id: "profile", label: "Perfil", icon: "user", iconActive: "user-fill" },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30, padding: "8px 14px 30px",
      background: t.surface, borderTop: `1px solid ${t.lineSoft}`,
      display: "flex", alignItems: "center", justifyContent: "space-around", gap: 4,
    }}>
      {tabs.map(tab => {
        const on = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            all: "unset", cursor: "pointer", flex: 1, padding: "8px 0",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, WebkitTapHighlightColor: "transparent",
          }}>
            <Icon name={on ? tab.iconActive : tab.icon} size={24} color={on ? t.ink : t.inkSoft} />
            <span style={{ fontFamily: t.fontBody, fontSize: 11, fontWeight: on ? 700 : 500, color: on ? t.ink : t.inkSoft, letterSpacing: "-0.005em" }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Sheet (modal inferior) ──────────────────────────
export function Sheet({ open, onClose, children, height = "auto" }: { open: boolean; onClose: () => void; children: ReactNode; height?: string | number }) {
  const t = useTheme();
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,31,24,0.45)", animation: "fade-in 0.2s ease" }} />
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, background: t.surface,
        borderTopLeftRadius: t.radiusLg, borderTopRightRadius: t.radiusLg, padding: "12px 0 30px",
        height, animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: t.line, margin: "0 auto 16px" }} />
        {children}
      </div>
    </div>
  );
}

// ── Card genérica ───────────────────────────────────
export function Card({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  const t = useTheme();
  return (
    <div onClick={onClick} style={{
      background: t.surface, borderRadius: t.radius, border: `1px solid ${t.lineSoft}`,
      boxShadow: t.shadow, padding: 16, boxSizing: "border-box", ...style,
    }}>{children}</div>
  );
}

// ── Field (input de formulario) ─────────────────────
export function Field({ label, value, onChange, type = "text", right, placeholder, onEnter }: {
  label?: string; value: string; onChange: (v: string) => void; type?: string;
  right?: ReactNode; placeholder?: string; onEnter?: () => void;
}) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "block" }}>
      {label && <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.inkMute, marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" }}>{label}</div>}
      <div style={{
        display: "flex", alignItems: "center", height: 56, padding: "0 14px",
        background: t.surface, borderRadius: t.radiusSm,
        border: `1px solid ${focus ? t.green : t.line}`,
        boxShadow: focus ? `0 0 0 4px ${t.greenSoft}` : "none", transition: "all .15s",
      }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          onKeyDown={e => { if (e.key === "Enter" && onEnter) onEnter(); }}
          style={{ all: "unset", flex: 1, fontFamily: t.fontBody, fontSize: 15, color: t.ink, height: "100%" }}
        />
        {right}
      </div>
    </label>
  );
}

// Botones sociales (logos)
export function GoogleG() {
  return <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.4z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 15.9 5.5 18 9 18z"/><path fill="#FBBC04" d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.9C.3 6.2 0 7.5 0 9s.3 2.8.9 4l3-2.3z"/><path fill="#EA4335" d="M9 3.5c1.3 0 2.5.5 3.4 1.4l2.6-2.6C13.4.9 11.4 0 9 0 5.5 0 2.4 2.1.9 5l3 2.3c.7-2.2 2.7-3.8 5.1-3.8z"/></svg>;
}

// ── Toaster + toast() ───────────────────────────────
export function toast(message: string, icon = "check") {
  window.dispatchEvent(new CustomEvent("sm-toast", { detail: { message, icon } }));
}

interface ToastItem { id: number; message: string; icon: string; }
export function Toaster() {
  const t = useTheme();
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setItems(list => [...list, { id, message: detail.message, icon: detail.icon }]);
      setTimeout(() => setItems(list => list.filter(i => i.id !== id)), 2200);
    };
    window.addEventListener("sm-toast", handler);
    return () => window.removeEventListener("sm-toast", handler);
  }, []);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 104, zIndex: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, pointerEvents: "none" }}>
      {items.map(it => (
        <div key={it.id} style={{
          display: "flex", alignItems: "center", gap: 9, padding: "11px 16px", borderRadius: 999,
          background: t.surfaceDeep, color: "#fff", fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 12px 30px -8px rgba(0,0,0,0.45)", maxWidth: 320, animation: "toast-in .25s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <Icon name={it.icon} size={16} color={t.greenBright} />
          {it.message}
        </div>
      ))}
    </div>
  );
}

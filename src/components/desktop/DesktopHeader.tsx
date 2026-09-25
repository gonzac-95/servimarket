// DesktopHeader.tsx — barra superior de la web en pantallas grandes.
// Reemplaza a la barra de tabs inferior del celular.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../lib/theme";
import { whatsappLink } from "../../lib/support";
import { Avatar, Logo } from "../mobile/kit";
import { Icon } from "../mobile/Icon";

interface NavItem { label: string; to: string; match: (p: string) => boolean; }

const CLIENT_NAV: NavItem[] = [
  { label: "Inicio", to: "/home", match: p => p.startsWith("/home") },
  { label: "Buscar", to: "/search", match: p => p.startsWith("/search") || p.startsWith("/provider/") },
  { label: "Mis trabajos", to: "/dashboard", match: p => p.startsWith("/dashboard") || p.startsWith("/jobs") },
  { label: "Favoritos", to: "/favorites", match: p => p.startsWith("/favorites") },
];
const PROVIDER_NAV: NavItem[] = [
  { label: "Resumen", to: "/provider", match: p => p === "/provider" },
  { label: "Bandeja", to: "/inbox", match: p => p.startsWith("/inbox") },
  { label: "Mis trabajos", to: "/dashboard", match: p => p.startsWith("/dashboard") || p.startsWith("/jobs") },
];
const GUEST_NAV: NavItem[] = [
  { label: "Inicio", to: "/home", match: p => p.startsWith("/home") },
  { label: "Buscar", to: "/search", match: p => p.startsWith("/search") || p.startsWith("/provider/") },
];

export const DESKTOP_HEADER_HEIGHT = 64;

export function DesktopHeader() {
  const t = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, provider } = useAuth();
  const [unread, setUnread] = useState(0);

  const isProvider = user?.role === "provider";
  const nav = !user ? GUEST_NAV : isProvider ? PROVIDER_NAV : CLIENT_NAV;
  const homeRoute = isProvider ? "/provider" : "/home";

  // Punto verde en la campana si hay notificaciones sin leer
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    supabase.from("notifications").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [user, pathname]);

  const link = (item: NavItem) => {
    const on = item.match(pathname);
    return (
      <button key={item.to} onClick={() => navigate(item.to)} style={{
        all: "unset", cursor: "pointer", height: DESKTOP_HEADER_HEIGHT, display: "flex", alignItems: "center",
        position: "relative", fontFamily: t.fontBody, fontSize: 14.5, fontWeight: on ? 700 : 500,
        color: on ? t.ink : t.inkMute, letterSpacing: "-0.005em",
      }}>
        {item.label}
        {on && <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2.5, background: t.ink, borderRadius: 3 }} />}
      </button>
    );
  };

  const iconBtn = { all: "unset" as const, cursor: "pointer", width: 40, height: 40, borderRadius: 999, border: `1px solid ${t.line}`, background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" as const };

  return (
    <header style={{ height: DESKTOP_HEADER_HEIGHT, flexShrink: 0, background: t.surface, borderBottom: `1px solid ${t.lineSoft}`, position: "relative", zIndex: 40 }}>
      <div style={{ maxWidth: 1200, height: "100%", margin: "0 auto", padding: "0 28px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 36 }}>
        <button onClick={() => navigate(homeRoute)} style={{ all: "unset", cursor: "pointer", display: "flex" }} aria-label="Inicio">
          <Logo size={30} />
        </button>

        <nav style={{ display: "flex", gap: 28, flex: 1 }}>
          {nav.map(link)}
          {user?.role === "admin" && link({ label: "Admin", to: "/admin", match: p => p.startsWith("/admin") })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isProvider && provider && !provider.documents_verified && (
            <button onClick={() => navigate("/verificacion")} style={{
              all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 999, background: "rgba(232,168,43,0.12)", color: "#9B6B12",
              fontFamily: t.fontBody, fontSize: 13, fontWeight: 700,
            }}>
              <Icon name="shield" size={15} color="#9B6B12" /> Verificá tu identidad
            </button>
          )}
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" title="Ayuda por WhatsApp" style={{ ...iconBtn, textDecoration: "none" }}>
            <Icon name="phone" size={17} color={t.ink} />
          </a>

          {user ? (
            <>
              <button onClick={() => navigate("/notifications")} style={iconBtn} aria-label="Notificaciones">
                <Icon name="bell" size={18} color={t.ink} />
                {unread > 0 && <span style={{ position: "absolute", top: 8, right: 9, width: 8, height: 8, background: t.green, borderRadius: 999, border: `2px solid ${t.surface}` }} />}
              </button>
              <button onClick={() => navigate("/settings")} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "4px 12px 4px 4px", borderRadius: 999, border: `1px solid ${pathname.startsWith("/settings") ? t.ink : t.line}` }}>
                <Avatar initials={(user.name ?? "U").charAt(0).toUpperCase()} hue={t.green} size={32} src={user.avatar_url} />
                <span style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 600, color: t.ink, maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {(user.name ?? "").split(" ")[0] || "Perfil"}
                </span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/register?role=provider")} style={{ all: "unset", cursor: "pointer", fontFamily: t.fontBody, fontSize: 14, fontWeight: 600, color: t.ink, padding: "0 6px" }}>
                Soy prestador
              </button>
              <button onClick={() => navigate("/login")} style={{ all: "unset", cursor: "pointer", padding: "10px 20px", borderRadius: 999, background: t.ink, fontFamily: t.fontBody, fontSize: 14, fontWeight: 700, color: "#fff" }}>
                Ingresar
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

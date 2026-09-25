import { type CSSProperties, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../lib/theme";
import { useIsDesktop } from "../../lib/useIsDesktop";
import { DesktopHeader } from "../desktop/DesktopHeader";
import { BottomNav } from "./kit";

// Ancho del contenido en escritorio:
// - "wide": listados y paneles (grillas de prestadores, trabajos, chat a dos columnas)
// - "narrow": formularios, perfiles y pantallas de lectura
export type ScreenWidth = "wide" | "narrow";
const MAX_WIDTH: Record<ScreenWidth, number> = { wide: 1200, narrow: 760 };

// Contenedor de cada pantalla.
// - Celular: full-screen (columna de 480px centrada si la ventana es mediana).
// - Escritorio (≥1024px): barra superior + columna central más ancha.
// Las pantallas internas usan position:absolute; inset:0 relativo al contenedor,
// y `var(--sm-top)` como espacio superior (54px en celular por la barra de estado).
export function MobileScreen({ children, width = "wide" }: { children: ReactNode; width?: ScreenWidth }) {
  const t = useTheme();
  const desktop = useIsDesktop();

  if (desktop) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: t.bg }}>
        <DesktopHeader />
        <div style={{ flex: 1, minHeight: 0, display: "flex", justifyContent: "center" }}>
          <div style={{
            position: "relative", width: "100%", maxWidth: MAX_WIDTH[width], height: "100%", overflow: "hidden",
            background: t.bg, ["--sm-top" as string]: "28px", ["--sm-gutter" as string]: "28px",
          } as CSSProperties}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", background: t.surfaceDeep }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: 480, height: "100%", overflow: "hidden", background: t.bg,
        ["--sm-top" as string]: "54px", ["--sm-gutter" as string]: "20px",
      } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

// Barra de tabs inferior conectada a react-router (sólo celular; en escritorio
// la navegación está en la barra superior).
const CLIENT_ROUTES: Record<string, string> = { home: "/home", search: "/search", jobs: "/dashboard", profile: "/settings" };
const PROVIDER_ROUTES: Record<string, string> = { home: "/provider", inbox: "/inbox", jobs: "/dashboard", profile: "/settings" };

export function TabBar({ active, role = "client" }: { active: string; role?: "client" | "provider" }) {
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  if (desktop) return null;
  const routes = role === "provider" ? PROVIDER_ROUTES : CLIENT_ROUTES;
  return <BottomNav active={active} role={role} onChange={(id) => navigate(routes[id] ?? "/home")} />;
}

// Helper para saber el tab activo según la ruta
export function useActiveTab(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/inbox")) return "inbox";
  if (pathname.startsWith("/dashboard")) return "jobs";
  if (pathname.startsWith("/settings")) return "profile";
  return "home";
}

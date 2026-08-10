import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../lib/theme";
import { BottomNav } from "./kit";

// Contenedor full-screen centrado (columna tipo teléfono en desktop, fullscreen en mobile).
// Las pantallas internas usan position:absolute; inset:0 relativo a este contenedor.
export function MobileScreen({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", background: t.surfaceDeep }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 480, height: "100%", overflow: "hidden", background: t.bg }}>
        {children}
      </div>
    </div>
  );
}

// Barra de tabs inferior conectada a react-router.
const CLIENT_ROUTES: Record<string, string> = { home: "/home", search: "/search", jobs: "/dashboard", profile: "/settings" };
const PROVIDER_ROUTES: Record<string, string> = { home: "/provider", inbox: "/inbox", jobs: "/dashboard", profile: "/settings" };

export function TabBar({ active, role = "client" }: { active: string; role?: "client" | "provider" }) {
  const navigate = useNavigate();
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

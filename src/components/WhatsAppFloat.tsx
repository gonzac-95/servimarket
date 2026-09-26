// WhatsAppFloat.tsx — botón flotante de soporte por WhatsApp (sólo web).
// Aparece en las pantallas públicas y en los inicios de cliente/prestador.
// En celular se ubica por encima de la barra de tabs cuando la hay, y no se
// muestra en el perfil del prestador para no confundirse con "Contactar".
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useTheme } from "../lib/theme";
import { useIsDesktop } from "../lib/useIsDesktop";
import { whatsappLink } from "../lib/support";
import { track } from "../lib/analytics";

const SHOW_ON: RegExp[] = [
  /^\/home$/, /^\/search$/, /^\/servicios(\/|$)/, /^\/help$/,
  /^\/privacidad$/, /^\/terminos$/, /^\/eliminar-cuenta$/,
  /^\/dashboard$/, /^\/provider$/,
];
const DESKTOP_ONLY: RegExp[] = [/^\/provider\/[^/]+$/];
const WITH_TABBAR: RegExp[] = [/^\/home$/, /^\/search$/, /^\/servicios(\/|$)/, /^\/dashboard$/, /^\/provider$/];

function ChatIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z" stroke="#fff" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M9.2 8.4c.3-.3.8-.3 1 .1l.7 1.5c.1.3 0 .6-.2.8l-.5.5c.6 1.2 1.6 2.2 2.8 2.8l.5-.5c.2-.2.5-.3.8-.2l1.5.7c.4.2.4.7.1 1-.6.7-1.5 1-2.4.7a7.2 7.2 0 0 1-4.6-4.6c-.3-.9 0-1.8.7-2.4z" fill="#fff" />
    </svg>
  );
}

export default function WhatsAppFloat() {
  const t = useTheme();
  const desktop = useIsDesktop();
  const { pathname } = useLocation();

  if (Capacitor.isNativePlatform()) return null;
  const visible = SHOW_ON.some(r => r.test(pathname)) || (desktop && DESKTOP_ONLY.some(r => r.test(pathname)));
  if (!visible) return null;

  const aboveTabs = !desktop && WITH_TABBAR.some(r => r.test(pathname));
  const bottom = desktop ? 24 : aboveTabs ? 108 : 20;
  // En celular la app es una columna de hasta 480px: el botón queda dentro de ella
  const right = desktop ? 24 : "max(16px, calc((100vw - 480px) / 2 + 16px))";

  return (
    <a
      href={whatsappLink("Hola ServiMarket, tengo una consulta:")}
      target="_blank" rel="noopener noreferrer"
      aria-label="Ayuda por WhatsApp" title="Ayuda por WhatsApp"
      onClick={() => track("whatsapp_support", { source: "float", path: pathname })}
      style={{
        position: "fixed", zIndex: 60, right, bottom: `calc(${bottom}px + env(safe-area-inset-bottom, 0px))`,
        display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
        height: desktop ? 52 : 54, padding: desktop ? "0 20px 0 14px" : 0, width: desktop ? "auto" : 54,
        justifyContent: "center", borderRadius: 999, background: t.green,
        boxShadow: "0 10px 28px -8px rgba(21,128,61,0.55), 0 2px 6px rgba(0,0,0,0.12)",
        fontFamily: t.fontBody, fontSize: 14.5, fontWeight: 700, color: "#fff",
        animation: "fade-in .3s ease",
      }}
    >
      <ChatIcon size={desktop ? 24 : 27} />
      {desktop && <span>¿Necesitás ayuda?</span>}
    </a>
  );
}

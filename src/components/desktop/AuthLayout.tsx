// AuthLayout.tsx — marco de escritorio para login, registro y onboarding.
// En celular no hace nada. En escritorio muestra un panel de marca a la
// izquierda y la pantalla original (columna de 480px) a la derecha.
//
// El `transform` del contenedor derecho hace que el `position: fixed` que usan
// esas pantallas quede anclado a la columna y no a toda la ventana, así no hay
// que reescribirlas.
import { type CSSProperties, type ReactNode } from "react";
import { useTheme } from "../../lib/theme";
import { useIsDesktop } from "../../lib/useIsDesktop";
import { Logo } from "../mobile/kit";
import { Icon } from "../mobile/Icon";

const POINTS = [
  { icon: "shield", title: "Prestadores verificados", body: "Validamos el DNI de cada prestador antes de mostrarlo." },
  { icon: "chat", title: "Todo en un solo lugar", body: "Pedí presupuesto, chateá y coordiná el trabajo desde la web." },
  { icon: "star", title: "Reseñas reales", body: "Sólo califica quien pidió el trabajo y lo confirmó." },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  const t = useTheme();
  const desktop = useIsDesktop();
  if (!desktop) return <>{children}</>;

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", background: t.bg }}>
      {/* panel de marca */}
      <div style={{
        flex: 1, minWidth: 0, position: "relative", overflow: "hidden", color: "#fff",
        background: `linear-gradient(160deg, ${t.greenDeep} 0%, #052E16 100%)`,
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 64px",
      }}>
        <div style={{ position: "absolute", right: -160, top: -120, width: 520, height: 520, borderRadius: 999, background: `radial-gradient(circle, ${t.greenBright}40, transparent 70%)` }} />
        <div style={{ position: "relative" }}><Logo size={34} dark /></div>

        <div style={{ position: "relative", maxWidth: 520 }}>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 48, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Profesionales de confianza<br /><span style={{ color: t.greenBright }}>para tu casa.</span>
          </h1>
          <p style={{ margin: "18px 0 0", fontFamily: t.fontBody, fontSize: 16.5, lineHeight: 1.55, opacity: 0.75 }}>
            Gasistas, electricistas, plomeros y más, en todo el país.
          </p>
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 20 }}>
            {POINTS.map(p => (
              <div key={p.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={p.icon} size={19} color={t.greenBright} />
                </div>
                <div>
                  <div style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontFamily: t.fontBody, fontSize: 13.5, opacity: 0.7, marginTop: 3, lineHeight: 1.45 }}>{p.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", fontFamily: t.fontBody, fontSize: 12.5, opacity: 0.55 }}>
          © {new Date().getFullYear()} ServiMarket
        </div>
      </div>

      {/* pantalla original */}
      <div style={{
        width: 520, flexShrink: 0, position: "relative", transform: "translateZ(0)", overflowY: "auto",
        background: t.bg, borderLeft: `1px solid ${t.lineSoft}`, ["--sm-top" as string]: "40px",
      } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

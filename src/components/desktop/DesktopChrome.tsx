// DesktopChrome.tsx — agrega la barra superior de escritorio a las pantallas
// que no usan MobileScreen (páginas con layout de flujo normal: editar perfil,
// favoritos, legales). En celular no hace nada.
import { type ReactNode } from "react";
import { useIsDesktop } from "../../lib/useIsDesktop";
import { DesktopHeader } from "./DesktopHeader";

export function DesktopChrome({ children }: { children: ReactNode }) {
  const desktop = useIsDesktop();
  if (!desktop) return <>{children}</>;
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column" }}>
      <DesktopHeader />
      {/* transform: los hijos con position fixed/sticky quedan dentro del área de contenido */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative", transform: "translateZ(0)" }}>
        {children}
      </div>
    </div>
  );
}

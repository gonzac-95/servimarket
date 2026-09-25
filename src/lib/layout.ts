// layout.ts — helpers de layout compartidos entre celular y escritorio.
import type { CSSProperties } from "react";

/** Lista en una columna (celular) o grilla de tarjetas (escritorio). */
export function listLayout(desktop: boolean, minCol = 320, gap = 12): CSSProperties {
  return desktop
    ? { display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`, gap: gap + 4, alignContent: "start" }
    : { display: "flex", flexDirection: "column", gap };
}

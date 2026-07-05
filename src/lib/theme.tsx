// theme.tsx — design tokens del rediseño mobile.
// Dos variantes: 'premium' (mono, verde solo como acento — ACTIVO) y 'brand' (verdes cálidos).
// Portado del handoff de Claude Design.
import { createContext, useContext, type ReactNode } from "react";

export interface Theme {
  name: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceDeep: string;
  ink: string;
  inkMute: string;
  inkSoft: string;
  line: string;
  lineSoft: string;
  green: string;
  greenDeep: string;
  greenBright: string;
  greenSoft: string;
  accent: string;
  accentInk: string;
  star: string;
  danger: string;
  fontBody: string;
  fontDisplay: string;
  fontMono: string;
  radius: number;
  radiusSm: number;
  radiusLg: number;
  shadow: string;
  shadowLg: string;
}

export const THEMES: Record<string, Theme> = {
  premium: {
    name: "premium",
    bg: "#FAFAFA",
    surface: "#FFFFFF",
    surfaceAlt: "#F2F2F1",
    surfaceDeep: "#0A0A0A",
    ink: "#0A0A0A",
    inkMute: "#6B6B6B",
    inkSoft: "#A3A3A3",
    line: "#ECECEC",
    lineSoft: "#F3F3F3",
    green: "#15803D",
    greenDeep: "#0E5C2C",
    greenBright: "#16A34A",
    greenSoft: "#EEF7F1",
    accent: "#0A0A0A",
    accentInk: "#FFFFFF",
    star: "#1A1A1A",
    danger: "#C0392B",
    fontBody: '"DM Sans", -apple-system, system-ui, sans-serif',
    fontDisplay: '"DM Sans", -apple-system, system-ui, sans-serif',
    fontMono: '"JetBrains Mono", ui-monospace, monospace',
    radius: 16,
    radiusSm: 10,
    radiusLg: 22,
    shadow: "0 1px 2px rgba(0,0,0,0.03), 0 6px 20px -10px rgba(0,0,0,0.10)",
    shadowLg: "0 24px 60px -24px rgba(0,0,0,0.28)",
  },
  brand: {
    name: "brand",
    bg: "#F6F7F4",
    surface: "#FFFFFF",
    surfaceAlt: "#EFF1EC",
    surfaceDeep: "#0B2417",
    ink: "#0F1F18",
    inkMute: "#5D6B64",
    inkSoft: "#92998F",
    line: "#E4E6E1",
    lineSoft: "#EDEFE9",
    green: "#15803D",
    greenDeep: "#0E5C2C",
    greenBright: "#22C55E",
    greenSoft: "#E8F5EC",
    accent: "#15803D",
    accentInk: "#FFFFFF",
    star: "#E8A82B",
    danger: "#C0392B",
    fontBody: '"DM Sans", -apple-system, system-ui, sans-serif',
    fontDisplay: '"DM Serif Display", "DM Sans", serif',
    fontMono: '"JetBrains Mono", ui-monospace, monospace',
    radius: 18,
    radiusSm: 12,
    radiusLg: 28,
    shadow: "0 1px 2px rgba(15,31,24,0.04), 0 8px 24px -10px rgba(15,31,24,0.10)",
    shadowLg: "0 18px 50px -18px rgba(14,92,44,0.30)",
  },
};

// Tema activo de la app
export const activeTheme = THEMES.premium;

const ThemeContext = createContext<Theme>(activeTheme);

export function ThemeProvider({ children, theme = activeTheme }: { children: ReactNode; theme?: Theme }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// Oscurece/aclara un hex un porcentaje (negativo = más oscuro)
export function shade(hex: string, percent: number): string {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = f >> 16, G = (f >> 8) & 0x00ff, B = f & 0x0000ff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

// Helper de formato de moneda ARS
export const fmtARS = (n: number) => "$" + (n ?? 0).toLocaleString("es-AR");

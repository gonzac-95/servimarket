// useIsDesktop.ts — ¿se está viendo en una pantalla de escritorio?
// En la app nativa (Capacitor) siempre es mobile, aunque sea una tablet.
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export const DESKTOP_QUERY = "(min-width: 1024px)";

function check(): boolean {
  if (typeof window === "undefined" || Capacitor.isNativePlatform()) return false;
  return window.matchMedia(DESKTOP_QUERY).matches;
}

export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(check);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

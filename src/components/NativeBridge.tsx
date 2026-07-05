import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "../lib/supabase";

// Esquema propio de la app para volver desde el OAuth del sistema.
// Debe estar registrado en el AndroidManifest (intent-filter) y en la
// lista de Redirect URLs de Supabase Auth.
export const OAUTH_CALLBACK = "com.servimarket.app://auth-callback";

// Rutas "raíz" donde el botón atrás de Android debe minimizar la app
// en vez de seguir navegando hacia atrás.
const ROOT_PATHS = ["/", "/home", "/provider", "/login", "/onboarding"];

/**
 * Integraciones con el sistema en builds nativas (no hace nada en web):
 * - appUrlOpen: recibe el deep link del login con Google y crea la sesión.
 * - backButton: el botón atrás de Android navega en la app en vez de cerrarla.
 */
export default function NativeBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const urlSub = CapApp.addListener("appUrlOpen", async ({ url }) => {
      if (!url.startsWith(OAUTH_CALLBACK)) return;
      await Browser.close().catch(() => {});
      // Flujo implícito: los tokens vienen en el fragmento (#access_token=...)
      const hash = url.split("#")[1];
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error) navigate("/home", { replace: true });
      }
    });

    const backSub = CapApp.addListener("backButton", ({ canGoBack }) => {
      const path = window.location.pathname;
      if (ROOT_PATHS.includes(path) || !canGoBack) {
        CapApp.minimizeApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      urlSub.then(s => s.remove());
      backSub.then(s => s.remove());
    };
  }, [navigate]);

  return null;
}

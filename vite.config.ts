import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Plugins nativos de Capacitor — no deben procesarse en web dev.
    exclude: ["@capacitor-community/admob", "@capacitor/push-notifications"],
  },
  build: {
    rollupOptions: {
      // En la build web no incluimos los plugins nativos. En build mobile,
      // Vite genera el chunk dinámico y Capacitor resuelve a la lib nativa.
      external: (id) =>
        id === "@capacitor-community/admob" || id === "@capacitor/push-notifications",
    },
  },
});

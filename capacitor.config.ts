import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.servimarket.app",
  appName: "ServiMarket",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    // Para desarrollo con hot-reload contra el dev server local,
    // descomentá la siguiente línea cambiando la IP por la de tu máquina:
    // url: "http://192.168.X.X:5173",
    // cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;

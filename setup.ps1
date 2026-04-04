# src/main.tsx
New-Item -Path "src\main.tsx" -Force | Out-Null
Set-Content -Path "src\main.tsx" -Encoding UTF8 -Value @'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
'@

# src/index.css
New-Item -Path "src\index.css" -Force | Out-Null
Set-Content -Path "src\index.css" -Encoding UTF8 -Value @'
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 243 75% 59%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 243 75% 59%;
    --radius: 0.75rem;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
  }
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
.text-gradient { @apply bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
@keyframes slide-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes fade-in { from { opacity:0; } to { opacity:1; } }
.animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
.animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
'@

# src/lib/supabase.ts
New-Item -Path "src\lib\supabase.ts" -Force | Out-Null
Set-Content -Path "src\lib\supabase.ts" -Encoding UTF8 -Value @'
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) throw new Error("Faltan variables de entorno de Supabase");
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
});
export function getStorageUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
'@

# src/pages/NotFound.tsx
New-Item -Path "src\pages\NotFound.tsx" -Force | Out-Null
Set-Content -Path "src\pages\NotFound.tsx" -Encoding UTF8 -Value @'
import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Pagina no encontrada</h1>
      <p className="text-gray-500 mb-8">La pagina que buscas no existe.</p>
      <Link to="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg">Volver al inicio</Link>
    </div>
  );
}
'@

# tailwind.config.js
New-Item -Path "tailwind.config.js" -Force | Out-Null
Set-Content -Path "tailwind.config.js" -Encoding UTF8 -Value @'
/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
      secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
      destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
      muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
      accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
      card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
    },
    borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
  }},
  plugins: [],
};
'@

# postcss.config.js
New-Item -Path "postcss.config.js" -Force | Out-Null
Set-Content -Path "postcss.config.js" -Encoding UTF8 -Value @'
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
'@

# tsconfig.json
New-Item -Path "tsconfig.json" -Force | Out-Null
Set-Content -Path "tsconfig.json" -Encoding UTF8 -Value @'
{
  "compilerOptions": {
    "target": "ES2020", "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext", "skipLibCheck": true,
    "moduleResolution": "bundler", "allowImportingTsExtensions": true,
    "resolveJsonModule": true, "isolatedModules": true,
    "noEmit": true, "jsx": "react-jsx",
    "strict": true, "noUnusedLocals": false,
    "noUnusedParameters": false, "noFallthroughCasesInSwitch": true,
    "baseUrl": ".", "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
'@

Write-Host "✅ Archivos creados correctamente!" -ForegroundColor Green
```
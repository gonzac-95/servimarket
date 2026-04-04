# Nueva paleta de colores en index.css
Set-Content -Path "src\index.css" -Encoding UTF8 -Value @'
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 99%;
    --foreground: 150 10% 8%;
    --card: 0 0% 100%;
    --card-foreground: 150 10% 8%;
    --primary: 142 72% 29%;
    --primary-foreground: 0 0% 100%;
    --primary-light: 142 72% 96%;
    --secondary: 150 8% 96%;
    --secondary-foreground: 150 10% 20%;
    --muted: 150 8% 95%;
    --muted-foreground: 150 5% 50%;
    --accent: 142 72% 29%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 150 8% 90%;
    --input: 150 8% 90%;
    --ring: 142 72% 29%;
    --radius: 0.75rem;
    --popover: 0 0% 100%;
    --popover-foreground: 150 10% 8%;
    --success: 142 72% 29%;
  }
  * { @apply border-border; }
  body { @apply bg-background text-foreground; font-family: "DM Sans", sans-serif; }
  h1, h2, h3 { font-family: "DM Sans", sans-serif; font-weight: 700; letter-spacing: -0.02em; }
}

.font-display { font-family: "DM Serif Display", serif; }
.text-gradient { background: linear-gradient(135deg, #166534 0%, #16a34a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.bg-gradient-hero { background: linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%); }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
.animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
.animate-float { animation: float 3s ease-in-out infinite; }

.card-hover { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px -8px rgba(22, 101, 52, 0.15); }
'@

# tailwind config actualizado
Set-Content -Path "tailwind.config.js" -Encoding UTF8 -Value @'
/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", light: "hsl(var(--primary-light))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)", xl: "1rem", "2xl": "1.25rem", "3xl": "1.5rem" },
      fontFamily: { sans: ['"DM Sans"', 'sans-serif'], display: ['"DM Serif Display"', 'serif'] },
    },
  },
  plugins: [],
};
'@

# Landing page rediseñada
Set-Content -Path "src\pages\Index.tsx" -Encoding UTF8 -Value @'
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Search, Shield, Star, Zap, MapPin, MessageSquare, CreditCard, ArrowRight, CheckCircle2, Wrench, Plug, Truck, Paintbrush, Key, Hammer, Leaf, Sparkles, Wind, Building } from "lucide-react";

const categories = [
  { name: "Gasista", icon: Wrench, color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
  { name: "Electricista", icon: Plug, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-100" },
  { name: "Plomero", icon: Wrench, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
  { name: "Flete", icon: Truck, color: "text-green-600", bg: "bg-green-50 border-green-100" },
  { name: "Pintor", icon: Paintbrush, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  { name: "Cerrajero", icon: Key, color: "text-gray-600", bg: "bg-gray-50 border-gray-100" },
  { name: "Carpintero", icon: Hammer, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
  { name: "Jardinero", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
  { name: "Limpieza", icon: Sparkles, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-100" },
  { name: "Técnico Aire", icon: Wind, color: "text-sky-600", bg: "bg-sky-50 border-sky-100" },
  { name: "Albañil", icon: Building, color: "text-stone-600", bg: "bg-stone-50 border-stone-100" },
];

const features = [
  { icon: Search, title: "Búsqueda inteligente", desc: "Encontrá profesionales cerca tuyo, filtrados por categoría y calificación." },
  { icon: Shield, title: "Profesionales verificados", desc: "Todos nuestros prestadores pasan por verificación documental." },
  { icon: Star, title: "Calificaciones reales", desc: "Leé opiniones de otros usuarios antes de contratar." },
  { icon: MessageSquare, title: "Chat directo", desc: "Comunicarte directamente con el prestador antes del servicio." },
  { icon: CreditCard, title: "Pagos seguros", desc: "Pagá con MercadoPago. Tu dinero está protegido." },
  { icon: Zap, title: "Respuesta rápida", desc: "Recibí cotizaciones en minutos, no en días." },
];

const stats = [
  { value: "+1.000", label: "Profesionales" },
  { value: "+5.000", label: "Trabajos realizados" },
  { value: "4.8★", label: "Calificación promedio" },
  { value: "24hs", label: "Tiempo de respuesta" },
];

export default function Index() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">ServiMarket</span>
          </div>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2">
                Mi Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">Iniciar sesión</Link>
                <Link to="/register" className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">Comenzar gratis</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-green-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px"}} />
        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              +1000 profesionales disponibles ahora
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up" style={{animationDelay: "100ms"}}>
              El profesional que necesitás,{" "}
              <span className="text-green-300">cuando lo necesitás</span>
            </h1>
            <p className="text-xl text-green-100 mb-10 leading-relaxed animate-slide-up" style={{animationDelay: "200ms"}}>
              Gasistas, electricistas, plomeros y más. Conectamos clientes con prestadores verificados en toda Argentina.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{animationDelay: "300ms"}}>
              <Link to="/search" className="bg-white text-green-900 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-colors shadow-lg">
                <Search className="h-5 w-5" /> Buscar profesionales
              </Link>
              <Link to="/register" className="bg-green-700/50 border border-green-500/50 text-white px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors backdrop-blur-sm">
                Ofrecer mis servicios <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-green-400/10 rounded-full blur-3xl" />
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-green-700 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">¿Qué servicio necesitás?</h2>
            <p className="text-gray-500">Encontrá el profesional ideal para cada tarea</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3">
            {categories.map(({ name, icon: Icon, color, bg }) => (
              <Link key={name} to={`/search?category=${name}`}
                className={`border ${bg} rounded-2xl p-3 flex flex-col items-center gap-2 card-hover cursor-pointer`}>
                <div className={`h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <span className="text-xs font-medium text-center text-gray-700 leading-tight">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">¿Por qué ServiMarket?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Todo lo que necesitás para contratar servicios con confianza</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 bg-white card-hover animate-slide-up" style={{animationDelay: `${i * 80}ms`}}>
                <div className="h-11 w-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-green-950 via-green-900 to-green-800">
        <div className="max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-green-100 text-lg mb-10">Uníte a miles de usuarios que ya confían en ServiMarket</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-green-900 font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-50 transition-colors shadow-lg">
              Crear cuenta gratis <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/search" className="bg-green-700/50 border border-green-500/50 text-white font-semibold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
              <Search className="h-5 w-5" /> Explorar profesionales
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-green-200">
            {["Sin costo de registro", "Pagos 100% seguros", "Profesionales verificados"].map(t => (
              <div key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" />{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center"><Wrench className="h-3.5 w-3.5 text-white" /></div>
            <span className="font-bold text-lg">ServiMarket</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin className="h-4 w-4" /> Argentina 🇦🇷</div>
          <p className="text-sm text-gray-400">© 2024 ServiMarket. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
'@

# Dashboard rediseñado
Set-Content -Path "src\pages\Dashboard.tsx" -Encoding UTF8 -Value @'
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Job } from "../types";
import { Plus, Search, LogOut, Settings, Bell, MapPin, Clock, ChevronRight, Star, Wrench, TrendingUp, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:     { label: "Pendiente",   color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
  accepted:    { label: "Aceptado",    color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400" },
  in_progress: { label: "En progreso", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  completed:   { label: "Completado",  color: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-500" },
  cancelled:   { label: "Cancelado",   color: "bg-gray-50 text-gray-500 border-gray-200",      dot: "bg-gray-400" },
};

function JobCard({ job, isClient }: { job: Job; isClient: boolean }) {
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const other = isClient ? job.providers?.users?.name ?? "Sin asignar" : (job as any).clients?.name ?? "Cliente";
  return (
    <Link to={`/jobs/${job.id}`}>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 card-hover cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-green-100">{job.category}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
              </span>
            </div>
            <p className="font-semibold text-gray-900 truncate">{other}</p>
            <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">{job.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.address}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(job.created_at), { locale: es, addSuffix: true })}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {job.price && <span className="text-sm font-bold text-green-700">${job.price.toLocaleString()}</span>}
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user, provider, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active"|"history">("active");
  const isClient = user?.role === "client";

  useEffect(() => {
    if (!user) return;
    async function load() {
      let q = supabase.from("jobs").select("*, clients:users!jobs_client_id_fkey(*), providers(*, users(*))").order("created_at", { ascending: false });
      if (isClient) q = q.eq("client_id", user!.id);
      else q = q.eq("provider_id", provider?.id ?? "");
      const { data } = await q;
      setJobs(data ?? []);
      setLoading(false);
    }
    load();
  }, [user, provider, isClient]);

  const active = jobs.filter(j => !["completed","cancelled"].includes(j.status));
  const history = jobs.filter(j => ["completed","cancelled"].includes(j.status));
  const displayed = activeTab === "active" ? active : history;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center"><Wrench className="h-3.5 w-3.5 text-white" /></div>
            <span className="font-bold text-lg">ServiMarket</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate("/settings")} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><Settings className="h-5 w-5 text-gray-500" /></button>
            <button onClick={async () => { await signOut(); navigate("/"); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><LogOut className="h-5 w-5 text-gray-500" /></button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-0.5">Bienvenido de nuevo</p>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name} 👋</h1>
        </div>

        {/* Stats for providers */}
        {!isClient && provider && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Briefcase, label: "Activos", value: active.length, color: "text-blue-600", bg: "bg-blue-50" },
              { icon: TrendingUp, label: "Completados", value: history.filter(j=>j.status==="completed").length, color: "text-green-600", bg: "bg-green-50" },
              { icon: Star, label: "Rating", value: provider.rating_avg.toFixed(1), color: "text-amber-600", bg: "bg-amber-50" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
                <div className={`h-9 w-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          {isClient && (
            <button onClick={() => navigate("/jobs/new")} className="flex-1 bg-green-600 text-white rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-sm shadow-green-200">
              <Plus className="h-5 w-5" /> Nueva solicitud
            </button>
          )}
          <button onClick={() => navigate("/search")} className={`${isClient ? "flex-1" : "w-full"} bg-white border border-gray-200 text-gray-700 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors`}>
            <Search className="h-5 w-5" /> Buscar prestadores
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
          {(["active","history"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              {tab === "active" ? `Activos (${active.length})` : `Historial (${history.length})`}
            </button>
          ))}
        </div>

        {/* Jobs */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Briefcase className="h-7 w-7 text-gray-300" /></div>
            <p className="font-semibold text-gray-500">{activeTab === "active" ? "No tenés trabajos activos" : "Sin historial aún"}</p>
            {isClient && activeTab === "active" && (
              <button onClick={() => navigate("/jobs/new")} className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors">
                Crear primera solicitud
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">{displayed.map(j => <JobCard key={j.id} job={j} isClient={isClient} />)}</div>
        )}
      </div>
    </div>
  );
}
'@

Write-Host "✅ Rediseño aplicado!" -ForegroundColor Green
```
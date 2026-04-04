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
          <p className="text-sm text-gray-400">Â© 2024 ServiMarket. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

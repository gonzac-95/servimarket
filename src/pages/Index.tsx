import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Search, Shield, Star, Zap, MapPin, MessageSquare, CreditCard, ArrowRight, CheckCircle2, Wrench, Plug, Truck, Paintbrush, Key, Hammer, Leaf, Sparkles, Wind, Building, ChevronDown, Heart, Utensils, Car, Monitor, Camera, Smartphone } from "lucide-react";

const categories = [
  { name: "Gasista", icon: Wrench, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
  { name: "Electricista", icon: Plug, color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-100" },
  { name: "Plomero", icon: Wrench, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  { name: "Flete", icon: Truck, color: "text-green-500", bg: "bg-green-50", border: "border-green-100" },
  { name: "Pintor", icon: Paintbrush, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
  { name: "Cerrajero", icon: Key, color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-100" },
  { name: "Carpintero", icon: Hammer, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  { name: "Jardinero", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
  { name: "Limpieza", icon: Sparkles, color: "text-cyan-500", bg: "bg-cyan-50", border: "border-cyan-100" },
  { name: "Técnico Aire", icon: Wind, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-100" },
  { name: "Albañil", icon: Building, color: "text-stone-500", bg: "bg-stone-50", border: "border-stone-100" },
  { name: "Mudanzas", icon: Truck, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  { name: "Fumigador", icon: Wind, color: "text-lime-600", bg: "bg-lime-50", border: "border-lime-100" },
  { name: "Soldador", icon: Hammer, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
  { name: "Herrería", icon: Wrench, color: "text-zinc-600", bg: "bg-zinc-50", border: "border-zinc-100" },
  { name: "Electrodomésticos", icon: Zap, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100" },
  { name: "Niñera", icon: Heart, color: "text-pink-500", bg: "bg-pink-50", border: "border-pink-100" },
  { name: "Cuidador", icon: Heart, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
  { name: "Cocinero", icon: Utensils, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { name: "Chofer", icon: Car, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
  { name: "Técnico PC", icon: Monitor, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  { name: "Cámaras", icon: Camera, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100" },
  { name: "Técnico TV", icon: Monitor, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  { name: "Cel y tablets", icon: Smartphone, color: "text-teal-500", bg: "bg-teal-50", border: "border-teal-100" },
  { name: "Arquitecto", icon: Building, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
];

const features = [
  { icon: Search, title: "Búsqueda inteligente", desc: "Encontrá profesionales cerca tuyo, filtrados por categoría y calificación en segundos.", color: "bg-green-50 text-green-600" },
  { icon: Shield, title: "Profesionales verificados", desc: "Todos nuestros prestadores pasan por un proceso de verificación de identidad y documentos.", color: "bg-blue-50 text-blue-600" },
  { icon: Star, title: "Calificaciones reales", desc: "Leé opiniones auténticas de otros usuarios antes de contratar a cualquier profesional.", color: "bg-amber-50 text-amber-600" },
  { icon: MessageSquare, title: "Chat directo", desc: "Comunicate directamente con el prestador antes y durante el servicio en tiempo real.", color: "bg-purple-50 text-purple-600" },
  { icon: CreditCard, title: "Pagos seguros", desc: "Pagá con MercadoPago. Tu dinero está protegido hasta que el trabajo esté terminado.", color: "bg-emerald-50 text-emerald-600" },
  { icon: Zap, title: "Respuesta rápida", desc: "Recibí cotizaciones y confirmaciones en minutos, no en días. Disponible 24/7.", color: "bg-orange-50 text-orange-600" },
];

const stats = [
  { value: "+1.000", label: "Profesionales activos" },
  { value: "+5.000", label: "Trabajos realizados" },
  { value: "4.8", label: "Calificación promedio" },
  { value: "15 min", label: "Tiempo de respuesta" },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">ServiMarket</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#servicios" className="hover:text-gray-900 transition-colors">Servicios</a>
            <a href="#como-funciona" className="hover:text-gray-900 transition-colors">Cómo funciona</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2">
                Mi Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm">
                  Comenzar gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-800" />
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "40px 40px"}} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-36">
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up" style={{animationDelay: "100ms"}}>
              El profesional que necesitás,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-200">
                cuando lo necesitás
              </span>
            </h1>
            <p className="text-xl text-green-100 leading-relaxed mb-10 animate-slide-up" style={{animationDelay: "200ms"}}>
              Gasistas, electricistas, plomeros y más. Conectamos clientes con prestadores verificados de forma rápida, segura y confiable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{animationDelay: "300ms"}}>
              <Link to="/search" className="bg-white text-green-900 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                <Search className="h-5 w-5" /> Buscar profesionales
              </Link>
              <Link to="/register" className="bg-green-700/50 backdrop-blur-sm border border-green-500/40 text-white px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-all">
                Ofrecer mis servicios <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-10 animate-fade-in" style={{animationDelay: "500ms"}}>
              {["Sin costo de registro", "Pagos 100% seguros", "Profesionales verificados"].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />{t}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative flex justify-center pb-8">
          <div className="flex flex-col items-center gap-1 text-green-400 animate-bounce">
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-green-700 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="servicios" className="py-20 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Servicios</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-3">¿Qué servicio necesitás?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Encontrá el profesional ideal para cada tarea del hogar o negocio</p>
          </div>
          <div className="relative">
            <button
              onClick={() => document.getElementById('cat-scroll')!.scrollBy({left: -300, behavior: 'smooth'})}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 h-10 w-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ArrowRight className="h-4 w-4 text-gray-600 rotate-180" />
            </button>
            <div id="cat-scroll" className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {categories.map(({ name, icon: Icon, color, bg, border }) => (
                <Link key={name} to={`/search?category=${name}`}
                  className={`${bg} border ${border} rounded-2xl p-3 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer shrink-0 w-24`}>
                  <div className="h-11 w-11 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <span className="text-xs font-medium text-center text-gray-700 leading-tight">{name}</span>
                </Link>
              ))}
            </div>
            <button
              onClick={() => document.getElementById('cat-scroll')!.scrollBy({left: 300, behavior: 'smooth'})}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 h-10 w-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ArrowRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Proceso</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-3">Cómo funciona</h2>
            <p className="text-gray-500">En 3 simples pasos encontrás al profesional ideal</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-green-200 via-green-400 to-green-200" />
            {[
              { step: "01", icon: Search, title: "Buscá", desc: "Elegí la categoría y encontrá profesionales verificados cerca tuyo." },
              { step: "02", icon: MessageSquare, title: "Contactá", desc: "Enviá tu solicitud, chateá con el prestador y acordá los detalles." },
              { step: "03", icon: Star, title: "Calificá", desc: "Una vez terminado el trabajo, dejá tu reseña y ayudá a la comunidad." },
            ].map((item, i) => (
              <div key={item.step} className="text-center relative" style={{animationDelay: `${i * 150}ms`}}>
                <div className="relative inline-flex mb-6">
                  <div className="h-20 w-20 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-7 w-7 bg-white border-2 border-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600 shadow-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Beneficios</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-3">¿Por qué ServiMarket?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Todo lo que necesitás para contratar servicios con confianza y seguridad</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 animate-slide-up" style={{animationDelay: `${i * 80}ms`}}>
                <div className={`h-12 w-12 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-800" />
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px"}} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-green-100 text-xl mb-10">Uníte gratis y encontrá el profesional ideal en minutos</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-green-900 font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-50 transition-all shadow-xl hover:-translate-y-0.5">
              Crear cuenta gratis <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/search" className="bg-green-700/50 backdrop-blur-sm border border-green-500/40 text-white font-semibold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-700 transition-all">
              <Search className="h-5 w-5" /> Explorar profesionales
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-green-200">
            {["Sin costo de registro", "Pagos 100% seguros", "Soporte en español"].map(t => (
              <div key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" />{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-xl text-white">ServiMarket</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/search" className="hover:text-white transition-colors">Buscar servicios</Link>
              <Link to="/register" className="hover:text-white transition-colors">Registrarse</Link>
              <Link to="/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>Argentina 🇦🇷</span>
              <span className="mx-2">·</span>
              <span>© 2024 ServiMarket</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
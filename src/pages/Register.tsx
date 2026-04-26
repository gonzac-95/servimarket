import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { Loader2, User, Wrench, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" as "client" | "provider" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast({ title: "Contraseña muy corta", description: "Mínimo 8 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name, form.role);
    setLoading(false);
    if (error) toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
    else {
      toast({ title: "¡Cuenta creada!" });
      navigate(form.role === "provider" ? "/onboarding" : "/dashboard");
    }
  }

  async function handleGoogle() {
    setLoadingGoogle(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      toast({ title: "Error al iniciar con Google", variant: "destructive" });
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px"}} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-2xl text-white">ServiMarket</span>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Unite a la comunidad de servicios más grande de Argentina
          </h2>
          <p className="text-green-200 text-lg mb-8">Gratis para clientes. Sin comisiones al registrarte.</p>
          <div className="space-y-4">
            {[
              { title: "Para clientes", desc: "Encontrá profesionales verificados cerca tuyo en segundos" },
              { title: "Para prestadores", desc: "Recibí solicitudes de trabajo y hacé crecer tu negocio" },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 bg-white/10 rounded-2xl p-4">
                <CheckCircle2 className="h-5 w-5 text-green-300 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-green-200 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-green-300 text-sm">© 2024 ServiMarket · Argentina 🇦🇷</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-2xl">ServiMarket</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Crear cuenta gratis</h1>
            <p className="text-gray-500 mt-2">¿Sos cliente o prestador de servicios?</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { value: "client", label: "Soy Cliente", sub: "Busco servicios", Icon: User, emoji: "🏠" },
              { value: "provider", label: "Soy Prestador", sub: "Ofrezco servicios", Icon: Wrench, emoji: "🔧" },
            ] as const).map(({ value, label, sub, emoji }) => (
              <button key={value} type="button" onClick={() => setForm(f => ({...f, role: value}))}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  form.role === value
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}>
                <span className="text-2xl block mb-2">{emoji}</span>
                <div className={`font-semibold text-sm ${form.role === value ? "text-green-700" : "text-gray-900"}`}>{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                {form.role === value && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Seleccionado</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={loadingGoogle}
            className="w-full h-12 flex items-center justify-center gap-3 border-2 border-gray-200 rounded-2xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 mb-5">
            {loadingGoogle ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">O con email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nombre completo</label>
              <input placeholder="Juan Pérez" value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))} required
                className="w-full h-12 border-2 border-gray-200 rounded-2xl px-4 text-sm focus:outline-none focus:border-green-500 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email</label>
              <input type="email" placeholder="tu@email.com" value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))} required
                className="w-full h-12 border-2 border-gray-200 rounded-2xl px-4 text-sm focus:outline-none focus:border-green-500 transition-colors" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Contraseña</label>
              <input type="password" placeholder="Mínimo 8 caracteres" value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))} required minLength={8}
                className="w-full h-12 border-2 border-gray-200 rounded-2xl px-4 text-sm focus:outline-none focus:border-green-500 transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-12 bg-green-600 text-white rounded-2xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-green-200">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear cuenta gratis
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="text-green-600 font-semibold hover:underline">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
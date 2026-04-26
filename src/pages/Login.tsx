import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { Loader2, Wrench } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) toast({ title: "Email o contraseña incorrectos.", variant: "destructive" });
    else navigate(redirect);
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
      {/* Left panel - decorativo */}
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
            Conectamos clientes con los mejores profesionales
          </h2>
          <p className="text-green-200 text-lg">Gasistas, electricistas, plomeros y más. Rápido, seguro y confiable.</p>
          <div className="mt-8 space-y-3">
            {[
              { emoji: "⭐", text: "+1.000 profesionales verificados" },
              { emoji: "🔒", text: "Pagos 100% seguros" },
              { emoji: "⚡", text: "Respuesta en minutos" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-green-100">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-green-300 text-sm">
          © 2024 ServiMarket · Argentina 🇦🇷
        </div>
      </div>

      {/* Right panel - formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Wrench className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-2xl">ServiMarket</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido de nuevo</h1>
            <p className="text-gray-500 mt-2">Ingresá a tu cuenta para continuar</p>
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={loadingGoogle}
            className="w-full h-12 flex items-center justify-center gap-3 border-2 border-gray-200 rounded-2xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 mb-6">
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

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">O con email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email</label>
              <input type="email" placeholder="tu@email.com" value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))} required
                className="w-full h-12 border-2 border-gray-200 rounded-2xl px-4 text-sm focus:outline-none focus:border-green-500 transition-colors" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
              </div>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))} required
                className="w-full h-12 border-2 border-gray-200 rounded-2xl px-4 text-sm focus:outline-none focus:border-green-500 transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-12 bg-green-600 text-white rounded-2xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-green-200 mt-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Ingresar
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="text-green-600 font-semibold hover:underline">Registrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
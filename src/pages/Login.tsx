import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { Loader2 } from "lucide-react";
export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) toast({ title: "Error al iniciar sesión", description: "Email o Contraseña incorrectos.", variant: "destructive" });
    else navigate("/dashboard");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-8">
        <div className="text-center mb-6">
          <Link to="/" className="font-bold text-2xl text-gradient">ServiMarket</Link>
          <p className="text-gray-500 mt-1 text-sm">Ingresá con tu cuenta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium block mb-1">Email</label>
            <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="text-sm font-medium block mb-1">Contraseña</label>
            <input type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <button type="submit" disabled={loading} className="w-full h-10 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Ingresar
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">¿No tenés cuenta? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Registrate gratis</Link></p>
      </div>
    </div>
  );
}

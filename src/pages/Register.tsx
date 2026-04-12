import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { Loader2, User, Wrench } from "lucide-react";
export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" as "client"|"provider" });
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { toast({ title: "Contraseña muy corta", description: "Mí­nimo 8 caracteres.", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name, form.role);
    setLoading(false);
    if (error) toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
    else { toast({ title: "¡Cuenta creada!" }); navigate(form.role === "provider" ? "/settings" : "/dashboard"); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-8">
        <div className="text-center mb-6">
          <Link to="/" className="font-bold text-2xl text-gradient">ServiMarket</Link>
          <p className="text-gray-500 mt-1 text-sm">Elegí­ tu rol y completá tus datos</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([{value:"client",label:"Soy Cliente",sub:"Busco servicios",Icon:User},{value:"provider",label:"Soy Prestador",sub:"Ofrezco servicios",Icon:Wrench}] as const).map(({value,label,sub,Icon}) => (
            <button key={value} type="button" onClick={() => setForm(f => ({...f, role: value}))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${form.role===value?"border-indigo-600 bg-indigo-50":"border-gray-200 hover:border-indigo-300"}`}>
              <Icon className={`h-6 w-6 mb-2 ${form.role===value?"text-indigo-600":"text-gray-400"}`} />
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium block mb-1">Nombre completo</label>
            <input placeholder="Juan Pérez" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="text-sm font-medium block mb-1">Email</label>
            <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="text-sm font-medium block mb-1">Contraseña</label>
            <input type="password" placeholder="Mí­nimo 8 caracteres" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required minLength={8}
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <button type="submit" disabled={loading} className="w-full h-10 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Crear cuenta gratis
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">¿Ya tenés cuenta? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Iniciá sesión</Link></p>
      </div>
    </div>
  );
}

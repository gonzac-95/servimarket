import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/ui/use-toast";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  // Al llegar desde el link del email, Supabase emite un evento
  // PASSWORD_RECOVERY con una sesión temporal que habilita el cambio.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });
    // Fallback: si ya hay sesión activa al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // Damos un margen para que el hash del link procese
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setReady(true);
            else setInvalidLink(true);
          });
        }, 1500);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "La contraseña debe tener al menos 8 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      toast({ title: "No se pudo actualizar la contraseña", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Contraseña actualizada", description: "Ya podés iniciar sesión" });
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-8">
        <div className="text-center mb-6">
          <Link to="/" className="font-bold text-2xl text-gradient">ServiMarket</Link>
        </div>

        {invalidLink ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Link inválido o expirado</h1>
            <p className="text-sm text-gray-500">
              El enlace para restablecer tu contraseña no es válido o ya venció.
              Pedí uno nuevo desde la pantalla de recuperación.
            </p>
            <Link to="/forgot-password"
              className="inline-flex items-center justify-center w-full h-10 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors">
              Pedir nuevo link
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
                <ShieldCheck className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Nueva contraseña</h1>
              <p className="text-gray-500 mt-1 text-sm">Elegí una contraseña nueva para tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Nueva contraseña</label>
                <input type="password" placeholder="Mínimo 8 caracteres" value={password}
                  onChange={e => setPassword(e.target.value)} required disabled={!ready}
                  className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Repetir contraseña</label>
                <input type="password" placeholder="Repetí la contraseña" value={confirm}
                  onChange={e => setConfirm(e.target.value)} required disabled={!ready}
                  className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50" />
              </div>
              <button type="submit" disabled={loading || !ready}
                className="w-full h-10 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {(loading || !ready) && <Loader2 className="h-4 w-4 animate-spin" />}
                {ready ? "Guardar contraseña" : "Validando link..."}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

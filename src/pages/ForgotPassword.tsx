import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      toast({ title: "No se pudo enviar el email", description: error.message, variant: "destructive" });
      return;
    }
    // Mostramos éxito siempre (no revelamos si el email existe o no, por seguridad).
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-8">
        <div className="text-center mb-6">
          <Link to="/" className="font-bold text-2xl text-gradient">ServiMarket</Link>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
              <MailCheck className="h-7 w-7 text-green-600" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Revisá tu correo</h1>
            <p className="text-sm text-gray-500">
              Si <span className="font-medium text-gray-700">{email}</span> tiene una cuenta,
              te enviamos un link para restablecer tu contraseña. Revisá también la carpeta de spam.
            </p>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 w-full h-10 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-lg font-semibold text-gray-900">¿Olvidaste tu contraseña?</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Ingresá tu email y te enviamos un link para crear una nueva.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input type="email" placeholder="tu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-10 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Enviar link de recuperación
              </button>
            </form>

            <Link to="/login"
              className="mt-4 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

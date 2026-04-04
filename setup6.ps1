Set-Content -Path "src\pages\JobCreate.tsx" -Encoding UTF8 -Value @'
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { ArrowLeft, Loader2, Send, MapPin, Calendar, DollarSign, FileText, Tag, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  "Gasista","Electricista","Plomero","Flete","Pintor",
  "Cerrajero","Carpintero","Jardinero","Limpieza","Técnico Aire","Albañil"
];

export default function JobCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [form, setForm] = useState({ category: "", description: "", address: "", scheduledAt: "", price: "" });
  const providerId = searchParams.get("provider");

  useEffect(() => {
    if (providerId) {
      supabase.from("providers").select("*, users(*)").eq("id", providerId).single()
        .then(({ data }) => { setProvider(data); if (data?.categories[0]) setForm(f => ({...f, category: data.categories[0]})); });
    }
  }, [providerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.category || !form.description || !form.address) {
      toast({ title: "Completa todos los campos requeridos", variant: "destructive" }); return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("jobs").insert({
      client_id: user.id, provider_id: providerId ?? null,
      category: form.category, description: form.description,
      address: form.address, scheduled_at: form.scheduledAt || null,
      price: form.price ? parseFloat(form.price) : null, status: "pending"
    }).select().single();
    setLoading(false);
    if (error) { toast({ title: "Error al crear el trabajo", variant: "destructive" }); return; }
    toast({ title: "Solicitud enviada!" });
    navigate(`/jobs/${data.id}`);
  }

  const isValid = form.category && form.description && form.address;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Nueva solicitud</h1>
            <p className="text-xs text-gray-400">Describe el trabajo que necesitas</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Provider banner */}
        {provider && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center font-bold text-green-700">
              {provider.users?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{provider.users?.name}</p>
              <p className="text-xs text-green-600">{provider.categories.join(", ")} · Disponible</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Category */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Tag className="h-4 w-4 text-green-600" /> Categoría de servicio *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({...f, category: c}))}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all border ${
                    form.category === c
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : "bg-gray-50 text-gray-600 border-gray-100 hover:border-green-200 hover:bg-green-50"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <FileText className="h-4 w-4 text-green-600" /> Descripción del trabajo *
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({...f, description: e.target.value}))}
              required
              placeholder="Describe que necesitas con el mayor detalle posible. Por ejemplo: tengo una perdida de agua en el bano, el caño esta debajo del lavabo..."
              className="w-full min-h-[110px] bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all placeholder:text-gray-300"
            />
            <p className="text-xs text-gray-400 mt-2">{form.description.length}/500 caracteres</p>
          </div>

          {/* Address */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <MapPin className="h-4 w-4 text-green-600" /> Dirección del trabajo *
            </label>
            <input
              value={form.address}
              onChange={e => setForm(f => ({...f, address: e.target.value}))}
              required
              placeholder="Calle 123, Barrio, Ciudad"
              className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Date + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
                <Calendar className="h-3.5 w-3.5 text-green-600" /> Fecha (opcional)
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({...f, scheduledAt: e.target.value}))}
                className="w-full h-9 bg-gray-50 border border-gray-100 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
              />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
                <DollarSign className="h-3.5 w-3.5 text-green-600" /> Presupuesto max.
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">$</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({...f, price: e.target.value}))}
                  placeholder="0"
                  className="w-full h-9 bg-gray-50 border border-gray-100 rounded-xl pl-6 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full h-13 bg-green-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-green-200 py-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>

          {!isValid && (
            <p className="text-center text-xs text-gray-400">Completa Categoría, Descripción y Dirección para continuar</p>
          )}
        </form>
      </div>
    </div>
  );
}
'@

Write-Host "✅ Formulario rediseñado!" -ForegroundColor Green
```
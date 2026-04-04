import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/ui/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";
export default function Settings() {
  const { user, provider, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: user?.name??"", phone: user?.phone??"", city: user?.city??"", bio: provider?.bio??"", is_available: provider?.is_available??true, service_radius_km: provider?.service_radius_km??10 });
  async function save() {
    setLoading(true);
    await supabase.from("users").update({ name: form.name, phone: form.phone, city: form.city }).eq("id", user!.id);
    if (provider) await supabase.from("providers").update({ bio: form.bio, is_available: form.is_available, service_radius_km: form.service_radius_km }).eq("id", provider.id);
    await refreshUser();
    setLoading(false);
    toast({ title: "Â¡Cambios guardados!" });
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <span className="font-semibold">Configuración</span>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold">Datos personales</h2>
          {[["Nombre",form.name,"name","text"],["Teléfono",form.phone,"phone","tel"],["Ciudad",form.city,"city","text"]].map(([label,value,key,type]) => (
            <div key={key as string}><label className="text-sm font-medium block mb-1">{label as string}</label>
              <input type={type as string} value={value as string} onChange={e => setForm(f => ({...f, [key as string]: e.target.value}))} className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          ))}
        </div>
        {provider && (
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="font-semibold">Perfil de prestador</h2>
            <div><label className="text-sm font-medium block mb-1">Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="text-sm font-medium block mb-1">Radio de servicio (km)</label>
              <input type="number" value={form.service_radius_km} onChange={e => setForm(f=>({...f,service_radius_km:parseInt(e.target.value)}))} className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div className="flex items-center justify-between">
              <div><div className="font-medium text-sm">Disponible</div><div className="text-xs text-gray-500">Aparecés en bíºsquedas</div></div>
              <button type="button" onClick={() => setForm(f=>({...f,is_available:!f.is_available}))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.is_available?"bg-indigo-600":"bg-gray-200"}`}>
                <span className={`inline-block h-4 w-4 mt-1 transform rounded-full bg-white transition-transform ${form.is_available?"translate-x-6":"translate-x-1"}`} />
              </button>
            </div>
          </div>
        )}
        <button onClick={save} disabled={loading} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar cambios
        </button>
      </div>
    </div>
  );
}

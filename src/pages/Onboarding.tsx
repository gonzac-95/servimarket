import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Wrench, Plug, Truck, Paintbrush, Key, Hammer, Leaf, Sparkles, Wind, Building, Zap, Heart, Utensils, Car, Monitor, Camera, Smartphone } from "lucide-react";

const CATEGORIES = [
  { name: "Gasista", icon: Wrench, color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
  { name: "Electricista", icon: Plug, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
  { name: "Plomero", icon: Wrench, color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  { name: "Flete", icon: Truck, color: "text-green-500", bg: "bg-green-50 border-green-200" },
  { name: "Pintor", icon: Paintbrush, color: "text-purple-500", bg: "bg-purple-50 border-purple-200" },
  { name: "Cerrajero", icon: Key, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
  { name: "Carpintero", icon: Hammer, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  { name: "Jardinero", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
  { name: "Limpieza", icon: Sparkles, color: "text-cyan-500", bg: "bg-cyan-50 border-cyan-200" },
  { name: "Técnico Aire", icon: Wind, color: "text-sky-500", bg: "bg-sky-50 border-sky-200" },
  { name: "Albañil", icon: Building, color: "text-stone-500", bg: "bg-stone-50 border-stone-200" },
  { name: "Mudanzas", icon: Truck, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { name: "Fumigador", icon: Wind, color: "text-lime-600", bg: "bg-lime-50 border-lime-200" },
  { name: "Soldador", icon: Hammer, color: "text-red-500", bg: "bg-red-50 border-red-200" },
  { name: "Herrería", icon: Wrench, color: "text-zinc-600", bg: "bg-zinc-50 border-zinc-200" },
  { name: "Electrodomésticos", icon: Zap, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  { name: "Niñera", icon: Heart, color: "text-pink-500", bg: "bg-pink-50 border-pink-200" },
  { name: "Cuidador", icon: Heart, color: "text-rose-500", bg: "bg-rose-50 border-rose-200" },
  { name: "Cocinero", icon: Utensils, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  { name: "Chofer", icon: Car, color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200" },
  { name: "Técnico PC", icon: Monitor, color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  { name: "Cámaras", icon: Camera, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
  { name: "Técnico TV", icon: Monitor, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  { name: "Cel y tablets", icon: Smartphone, color: "text-teal-500", bg: "bg-teal-50 border-teal-200" },
  { name: "Arquitecto", icon: Building, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
];

const STEPS = [
  { number: 1, title: "¿Qué servicios ofrecés?", subtitle: "Elegí todas las categorías que apliquen" },
  { number: 2, title: "Contá tu experiencia", subtitle: "Una buena descripción genera más confianza" },
  { number: 3, title: "¿Cuánto cobrás?", subtitle: "Agregá tus servicios y precios (podés editarlos después)" },
  { number: 4, title: "¿Dónde trabajás?", subtitle: "Indicá tu radio de acción" },
];

type PriceItem = { service: string; price: string; unit: string };

export default function Onboarding() {
  const { user, provider, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    categories: [] as string[],
    bio: "",
    price_list: [] as PriceItem[],
    service_radius_km: 10,
    city: user?.city ?? "",
  });

  function toggleCategory(cat: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat]
    }));
  }

  function addPrice() {
    setForm(f => ({ ...f, price_list: [...f.price_list, { service: "", price: "", unit: "trabajo" }] }));
  }

  function updatePrice(i: number, key: keyof PriceItem, value: string) {
    setForm(f => ({ ...f, price_list: f.price_list.map((p, idx) => idx === i ? { ...p, [key]: value } : p) }));
  }

  function removePrice(i: number) {
    setForm(f => ({ ...f, price_list: f.price_list.filter((_, idx) => idx !== i) }));
  }

  async function finish() {
    if (!provider) return;
    setLoading(true);
    await supabase.from("providers").update({
      categories: form.categories,
      bio: form.bio,
      price_list: form.price_list.map(p => ({ service: p.service, price: parseFloat(p.price) || 0, unit: p.unit })),
      service_radius_km: form.service_radius_km,
    }).eq("id", provider.id);
    if (form.city) {
      await supabase.from("users").update({ city: form.city }).eq("id", user!.id);
    }
    await refreshUser();
    setLoading(false);
    setStep(5);
  }

  const canNext = () => {
    if (step === 1) return form.categories.length > 0;
    if (step === 2) return form.bio.length >= 20;
    return true;
  };

  // Progress bar
  const progress = ((step - 1) / 4) * 100;

  if (step === 5) return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Perfil listo!</h1>
        <p className="text-gray-500 mb-2">Tu perfil ya es visible para los clientes.</p>
        <p className="text-sm text-gray-400 mb-8">Podés seguir editando tu perfil en cualquier momento desde Configuración.</p>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-green-800 mb-2">Resumen de tu perfil:</p>
          <div className="space-y-1.5 text-sm text-green-700">
            <p>✓ {form.categories.length} categoría{form.categories.length !== 1 ? "s" : ""}: {form.categories.join(", ")}</p>
            <p>✓ Bio completada</p>
            <p>✓ {form.price_list.length} precio{form.price_list.length !== 1 ? "s" : ""} cargado{form.price_list.length !== 1 ? "s" : ""}</p>
            <p>✓ Radio de {form.service_radius_km} km</p>
          </div>
        </div>
        <button onClick={() => navigate("/dashboard")}
          className="w-full h-12 bg-green-600 text-white rounded-2xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
          Ir al dashboard <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const currentStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
                <Wrench className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-lg">ServiMarket</span>
            </div>
            <span className="text-sm text-gray-400">Paso {step} de 4</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-green-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map(s => (
              <div key={s.number} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s.number < step ? "bg-green-600 text-white" :
                s.number === step ? "bg-green-600 text-white ring-4 ring-green-100" :
                "bg-gray-200 text-gray-400"
              }`}>
                {s.number < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.number}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{currentStep.title}</h1>
          <p className="text-gray-500 mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Step 1: Categories */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(({ name, icon: Icon, color, bg }) => (
              <button key={name} type="button" onClick={() => toggleCategory(name)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  form.categories.includes(name)
                    ? "border-green-600 bg-green-50"
                    : `border-transparent ${bg}`
                }`}>
                <Icon className={`h-6 w-6 mb-2 ${form.categories.includes(name) ? "text-green-600" : color}`} />
                <div className="font-medium text-sm text-gray-900">{name}</div>
                {form.categories.includes(name) && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs text-green-600">Seleccionado</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Bio */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Tu descripción profesional</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Ej: Soy electricista matriculado con 10 años de experiencia. Me especializo en instalaciones domiciliarias, tableros eléctricos y certificados de seguridad. Trabajo en toda la zona norte del Gran Buenos Aires."
                className="w-full min-h-[150px] bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">{form.bio.length}/500 caracteres</p>
                {form.bio.length >= 20
                  ? <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Bien!</span>
                  : <span className="text-xs text-amber-500">Mínimo 20 caracteres</span>
                }
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">💡 Consejo</p>
              <p className="text-xs text-amber-700">Los prestadores con una descripción detallada reciben 3x más contactos. Mencioná tu experiencia, especialidad y zona de trabajo.</p>
            </div>
          </div>
        )}

        {/* Step 3: Prices */}
        {step === 3 && (
          <div className="space-y-3">
            {form.price_list.length === 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-sm text-gray-500">Agregá tus servicios y precios para que los clientes sepan qué esperar</p>
              </div>
            )}
            {form.price_list.map((item, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
                <input value={item.service} onChange={e => updatePrice(i, "service", e.target.value)}
                  placeholder="Nombre del servicio (ej: Revisión eléctrica)"
                  className="w-full h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" value={item.price} onChange={e => updatePrice(i, "price", e.target.value)}
                      placeholder="0"
                      className="w-full h-10 bg-gray-50 border border-gray-100 rounded-xl pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <select value={item.unit} onChange={e => updatePrice(i, "unit", e.target.value)}
                    className="h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="trabajo">por trabajo</option>
                    <option value="hora">por hora</option>
                    <option value="visita">por visita</option>
                    <option value="m2">por m²</option>
                    <option value="unidad">por unidad</option>
                  </select>
                  <button onClick={() => removePrice(i)} className="h-10 w-10 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-xl transition-colors">✕</button>
                </div>
              </div>
            ))}
            <button onClick={addPrice}
              className="w-full h-12 border-2 border-dashed border-green-200 text-green-600 rounded-2xl text-sm font-semibold hover:bg-green-50 transition-colors">
              + Agregar servicio
            </button>
            <p className="text-xs text-center text-gray-400">Podés saltear este paso y completarlo después</p>
          </div>
        )}

        {/* Step 4: Location */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Ciudad donde trabajás</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Ej: Buenos Aires, Rosario, Córdoba..."
                  className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Radio de servicio: <span className="text-green-600 font-bold">{form.service_radius_km} km</span>
                </label>
                <input type="range" min={1} max={100} value={form.service_radius_km}
                  onChange={e => setForm(f => ({ ...f, service_radius_km: parseInt(e.target.value) }))}
                  className="w-full accent-green-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-green-800 mb-1">📍 ¿Cómo funciona?</p>
              <p className="text-xs text-green-700">Los clientes que busquen servicios dentro de tu radio van a poder encontrarte. Podés cambiarlo cuando quieras.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 h-12 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="h-5 w-5" /> Atrás
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex-1 h-12 bg-green-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={finish} disabled={loading}
              className="flex-1 h-12 bg-green-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              {loading ? "Guardando..." : "Finalizar"}
            </button>
          )}
        </div>

        {step === 3 && (
          <button onClick={() => setStep(4)} className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Saltear este paso →
          </button>
        )}
      </div>
    </div>
  );
}

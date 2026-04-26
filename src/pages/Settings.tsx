import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase, uploadFile, getStorageUrl } from "../lib/supabase";
import { useToast } from "../components/ui/use-toast";
import {
  ArrowLeft, Loader2, Save, Camera, Plus, Trash2, ChevronDown, ChevronUp,
  Wrench, Star, MapPin, Phone, User, FileText, DollarSign, Image, CheckCircle2, X, Pencil
} from "lucide-react";

const CATEGORIES = [
  "Gasista","Electricista","Plomero","Flete","Pintor",
  "Cerrajero","Carpintero","Jardinero","Limpieza","Tecnico Aire","Albanil"
];

const ZONES = [
  "Centro","Norte","Sur","Este","Oeste","Microcentro","Palermo","Belgrano",
  "Caballito","Flores","Villa Urquiza","San Telmo","Recoleta","Barracas"
];

type PriceItem = { service: string; price: string; unit: string };
type Section = "personal" | "provider" | "prices" | "photos" | "availability";

export default function Settings() {
  const { user, provider, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [openSection, setOpenSection] = useState<Section>("personal");

  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    bio: provider?.bio ?? "",
    cuit_cuil: provider?.cuit_cuil ?? "",
    is_available: provider?.is_available ?? true,
    service_radius_km: provider?.service_radius_km ?? 10,
    categories: provider?.categories ?? [] as string[],
    service_zones: provider?.service_zones ?? [] as string[],
    photos: provider?.photos ?? [] as string[],
    price_list: (provider?.price_list ?? []) as PriceItem[],
  });

  function toggleSection(s: Section) {
    setOpenSection(prev => prev === s ? "personal" : s);
  }

  function toggleCategory(cat: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat]
    }));
  }

  

  function addPriceItem() {
    setForm(f => ({ ...f, price_list: [...f.price_list, { service: "", price: "", unit: "trabajo" }] }));
  }

  function updatePriceItem(i: number, key: keyof PriceItem, value: string) {
    setForm(f => ({ ...f, price_list: f.price_list.map((item, idx) => idx === i ? { ...item, [key]: value } : item) }));
  }

  function removePriceItem(i: number) {
    setForm(f => ({ ...f, price_list: f.price_list.filter((_, idx) => idx !== i) }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    const path = `providers/${user.id}/${Date.now()}_${file.name}`;
    const uploaded = await uploadFile("provider-photos", path, file);
    if (uploaded) {
      const url = getStorageUrl("provider-photos", uploaded);
      setForm(f => ({ ...f, photos: [...f.photos, url] }));
      toast({ title: "Foto subida correctamente" });
    } else {
      toast({ title: "Error al subir la foto", variant: "destructive" });
    }
    setUploadingPhoto(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const path = `${user.id}/avatar.${file.name.split(".").pop()}`;
    const uploaded = await uploadFile("avatars", path, file);
    if (uploaded) {
      const url = getStorageUrl("avatars", uploaded);
      setAvatarUrl(url);
      await supabase.from("users").update({ avatar_url: url }).eq("id", user.id);
      await refreshUser();
      toast({ title: "Foto de perfil actualizada" });
    } else {
      toast({ title: "Error al subir la foto", variant: "destructive" });
    }
    setUploadingAvatar(false);
  }

  function removePhoto(url: string) {
    setForm(f => ({ ...f, photos: f.photos.filter(p => p !== url) }));
  }

  async function save() {
    setLoading(true);
    await supabase.from("users").update({
      name: form.name, phone: form.phone, city: form.city
    }).eq("id", user!.id);

    if (provider) {
      await supabase.from("providers").update({
        bio: form.bio,
        cuit_cuil: form.cuit_cuil,
        is_available: form.is_available,
        service_radius_km: form.service_radius_km,
        categories: form.categories,
        service_zones: form.service_zones,
        photos: form.photos,
        price_list: form.price_list.map(p => ({
          service: p.service,
          price: parseFloat(p.price) || 0,
          unit: p.unit
        })),
      }).eq("id", provider.id);
    }

    await refreshUser();
    setLoading(false);
    toast({ title: "Cambios guardados!" });
  }

  const SectionHeader = ({ id, title, icon: Icon, count }: { id: Section; title: string; icon: any; count?: number }) => (
    <button type="button" onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-5 text-left">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-green-50 rounded-xl flex items-center justify-center">
          <Icon className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <div className="font-semibold text-sm text-gray-900">{title}</div>
          {count !== undefined && <div className="text-xs text-gray-400">{count} item{count !== 1 ? "s" : ""}</div>}
        </div>
      </div>
      {openSection === id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Mi perfil</h1>
            <p className="text-xs text-gray-400">Editá tu informacion</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl bg-green-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {uploadingAvatar ? (
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-green-700">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 h-8 w-8 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-md hover:bg-green-700 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-3">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>

        {/* Completeness indicator for providers */}
        {provider && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-gray-900">Completitud del perfil</span>
              <span className="text-sm font-bold text-green-600">
                {Math.round([
                  form.name, form.phone, form.bio,
                  form.categories.length > 0,
                  form.price_list.length > 0,
                  form.photos.length > 0
                ].filter(Boolean).length / 6 * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full transition-all" style={{
                width: `${Math.round([form.name, form.phone, form.bio, form.categories.length > 0, form.price_list.length > 0, form.photos.length > 0].filter(Boolean).length / 6 * 100)}%`
              }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Nombre", done: !!form.name },
                { label: "Telefono", done: !!form.phone },
                { label: "Bio", done: !!form.bio },
                { label: "Categorias", done: form.categories.length > 0 },
                { label: "Precios", done: form.price_list.length > 0 },
                { label: "Fotos", done: form.photos.length > 0 },
              ].map(item => (
                <div key={item.label} className={`flex items-center gap-1.5 text-xs ${item.done ? "text-green-600" : "text-gray-400"}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${item.done ? "fill-green-100" : ""}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal data */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <SectionHeader id="personal" title="Datos personales" icon={User} />
          {openSection === "personal" && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-50">
              <div className="pt-4 space-y-3">
                {[
                  { label: "Nombre completo", key: "name", placeholder: "Juan Perez", type: "text" },
                  { label: "Telefono", key: "phone", placeholder: "+54 9 11 1234-5678", type: "tel" },
                  { label: "Ciudad", key: "city", placeholder: "Buenos Aires", type: "text" },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                    <input type={type} value={(form as any)[key]} placeholder={placeholder}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Provider profile */}
        {provider && (
          <>
            {/* Bio + Categories */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <SectionHeader id="provider" title="Perfil profesional" icon={FileText} />
              {openSection === "provider" && (
                <div className="px-5 pb-5 border-t border-gray-50 space-y-5 pt-4">
                  {/* Bio */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Descripcion / Bio</label>
                    <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      placeholder="Contá tu experiencia, años de trabajo, especialidades..."
                      className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none" />
                    <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/500</p>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Servicios que ofrezco</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                            form.categories.includes(cat)
                              ? "bg-green-600 text-white border-green-600"
                              : "bg-gray-50 text-gray-600 border-gray-100 hover:border-green-300"
                          }`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Radio de servicio (km)</label>
                      <div className="flex items-center gap-3">
                        <input type="range" min={1} max={100} value={form.service_radius_km}
                          onChange={e => setForm(f => ({ ...f, service_radius_km: parseInt(e.target.value) }))}
                          className="flex-1 accent-green-600" />
                        <span className="text-sm font-bold text-green-700 w-16 text-right">{form.service_radius_km} km</span>
                      </div>
                    </div>
                  {/* CUIT */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">CUIT/CUIL (opcional)</label>
                    <input value={form.cuit_cuil} onChange={e => setForm(f => ({ ...f, cuit_cuil: e.target.value }))}
                      placeholder="20-12345678-9"
                      className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
                  </div>
                </div>
              )}
            </div>

            {/* Price list */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <SectionHeader id="prices" title="Lista de precios" icon={DollarSign} count={form.price_list.length} />
              {openSection === "prices" && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-3">
                  {form.price_list.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Agrega tus servicios y precios</p>
                    </div>
                  )}
                  {form.price_list.map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input value={item.service} onChange={e => updatePriceItem(i, "service", e.target.value)}
                          placeholder="Nombre del servicio"
                          className="flex-1 h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        <button onClick={() => removePriceItem(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input type="number" value={item.price} onChange={e => updatePriceItem(i, "price", e.target.value)}
                            placeholder="0"
                            className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-6 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <select value={item.unit} onChange={e => updatePriceItem(i, "unit", e.target.value)}
                          className="h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="trabajo">por trabajo</option>
                          <option value="hora">por hora</option>
                          <option value="visita">por visita</option>
                          <option value="m2">por m2</option>
                          <option value="unidad">por unidad</option>
                          <option value="mes">por mes</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  <button onClick={addPriceItem}
                    className="w-full h-10 border-2 border-dashed border-green-200 text-green-600 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" /> Agregar servicio
                  </button>
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <SectionHeader id="photos" title="Fotos de trabajos" icon={Image} count={form.photos.length} />
              {openSection === "photos" && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                  <p className="text-xs text-gray-400 mb-4">Subí fotos de trabajos anteriores para generar confianza en los clientes</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {form.photos.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removePhoto(url)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <X className="h-6 w-6 text-white" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-green-200 flex flex-col items-center justify-center gap-1 hover:bg-green-50 transition-colors cursor-pointer">
                      {uploadingPhoto
                        ? <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
                        : <>
                            <Camera className="h-6 w-6 text-green-400" />
                            <span className="text-xs text-green-600 font-medium">Subir foto</span>
                          </>
                      }
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <p className="text-xs text-gray-400">Formatos: JPG, PNG, WEBP. Maximo 5MB por foto.</p>
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <SectionHeader id="availability" title="Disponibilidad" icon={Star} />
              {openSection === "availability" && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-sm text-gray-900">Disponible para trabajos</div>
                      <div className="text-xs text-gray-400 mt-0.5">Cuando esta activo, apareces en las busquedas</div>
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                      className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.is_available ? "bg-green-600" : "bg-gray-200"}`}>
                      <span className={`inline-block h-4 w-4 mt-1 transform rounded-full bg-white transition-transform ${form.is_available ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                  <div className={`mt-3 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${form.is_available ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                    <span className={`w-2 h-2 rounded-full ${form.is_available ? "bg-green-500" : "bg-gray-400"}`} />
                    {form.is_available ? "Estas visible para los clientes" : "No apareces en las busquedas"}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Save button */}
        <button onClick={save} disabled={loading}
          className="w-full h-13 bg-green-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm shadow-green-200 py-4">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

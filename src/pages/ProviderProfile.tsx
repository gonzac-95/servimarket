import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { ArrowLeft, Star, MapPin, CheckCircle2, Loader2, MessageSquare, DollarSign, Clock, Heart } from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";

export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from("providers").select("*, users(*)").eq("id", id).single();
      setProvider(p);
      const { data: r } = await supabase.from("reviews").select("*, clients:users!reviews_client_id_fkey(*)").eq("provider_id", id).order("created_at", { ascending: false }).limit(20);
      setReviews(r ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  );
  if (!provider) return <div className="text-center py-24 text-gray-400">Prestador no encontrado</div>;

  const u = provider.users;
  const initials = u?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0,2);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900">Perfil del prestador</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Profile card */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-green-800 to-green-700 px-6 pt-8 pb-16 relative">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px"}} />
          </div>
          <div className="px-6 pb-6 -mt-10 relative">
            <div className="flex items-end justify-between mb-4">
              <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-green-700">
                {u?.avatar_url ? <img src={u.avatar_url} alt="" className="h-full w-full rounded-xl object-cover" /> : initials}
              </div>
              <div className="flex items-center gap-2">
                {provider.is_available
                  ? <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-green-100 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Disponible</span>
                  : <span className="bg-gray-50 text-gray-400 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-100">No disponible</span>}
                {user && user.role === "client" && (
                  <button onClick={() => toggleFavorite(provider.id)}
                    className={`p-2 rounded-xl border transition-all ${isFavorite(provider.id) ? "bg-red-50 border-red-200 text-red-500" : "bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400"}`}>
                    <Heart className={`h-4 w-4 ${isFavorite(provider.id) ? "fill-red-500" : ""}`} />
                  </button>
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{u?.name}</h1>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {provider.categories.map((c: string) => (
                <span key={c} className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-xl border border-green-100">{c}</span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {provider.reviews_count > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-900">{provider.rating_avg.toFixed(1)}</span>
                  <span>({provider.reviews_count} Reseñas)</span>
                </div>
              )}
              <div className="flex items-center gap-1"><MapPin className="h-4 w-4" />{provider.service_radius_km} km de radio</div>
              {provider.documents_verified && (
                <div className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />Verificado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        {user?.role === "client" && (
          <button onClick={() => navigate(`/jobs/new?provider=${id}`)}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-sm shadow-green-200">
            <MessageSquare className="h-5 w-5" />
            Contratar a {u?.name?.split(" ")[0]}
          </button>
        )}

        {/* Bio */}
        {provider.bio && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-2">Sobre mí</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{provider.bio}</p>
          </div>
        )}

        {/* Galería de fotos */}
        {provider.photos?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📷</span> Trabajos realizados
              <span className="text-xs font-normal text-gray-400 ml-1">({provider.photos.length} fotos)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {provider.photos.map((photo: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer group relative"
                  onClick={() => setSelectedPhoto(photo)}>
                  <img src={photo} alt={`Trabajo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <div className="relative max-w-2xl w-full">
              <img src={selectedPhoto} alt="Foto ampliada" className="w-full rounded-2xl object-contain max-h-[80vh]" />
              <button onClick={() => setSelectedPhoto(null)}
                className="absolute -top-4 -right-4 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors">
                <span className="text-gray-900 font-bold text-lg">✕</span>
              </button>
            </div>
          </div>
        )}

        {/* Galería de fotos */}
        {provider.photos?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📷</span> Trabajos realizados
              <span className="text-xs font-normal text-gray-400 ml-1">({provider.photos.length} fotos)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {provider.photos.map((photo: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer group relative"
                  onClick={() => setSelectedPhoto(photo)}>
                  <img src={photo} alt={`Trabajo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <div className="relative max-w-2xl w-full">
              <img src={selectedPhoto} alt="Foto ampliada" className="w-full rounded-2xl object-contain max-h-[80vh]" />
              <button onClick={() => setSelectedPhoto(null)}
                className="absolute -top-4 -right-4 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors">
                <span className="text-gray-900 font-bold text-lg">✕</span>
              </button>
            </div>
          </div>
        )}

        {/* Prices */}
        {provider.price_list?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />Lista de precios
            </h2>
            <div className="space-y-1">
              {provider.price_list.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{item.service}</span>
                  <span className={`text-sm font-bold ${item.price === 0 ? "text-gray-400" : "text-green-700"}`}>
                    {item.price === 0 ? "A presupuestar" : `$${item.price.toLocaleString()} / ${item.unit}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            Reseñas {provider.reviews_count > 0 && <span className="text-gray-400 font-normal">({provider.reviews_count})</span>}
          </h2>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin Reseñas todavía</p>
            </div>
          ) : (
            <div className="space-y-5">
              {reviews.map((r: any) => (
                <div key={r.id} className="border-b border-gray-50 last:border-0 pb-5 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-7 w-7 bg-green-100 rounded-lg flex items-center justify-center text-xs font-bold text-green-700">
                          {r.clients?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm text-gray-900">{r.clients?.name}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i<=r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{r.comment}</p>}
                  {r.reply && (
                    <div className="mt-3 pl-3 border-l-2 border-green-200 bg-green-50/50 rounded-r-xl py-2 pr-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">Respuesta del prestador</p>
                      <p className="text-sm text-gray-600">{r.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

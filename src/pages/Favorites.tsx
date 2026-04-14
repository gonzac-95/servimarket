import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useFavorites } from "../hooks/useFavorites";
import { ArrowLeft, Heart, Star, MapPin, CheckCircle2, Loader2 } from "lucide-react";

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user || favorites.length === 0) { setLoading(false); return; }
      const { data } = await supabase
        .from("providers")
        .select("*, users(*)")
        .in("id", favorites);
      setProviders(data ?? []);
      setLoading(false);
    }
    load();
  }, [user, favorites]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Mis favoritos</h1>
            <p className="text-xs text-gray-400">{favorites.length} prestador{favorites.length !== 1 ? "es" : ""} guardado{favorites.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-green-600" /></div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="h-7 w-7 text-red-300" />
            </div>
            <p className="font-semibold text-gray-500">No tenés favoritos aún</p>
            <p className="text-sm text-gray-400 mt-1">Guardá prestadores de confianza para contratarlos fácil</p>
            <button onClick={() => navigate("/search")} className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors">
              Buscar prestadores
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <Link to={`/provider/${p.id}`} className="h-14 w-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-xl font-bold text-green-700 shrink-0">
                    {p.users?.name?.charAt(0).toUpperCase()}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/provider/${p.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-green-700 transition-colors">{p.users?.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.categories.slice(0,2).map((c: string) => (
                            <span key={c} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-lg border border-green-100">{c}</span>
                          ))}
                        </div>
                      </Link>
                      <button onClick={() => toggleFavorite(p.id)}
                        className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors shrink-0">
                        <Heart className={`h-4 w-4 ${isFavorite(p.id) ? "fill-red-500" : ""}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {p.reviews_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {p.rating_avg.toFixed(1)} ({p.reviews_count})
                        </span>
                      )}
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Radio {p.service_radius_km} km</span>
                      {p.documents_verified && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" />Verificado</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => navigate(`/jobs/new?provider=${p.id}`)}
                  className="w-full mt-4 h-10 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                  Contratar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
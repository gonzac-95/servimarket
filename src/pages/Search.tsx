import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Provider } from "../types";
import { Search as SearchIcon, Star, MapPin, ArrowLeft, Loader2, CheckCircle2, Wrench, Plug, Truck, Paintbrush, Key, Hammer, Leaf, Sparkles, Wind, Building, SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = [
  { name: "Gasista", icon: Wrench, color: "text-orange-500", bg: "bg-orange-50" },
  { name: "Electricista", icon: Plug, color: "text-yellow-500", bg: "bg-yellow-50" },
  { name: "Plomero", icon: Wrench, color: "text-blue-500", bg: "bg-blue-50" },
  { name: "Flete", icon: Truck, color: "text-green-500", bg: "bg-green-50" },
  { name: "Pintor", icon: Paintbrush, color: "text-purple-500", bg: "bg-purple-50" },
  { name: "Cerrajero", icon: Key, color: "text-gray-500", bg: "bg-gray-50" },
  { name: "Carpintero", icon: Hammer, color: "text-amber-600", bg: "bg-amber-50" },
  { name: "Jardinero", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50" },
  { name: "Limpieza", icon: Sparkles, color: "text-cyan-500", bg: "bg-cyan-50" },
  { name: "Técnico Aire", icon: Wind, color: "text-sky-500", bg: "bg-sky-50" },
  { name: "Albañil", icon: Building, color: "text-stone-500", bg: "bg-stone-50" },
];

function ProviderCard({ provider }: { provider: Provider }) {
  const cat = CATEGORIES.find(c => provider.categories.includes(c.name));
  const Icon = cat?.icon ?? Wrench;
  return (
    <Link to={`/provider/${provider.id}`}>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 card-hover cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0 text-xl font-bold text-green-700">
            {provider.users?.avatar_url
              ? <img src={provider.users.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover" />
              : provider.users?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{provider.users?.name ?? "Prestador"}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {provider.categories.slice(0,2).map(c => {
                    const cc = CATEGORIES.find(x => x.name === c);
                    return <span key={c} className={`text-xs font-medium px-2 py-0.5 rounded-lg ${cc?.bg ?? "bg-gray-50"} ${cc?.color ?? "text-gray-500"}`}>{c}</span>;
                  })}
                </div>
              </div>
              {provider.reviews_count > 0 && (
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold">{provider.rating_avg.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-gray-400">({provider.reviews_count})</span>
                </div>
              )}
            </div>
            {provider.bio && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{provider.bio}</p>}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="h-3 w-3" /> Radio {provider.service_radius_km} km
              </div>
              <div className="flex items-center gap-2">
                {provider.documents_verified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verificado
                  </span>
                )}
                <span className={`text-xs font-medium ${provider.is_available ? "text-green-600" : "text-gray-400"}`}>
                  {provider.is_available ? "● Disponible" : "â—‹ No disponible"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") ?? "",
    minRating: "0",
    onlyAvailable: false,
    onlyVerified: false,
  });

  const search = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("providers").select("*, users(*)", { count: "exact" })
      .eq("is_available", true).order("rating_avg", { ascending: false }).limit(30);
    if (filters.category) q = q.contains("categories", [filters.category]);
    if (parseFloat(filters.minRating) > 0) q = q.gte("rating_avg", parseFloat(filters.minRating));
    if (filters.onlyVerified) q = q.eq("documents_verified", true);
    const { data, count } = await q;
    setProviders((data as Provider[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [filters]);

  useEffect(() => { search(); }, [search]);

  const activeFilters = [filters.onlyVerified, filters.onlyAvailable, parseFloat(filters.minRating) > 0].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3 h-16">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full h-10 bg-gray-100 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
              placeholder="Buscar servicio..."
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 rounded-xl transition-colors ${showFilters ? "bg-green-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>
            <SlidersHorizontal className="h-5 w-5" />
            {activeFilters > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 max-w-2xl mx-auto">
            <div className="flex flex-wrap gap-2">
              <select value={filters.minRating} onChange={e => setFilters(f => ({...f, minRating: e.target.value}))}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="0">Cualquier calificacion</option>
                <option value="3">3+ estrellas</option>
                <option value="4">4+ estrellas</option>
                <option value="4.5">4.5+ estrellas</option>
              </select>
              <button onClick={() => setFilters(f => ({...f, onlyVerified: !f.onlyVerified}))}
                className={`h-9 px-4 rounded-xl text-sm font-medium border transition-colors ${filters.onlyVerified ? "bg-green-600 text-white border-green-600" : "border-gray-200 hover:border-green-300"}`}>
                Verificados
              </button>
              {activeFilters > 0 && (
                <button onClick={() => setFilters({category: filters.category, minRating: "0", onlyAvailable: false, onlyVerified: false})}
                  className="h-9 px-3 rounded-xl text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                  <X className="h-4 w-4" /> Limpiar
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-5">
          <button onClick={() => setFilters(f => ({...f, category: ""}))}
            className={`shrink-0 h-9 px-4 rounded-xl text-sm font-medium transition-colors ${!filters.category ? "bg-green-600 text-white" : "bg-white border border-gray-200 hover:border-green-300 text-gray-600"}`}>
            Todos
          </button>
          {CATEGORIES.map(({ name, icon: Icon, color, bg }) => (
            <button key={name} onClick={() => setFilters(f => ({...f, category: f.category === name ? "" : name}))}
              className={`shrink-0 h-9 pl-3 pr-4 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${filters.category === name ? "bg-green-600 text-white" : "bg-white border border-gray-200 hover:border-green-300 text-gray-600"}`}>
              <Icon className={`h-3.5 w-3.5 ${filters.category === name ? "text-white" : color}`} />
              {name}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-400 mb-4">
          {loading ? "Buscando..." : `${total} prestador${total !== 1 ? "es" : ""} encontrado${total !== 1 ? "s" : ""}`}
        </p>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-green-600" /></div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="h-7 w-7 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No encontramos prestadores</p>
            <p className="text-sm text-gray-400 mt-1">Probá cambiando los filtros</p>
          </div>
        ) : (
          <div className="space-y-3">{providers.map(p => <ProviderCard key={p.id} provider={p} />)}</div>
        )}
      </div>
    </div>
  );
}

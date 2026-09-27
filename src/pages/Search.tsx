import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import type { Provider } from "../types";
import { useTheme } from "../lib/theme";
import { CATEGORIES, categoryById, mapProvider } from "../lib/categories";
import { Chip, ProviderCard } from "../components/mobile/kit";
import { Icon, CategoryIcon } from "../components/mobile/Icon";
import { MobileScreen, TabBar } from "../components/mobile/MobileScreen";
import { useIsDesktop } from "../lib/useIsDesktop";
import { listLayout } from "../lib/layout";
import { SEO_CATEGORIES, serviceDescription, serviceTitle, slugify, unslugify, useSeo } from "../lib/seo";
import { track } from "../lib/analytics";
import { providerSelect } from "../lib/providerColumns";

// Sin props: /search (buscador). Con presetCategory: páginas por rubro
// /servicios/:rubro y /servicios/:rubro/:ciudad (indexables, con título propio).
export default function Search({ presetCategory, citySlug }: { presetCategory?: string; citySlug?: string } = {}) {
  const t = useTheme();
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const seoMode = !!presetCategory;
  const [cat, setCat] = useState<string | null>(presetCategory ?? searchParams.get("category"));
  const [minRating, setMinRating] = useState<"all" | "4" | "4.5">("all");
  const [sort, setSort] = useState<"rating" | "reviews">("rating");
  const [showFilters, setShowFilters] = useState(false);
  const userCity = user?.city?.trim() || null;
  // Ciudad activa del filtro: null = todo el país. Por defecto, la del usuario.
  const [zoneCity, setZoneCity] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);

  const [citiesLoaded, setCitiesLoaded] = useState(false);

  // En el buscador, la zona arranca en la ciudad del usuario. En las páginas
  // por rubro manda la URL (sin ciudad = todo el país).
  useEffect(() => { if (userCity && !seoMode) setZoneCity(userCity); }, [userCity, seoMode]);
  useEffect(() => { if (presetCategory) setCat(presetCategory); }, [presetCategory]);

  // Ciudades donde hay prestadores disponibles (para buscar en otra ciudad)
  useEffect(() => {
    supabase.from("providers").select("users!inner(city)").eq("is_available", true).eq("documents_verified", true).limit(500)
      .then(({ data }) => {
        const set = new Set<string>();
        (data ?? []).forEach((r: any) => { const c = r.users?.city?.trim(); if (c) set.add(c); });
        setCities([...set].sort((a, b) => a.localeCompare(b, "es")));
        setCitiesLoaded(true);
      });
  }, []);

  // /servicios/:rubro/:ciudad → buscamos la ciudad real por su slug
  const slugCity = citySlug ? cities.find(c => slugify(c) === citySlug) ?? null : null;
  const cityLabel = citySlug ? (slugCity ?? unslugify(citySlug)) : null;
  const cityMissing = !!citySlug && citiesLoaded && !slugCity;
  useEffect(() => { if (citySlug && citiesLoaded) setZoneCity(slugCity); }, [citySlug, citiesLoaded, slugCity]);
  const ready = !citySlug || citiesLoaded;

  useSeo(seoMode
    ? { title: serviceTitle(presetCategory!, cityLabel), description: serviceDescription(presetCategory!, cityLabel), path: `/servicios/${presetCategory}${citySlug ? `/${citySlug}` : ""}` }
    : { title: "Buscar profesionales", path: "/search" });

  // Chips de rubro: en las páginas por rubro cambian la URL (así cada rubro tiene su página)
  function pickCategory(id: string | null) {
    if (!seoMode) { setCat(id); return; }
    if (!id) navigate("/search");
    else navigate(`/servicios/${id}${citySlug ? `/${citySlug}` : ""}`);
  }

  const search = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    const byCity = !!zoneCity;
    let q = supabase.from("providers")
      .select(byCity ? providerSelect("users!inner(id,name,avatar_url,city)") : providerSelect("users(id,name,avatar_url,city)"))
      .eq("is_available", true).eq("documents_verified", true).limit(40);
    if (byCity) q = q.ilike("users.city", zoneCity!);
    const dbName = cat ? categoryById(cat)?.dbName : undefined;
    if (dbName) q = q.contains("categories", [dbName]);
    if (minRating === "4") q = q.gte("rating_avg", 4);
    if (minRating === "4.5") q = q.gte("rating_avg", 4.5);
    if (sort === "reviews") q = q.order("reviews_count", { ascending: false });
    else q = q.order("rating_avg", { ascending: false }).order("reviews_count", { ascending: false });
    const { data } = await q;
    setProviders((data as unknown as Provider[]) ?? []);
    setLoading(false);
    track("search", { category: cat ?? "all", city: zoneCity ?? "all", results: data?.length ?? 0, landing: seoMode });
  }, [cat, minRating, sort, zoneCity, ready, seoMode]);

  useEffect(() => { search(); }, [search]);

  // Filtro por texto (client-side, sobre nombre y categoría)
  const results = providers
    .map(mapProvider)
    .filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()) || (p.categoryLabel ?? "").toLowerCase().includes(query.toLowerCase()));

  const catObj = cat ? categoryById(cat) : null;

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        {/* top bar */}
        <div style={{ padding: "var(--sm-top, 54px) 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/home")} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="arrow-left" size={20} color={t.ink} />
          </button>
          <div style={{ flex: 1, height: 44, background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
            <Icon name="search" size={18} color={t.inkSoft} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar profesional o servicio..." style={{ all: "unset", flex: 1, fontFamily: t.fontBody, fontSize: 14.5, color: t.ink }} />
            {query && <button onClick={() => setQuery("")} style={{ all: "unset", cursor: "pointer" }}><Icon name="close" size={16} color={t.inkSoft} /></button>}
          </div>
          <button onClick={() => setShowFilters(s => !s)} style={{ all: "unset", cursor: "pointer", width: 44, height: 44, borderRadius: 999, background: showFilters ? t.ink : t.surface, border: `1px solid ${showFilters ? t.ink : t.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="sliders" size={20} color={showFilters ? "#fff" : t.ink} />
          </button>
        </div>

        {/* encabezado de las páginas por rubro */}
        {seoMode && (
          <div style={{ padding: "16px 20px 0" }}>
            <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: desktop ? 30 : 23, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              {serviceTitle(presetCategory!, cityLabel)}
            </h1>
            <p style={{ margin: "6px 0 0", fontFamily: t.fontBody, fontSize: desktop ? 14.5 : 13, color: t.inkMute, lineHeight: 1.45, maxWidth: 720 }}>
              {cityMissing
                ? `Todavía no hay prestadores verificados en ${cityLabel}. Te mostramos los de todo el país.`
                : "Todos con DNI verificado por ServiMarket. Mirá sus reseñas, pedí presupuesto sin cargo y coordiná el trabajo por el chat."}
            </p>
          </div>
        )}

        {/* chips de categoría */}
        <div style={{ padding: "14px 0 6px" }}>
          <div style={{ display: "flex", gap: 8, padding: "0 16px", overflowX: desktop ? "visible" : "auto", flexWrap: desktop ? "wrap" : "nowrap" }} className="scrollbar-hide">
            <Chip active={!cat} onClick={() => pickCategory(null)}>Todas</Chip>
            {CATEGORIES.map(c => (
              <Chip key={c.id} active={cat === c.id} onClick={() => pickCategory(c.id)} icon={<CategoryIcon name={c.id} size={14} color={cat === c.id ? "#fff" : c.hue} />}>{c.label}</Chip>
            ))}
          </div>
        </div>

        {/* orden */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 6px" }}>
          <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.inkMute }}>
            <strong style={{ color: t.ink, fontWeight: 700 }}>{results.length}</strong> resultados{catObj ? ` · ${catObj.label}` : ""}{zoneCity ? ` · ${zoneCity}` : ""}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as "rating" | "reviews")} style={{
            all: "unset", cursor: "pointer", fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 600, color: t.ink,
            padding: "6px 24px 6px 12px", background: t.surfaceAlt, borderRadius: 999,
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(t.ink)}' stroke-width='2.5'><path d='M6 9l6 6 6-6'/></svg>")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
            WebkitAppearance: "none", MozAppearance: "none", appearance: "none",
          }}>
            <option value="rating">Mejor calificación</option>
            <option value="reviews">Más reseñas</option>
          </select>
        </div>

        {/* filtros */}
        {showFilters && (
          <div style={{ padding: "8px 20px 12px", borderBottom: `1px solid ${t.lineSoft}` }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 700, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Calificación mínima</div>
            <div style={{ display: "flex", gap: 8 }}>
              {([{ id: "all", label: "Todas" }, { id: "4", label: "4+ ★" }, { id: "4.5", label: "4.5+ ★" }] as const).map(opt => (
                <Chip key={opt.id} active={minRating === opt.id} onClick={() => setMinRating(opt.id)}>{opt.label}</Chip>
              ))}
            </div>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 700, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 8px" }}>Zona</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {userCity && (
                <Chip active={zoneCity?.toLowerCase() === userCity.toLowerCase()} onClick={() => setZoneCity(userCity)} icon={<Icon name="pin-fill" size={13} color={zoneCity?.toLowerCase() === userCity.toLowerCase() ? "#fff" : t.green} />}>{userCity}</Chip>
              )}
              <Chip active={!zoneCity} onClick={() => setZoneCity(null)}>Todo el país</Chip>
              {/* buscar en cualquier otra ciudad con prestadores */}
              {cities.filter(c => c.toLowerCase() !== userCity?.toLowerCase()).length > 0 && (() => {
                const others = cities.filter(c => c.toLowerCase() !== userCity?.toLowerCase());
                const isOther = !!zoneCity && zoneCity.toLowerCase() !== userCity?.toLowerCase();
                return (
                  <select value={isOther ? zoneCity! : ""} onChange={e => { if (e.target.value) setZoneCity(e.target.value); }} style={{
                    cursor: "pointer", fontFamily: t.fontBody, fontSize: 13, fontWeight: 600,
                    color: isOther ? "#fff" : t.ink, background: isOther ? t.ink : t.surface,
                    border: `1.5px solid ${isOther ? t.ink : t.line}`, borderRadius: 999, padding: "7px 26px 7px 12px",
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(isOther ? "#ffffff" : t.ink)}' stroke-width='2.5'><path d='M6 9l6 6 6-6'/></svg>")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
                    WebkitAppearance: "none", MozAppearance: "none", appearance: "none", outline: "none",
                  }}>
                    <option value="" disabled>Otra ciudad…</option>
                    {others.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                );
              })()}
            </div>
          </div>
        )}

        {/* resultados */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 100px", ...listLayout(desktop, 340, 10) }}>
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute, gridColumn: "1 / -1" }}>Buscando...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute, gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
              {zoneCity ? (
                <>
                  <div>Sin resultados en {zoneCity}.</div>
                  <button onClick={() => setZoneCity(null)} style={{ all: "unset", cursor: "pointer", marginTop: 12, fontFamily: t.fontBody, fontSize: 14, fontWeight: 700, color: t.green }}>
                    Buscar en todo el país
                  </button>
                </>
              ) : "Sin resultados. Probá con otra categoría."}
            </div>
          ) : results.map(p => <ProviderCard key={p.id} provider={p} onClick={() => navigate(`/provider/${p.id}`)} />)}

          {/* enlaces a otros rubros (ayudan a los buscadores a recorrer el sitio) */}
          {seoMode && !loading && (
            <nav aria-label="Otros servicios" style={{ gridColumn: "1 / -1", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${t.lineSoft}` }}>
              <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 700, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Otros servicios{cityLabel && !cityMissing ? ` en ${cityLabel}` : ""}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                {SEO_CATEGORIES.filter(c => c.id !== cat).map(c => (
                  <Link key={c.id} to={`/servicios/${c.id}${citySlug && !cityMissing ? `/${citySlug}` : ""}`} style={{ fontFamily: t.fontBody, fontSize: 13.5, color: t.green, textDecoration: "none", fontWeight: 600 }}>
                    {serviceTitle(c.id, cityLabel && !cityMissing ? cityLabel : null)}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>

        <TabBar active="search" />
      </div>
    </MobileScreen>
  );
}

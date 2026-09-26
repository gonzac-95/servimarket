// Código compartido por las funciones de Vercel (api/seo.ts y api/sitemap.ts).
// Los archivos con "_" adelante no se publican como endpoints.
//
// SEO_CATEGORIES y slugify son copia de src/lib/seo.ts + src/lib/categories.ts
// (las funciones no importan de src/). src/lib/seo.test.ts controla que coincidan.

export const SITE_URL = "https://servimarket.app";

export const SEO_CATEGORIES: { id: string; dbName: string; plural: string; singular: string }[] = [
  { id: "gasista", dbName: "Gasista", plural: "Gasistas", singular: "gasista matriculado" },
  { id: "electricista", dbName: "Electricista", plural: "Electricistas", singular: "electricista" },
  { id: "plomero", dbName: "Plomero", plural: "Plomeros", singular: "plomero" },
  { id: "pintor", dbName: "Pintor", plural: "Pintores", singular: "pintor" },
  { id: "fletes", dbName: "Flete", plural: "Fletes y mudanzas", singular: "flete" },
  { id: "albanil", dbName: "Albanil", plural: "Albañiles", singular: "albañil" },
  { id: "cerrajero", dbName: "Cerrajero", plural: "Cerrajeros", singular: "cerrajero" },
  { id: "limpieza", dbName: "Limpieza", plural: "Servicios de limpieza", singular: "servicio de limpieza" },
  { id: "carpintero", dbName: "Carpintero", plural: "Carpinteros", singular: "carpintero" },
  { id: "aire", dbName: "Tecnico Aire", plural: "Técnicos de aire acondicionado", singular: "técnico de aire acondicionado" },
  { id: "jardinero", dbName: "Jardinero", plural: "Jardineros", singular: "jardinero" },
];

export function slugify(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function unslugify(s: string): string {
  return s.split("-").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export interface PublicProvider {
  id: string;
  categories: string[] | null;
  bio: string | null;
  rating_avg: number | null;
  reviews_count: number | null;
  documents_verified: boolean | null;
  is_available: boolean | null;
  created_at: string;
  users: { name: string | null; avatar_url: string | null; city: string | null; province: string | null; is_blocked?: boolean | null } | null;
}

/** Lectura pública (anon) a la API REST de Supabase. Devuelve null si no hay config o falla. */
export async function supabaseGet<T>(pathAndQuery: string): Promise<T | null> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const PROVIDER_SELECT = "id,categories,bio,rating_avg,reviews_count,documents_verified,is_available,created_at,users(name,avatar_url,city,province,is_blocked)";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

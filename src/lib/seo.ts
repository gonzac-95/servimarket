// seo.ts — título, descripción, canonical y Open Graph por pantalla, más los
// textos de las páginas por rubro (/servicios/:rubro y /servicios/:rubro/:ciudad).
//
// Ojo: api/seo.ts y api/sitemap.ts tienen su propia copia de SEO_CATEGORIES y
// slugify (las funciones de Vercel no importan de src/). Si cambia algo acá,
// actualizarlo allá también — el test src/lib/seo.test.ts lo controla.
import { useEffect } from "react";

export const SITE_URL = "https://servimarket.app";
export const SITE_NAME = "ServiMarket";
export const DEFAULT_TITLE = "ServiMarket · Profesionales verificados para tu casa";
export const DEFAULT_DESCRIPTION = "Encontrá gasistas, electricistas, plomeros y más, con DNI verificado y reseñas de trabajos reales. Pedí presupuesto y coordiná todo en un solo lugar.";
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/** "Villa Gobernador Gálvez" → "villa-gobernador-galvez" */
export function slugify(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** "villa-gobernador-galvez" → "Villa Gobernador Galvez" (si no conocemos la ciudad) */
export function unslugify(s: string): string {
  return s.split("-").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// Textos por rubro. `id` es el id de CATEGORIES (lib/categories.ts).
export const SEO_CATEGORIES: { id: string; plural: string; singular: string }[] = [
  { id: "gasista", plural: "Gasistas", singular: "gasista matriculado" },
  { id: "electricista", plural: "Electricistas", singular: "electricista" },
  { id: "plomero", plural: "Plomeros", singular: "plomero" },
  { id: "pintor", plural: "Pintores", singular: "pintor" },
  { id: "fletes", plural: "Fletes y mudanzas", singular: "flete" },
  { id: "albanil", plural: "Albañiles", singular: "albañil" },
  { id: "cerrajero", plural: "Cerrajeros", singular: "cerrajero" },
  { id: "limpieza", plural: "Servicios de limpieza", singular: "servicio de limpieza" },
  { id: "carpintero", plural: "Carpinteros", singular: "carpintero" },
  { id: "aire", plural: "Técnicos de aire acondicionado", singular: "técnico de aire acondicionado" },
  { id: "jardinero", plural: "Jardineros", singular: "jardinero" },
];
export const seoCategory = (id?: string | null) => SEO_CATEGORIES.find(c => c.id === id);

export function serviceTitle(catId: string, city?: string | null): string {
  const c = seoCategory(catId);
  const base = c?.plural ?? "Profesionales";
  return city ? `${base} en ${city}` : `${base} verificados`;
}

export function serviceDescription(catId: string, city?: string | null): string {
  const c = seoCategory(catId);
  const who = c?.singular ?? "profesional";
  const where = city ? ` en ${city}` : " en tu zona";
  return `Encontrá un ${who}${where} con DNI verificado y reseñas de trabajos reales. Pedí presupuesto gratis y coordiná todo por ServiMarket.`;
}

export interface SeoOptions {
  title?: string;          // sin el sufijo " · ServiMarket"
  description?: string;
  path?: string;           // ruta canónica, ej. "/servicios/gasista"
  image?: string;
  noindex?: boolean;
}

function setMeta(attr: "name" | "property", key: string, value: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (value === null) { el?.remove(); return; }
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", value);
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) { el?.remove(); return; }
  if (!el) { el = document.createElement("link"); el.rel = "canonical"; document.head.appendChild(el); }
  el.href = href;
}

/** Aplica título, descripción, canonical y OG mientras la pantalla está montada. */
export function useSeo(opts: SeoOptions) {
  const { title, description, path, image, noindex } = opts;
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
    const desc = description ?? DEFAULT_DESCRIPTION;
    const url = path ? `${SITE_URL}${path}` : null;
    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : null);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url ?? SITE_URL);
    setMeta("property", "og:image", image ?? OG_IMAGE);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", image ?? OG_IMAGE);
    setCanonical(url);
  }, [title, description, path, image, noindex]);
}

/** Heurística simple para no mostrar splash/onboarding a los buscadores. */
export function isBot(): boolean {
  return typeof navigator !== "undefined" && /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|lighthouse/i.test(navigator.userAgent);
}

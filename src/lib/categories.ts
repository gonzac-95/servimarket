// categories.ts — categorías del diseño mapeadas a los nombres de la DB
import type { Provider } from "../types";
import type { ProviderCardData } from "../components/mobile/kit";

export interface Category {
  id: string;      // id del diseño (lowercase)
  label: string;   // etiqueta visible
  dbName: string;  // valor exacto en providers.categories (DB)
  hue: string;     // color del ícono
}

export const CATEGORIES: Category[] = [
  { id: "gasista", label: "Gasista", dbName: "Gasista", hue: "#E07A2B" },
  { id: "electricista", label: "Electricista", dbName: "Electricista", hue: "#E0B62B" },
  { id: "plomero", label: "Plomero", dbName: "Plomero", hue: "#2B8FE0" },
  { id: "pintor", label: "Pintor", dbName: "Pintor", hue: "#7E5BF0" },
  { id: "fletes", label: "Fletes", dbName: "Flete", hue: "#1F8A5B" },
  { id: "albanil", label: "Albañil", dbName: "Albanil", hue: "#A06A3F" },
  { id: "cerrajero", label: "Cerrajero", dbName: "Cerrajero", hue: "#525B6B" },
  { id: "limpieza", label: "Limpieza", dbName: "Limpieza", hue: "#2BB7C6" },
  { id: "carpintero", label: "Carpintero", dbName: "Carpintero", hue: "#8A4F2A" },
  { id: "aire", label: "Aire acond.", dbName: "Tecnico Aire", hue: "#3CB0E0" },
  { id: "jardinero", label: "Jardinero", dbName: "Jardinero", hue: "#3F9A4D" },
];

export const categoryById = (id: string) => CATEGORIES.find(c => c.id === id);
export const categoryByDbName = (dbName: string) => CATEGORIES.find(c => c.dbName === dbName);

// Hue por defecto para avatares (verde de marca) o según primera categoría
function hueForProvider(p: Provider): string {
  const first = p.categories?.[0];
  return (first && categoryByDbName(first)?.hue) || "#15803D";
}

function initialsOf(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Mapea una fila de providers (con users embebido) a la forma que usa ProviderCard
export function mapProvider(p: Provider): ProviderCardData & { id: string } {
  const cat = p.categories?.[0] ? categoryByDbName(p.categories[0]) : undefined;
  return {
    id: p.id,
    name: p.users?.name ?? "Prestador",
    initials: initialsOf(p.users?.name),
    avatarUrl: p.users?.avatar_url ?? null,
    avatarHue: hueForProvider(p),
    categoryLabel: cat?.label ?? p.categories?.[0] ?? "Servicio",
    rating: p.rating_avg ?? 0,
    reviews: p.reviews_count ?? 0,
    verified: p.documents_verified ?? false,
    isNew: (p.reviews_count ?? 0) === 0,
    neighborhood: p.users?.city ?? undefined,
  };
}

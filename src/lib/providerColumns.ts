// Columnas públicas de providers. CUIT, matrícula y datos de MercadoPago no
// se pueden leer desde la API (ver migración 20260927_provider_private_columns);
// el prestador obtiene su fila completa con la RPC get_my_provider.
// (Literal en una sola línea para que supabase-js pueda inferir los tipos.)
export const PROVIDER_PUBLIC_COLS = "id,user_id,categories,bio,price_list,photos,service_radius_km,service_zones,documents_verified,dni_verified,license_verified,background_check,rating_avg,reviews_count,is_available,created_at" as const;

/** Columnas públicas + el usuario embebido, ej. providerSelect("users(id,name)") */
export function providerSelect<E extends string>(embed: E): `${typeof PROVIDER_PUBLIC_COLS},${E}` {
  return `${PROVIDER_PUBLIC_COLS},${embed}`;
}

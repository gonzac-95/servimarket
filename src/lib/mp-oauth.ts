import { supabase } from "./supabase";

export interface MpOAuthStartResult {
  url?: string;
  error?: string;
}

/**
 * Inicia el flujo OAuth de MercadoPago. Llama a la edge function
 * mp-oauth-start que genera un state firmado y devuelve la URL de
 * autorización. El caller hace el redirect.
 */
export async function startMpConnect(): Promise<MpOAuthStartResult> {
  const { data, error } = await supabase.functions.invoke("mp-oauth-start");
  if (error) return { error: error.message };
  if (!data?.url) return { error: data?.error ?? "unknown_error" };
  return { url: data.url };
}

/**
 * Desconecta MercadoPago: borra credenciales y limpia el mp_user_id
 * del provider. Lo hacemos vía RPC server-side por seguridad, pero
 * como `provider_mp_credentials` solo es accesible por service role,
 * usamos una edge function.
 */
export async function disconnectMp(providerId: string): Promise<{ error?: string }> {
  const { data, error } = await supabase.functions.invoke("mp-oauth-disconnect", {
    body: { provider_id: providerId },
  });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return {};
}

/** Mapeo de errores que puede devolver mp-oauth-callback en la query string. */
export const MP_ERROR_MESSAGES: Record<string, string> = {
  missing_params: "Faltan parámetros en la respuesta de MercadoPago",
  invalid_state: "El estado de la autorización es inválido o expiró",
  state_used: "Este enlace de autorización ya fue usado",
  token_exchange_failed: "MercadoPago rechazó la autorización",
  save_failed: "No se pudieron guardar las credenciales",
  internal: "Error interno. Intentá de nuevo en unos minutos",
};

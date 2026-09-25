// support.ts — canales de contacto con ServiMarket.
// +54 336 465-0234. WhatsApp exige el 9 después del 54 para celulares argentinos.
export const SUPPORT_WHATSAPP = "5493364650234"; // formato wa.me: sin "+" ni espacios
export const SUPPORT_EMAIL = "servimarket.admin@gmail.com";

/** Link de WhatsApp con mensaje precargado. */
export function whatsappLink(message = "Hola ServiMarket, necesito ayuda con"): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/**
 * Enlaces de pago externos permitidos (FEATURE-013). Adoptia no procesa
 * dinero: solo enlaza a plataformas conocidas. Debe coincidir con la función
 * es_enlace_pago_valido de la BD (la red final).
 */
export const ENLACE_PAGO_RE =
  /^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com|www\.teaming\.net|teaming\.net|www\.paypal\.com|paypal\.com|paypal\.me|www\.paypal\.me)\/.+/i;

export function esEnlacePagoValido(url: string): boolean {
  return ENLACE_PAGO_RE.test(url);
}

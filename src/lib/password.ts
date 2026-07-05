const MINUSCULA = /[a-zñáéíóúü]/;
const MAYUSCULA = /[A-ZÑÁÉÍÓÚÜ]/;
const DIGITO = /\d/;
const SIMBOLO = /[^a-zA-Z0-9ñáéíóúüÑÁÉÍÓÚÜ]/;

/** Requisitos exigidos por Supabase: min 8 con minúscula, mayúscula, dígito y símbolo. */
export function cumpleRequisitos(password: string): boolean {
  return (
    password.length >= 8 &&
    MINUSCULA.test(password) &&
    MAYUSCULA.test(password) &&
    DIGITO.test(password) &&
    SIMBOLO.test(password)
  );
}

/**
 * Fuerza de contraseña 0-3 para el indicador visual del registro.
 * 0 = no cumple los requisitos, 1-3 según variedad y longitud.
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!cumpleRequisitos(password)) return 0;
  if (password.length >= 14) return 3;
  if (password.length >= 10) return 2;
  return 1;
}

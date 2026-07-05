/**
 * Fuerza de contraseña 0-3 para el indicador visual del registro.
 * 0 = inválida (<8), 1 = mínima, 2 = mezcla de tipos, 3 = larga y variada.
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length < 8) return 0;

  const tipos = [/[a-záéíóúñü]/i, /\d/, /[^a-z0-9áéíóúñü]/i].filter((re) =>
    re.test(password),
  ).length;

  if (tipos >= 2 && password.length >= 12) return 3;
  if (tipos >= 2) return 2;
  return 1;
}

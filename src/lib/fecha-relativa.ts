/**
 * Fecha relativa en español para la ficha («Publicado hace 2 días»).
 * Sin dependencias: cálculo manual para controlar exactamente los textos
 * (Intl.RelativeTimeFormat con `numeric:auto` diría «anteayer» a los 2 días).
 */
export function fechaRelativa(iso: string, ahora: Date = new Date()): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";

  const dias = Math.floor((ahora.getTime() - fecha.getTime()) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;

  const meses = Math.round(dias / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;

  const anios = Math.round(dias / 365);
  return `hace ${anios} ${anios === 1 ? "año" : "años"}`;
}

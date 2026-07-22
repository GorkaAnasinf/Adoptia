/**
 * Festivos nacionales de España para cerrar la agenda de un click (FEATURE-056).
 * Lista estática (coste 0, sin API): los fijos nacionales + Viernes Santo, que
 * es movible. Los festivos autonómicos y locales se cierran con el rango (F2a).
 */

/** Fija dos dígitos: (2026, 8, 15) → "2026-08-15" (mes 1-indexado aquí). */
function iso(year: number, mes: number, dia: number): string {
  return `${year}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// Festivos nacionales fijos (mismo día cada año).
const FIJOS: [number, number][] = [
  [1, 1], // Año Nuevo
  [1, 6], // Epifanía
  [5, 1], // Fiesta del Trabajo
  [8, 15], // Asunción
  [10, 12], // Fiesta Nacional
  [11, 1], // Todos los Santos
  [12, 6], // Constitución
  [12, 8], // Inmaculada
  [12, 25], // Navidad
];

/**
 * Domingo de Pascua por el algoritmo de cómputo (Gregoriano, "Anonymous").
 * Devuelve [mes, día] (mes 1-indexado).
 */
function domingoPascua(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return [mes, dia];
}

/** Viernes Santo (ISO) = Domingo de Pascua − 2 días. */
export function viernesSanto(year: number): string {
  const [mes, dia] = domingoPascua(year);
  const d = new Date(Date.UTC(year, mes - 1, dia));
  d.setUTCDate(d.getUTCDate() - 2);
  return d.toISOString().slice(0, 10);
}

/** Festivos nacionales del año (fijos + Viernes Santo), ordenados y sin duplicados. */
export function festivosNacionales(year: number): string[] {
  const fechas = new Set(FIJOS.map(([mes, dia]) => iso(year, mes, dia)));
  fechas.add(viernesSanto(year));
  return [...fechas].sort();
}

/**
 * Resolución de la disponibilidad de un día concreto (FEATURE-053).
 *
 * Modelo: patrón semanal recurrente (`availability_slots`) + excepciones por
 * fecha (`availability_overrides`). Un override puede cerrar el día o fijar un
 * horario especial que sustituye al patrón. La misma lógica la aplica el RPC
 * `appointment_free_slots` en BD; aquí vive la versión de cliente para pintar
 * el calendario y el editor.
 */

/** Franja del patrón semanal, tal como llega de `availability_slots`. */
export type FranjaSemanal = {
  weekday: number;
  start_time: string; // "HH:MM:SS" (time de Postgres)
  end_time: string;
  slot_minutes: number;
  active: boolean;
};

/** Franja concreta (override o ya normalizada): horas "HH:MM". */
export type FranjaDia = {
  start: string; // "HH:MM"
  end: string;
  minutes: number;
};

/** Cita con el detalle que muestra la vista diaria de la agenda (FEATURE-055). */
export type CitaAgenda = {
  id: string;
  starts_at: string;
  status: string;
  animalName: string | null;
  animalSlug: string | null;
  adopterName: string | null;
};

/** Plantilla de horario reutilizable (`availability_templates`). */
export type Plantilla = {
  id: string;
  nombre: string;
  slots: FranjaDia[];
};

/** Excepción de un día, tal como llega de `availability_overrides`. */
export type OverrideDia = {
  date: string; // "YYYY-MM-DD"
  closed: boolean;
  slots: FranjaDia[];
  note: string | null;
};

/**
 * Intención de guardado que el editor de día emite al orquestador:
 * - `cerrar`: upsert de override cerrado.
 * - `especial`: upsert de override con horario propio de esa fecha.
 * - `patron`: escribe el patrón semanal del weekday y limpia el override.
 */
export type IntentGuardar =
  | { tipo: "cerrar"; note: string | null }
  | { tipo: "especial"; slots: FranjaDia[]; note: string | null }
  | { tipo: "patron"; slots: FranjaDia[] };

/** Estado resuelto de un día para el calendario y el editor. */
export type EstadoDia =
  | { tipo: "sin_configurar" }
  | { tipo: "patron"; franjas: FranjaDia[] }
  | { tipo: "especial"; franjas: FranjaDia[]; note: string | null }
  | { tipo: "cerrado"; note: string | null };

/** "10:00:00" | "10:00" → "10:00". */
export function hhmm(v: string): string {
  return v.slice(0, 5);
}

/** (2026, 7, 5) [mes 0-indexado] → "2026-08-05". Sin desfases de zona horaria. */
export function fechaISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Fechas ISO ("YYYY-MM-DD") de `desde` a `hasta`, ambas inclusive. Rango
 * invertido → `[]`. Se calcula en UTC para no arrastrar desfases de zona.
 */
export function diasEnRango(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  const fin = new Date(`${hasta}T00:00:00Z`).getTime();
  const cursor = new Date(`${desde}T00:00:00Z`);
  while (cursor.getTime() <= fin) {
    dias.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dias;
}

/**
 * Celdas del mes en rejilla Lunes→Domingo: `null` para el relleno inicial y
 * final, número de día para el resto. Longitud múltiplo de 7.
 */
export function celdasMes(year: number, month: number): (number | null)[] {
  const desplazamiento = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
  const totalDias = new Date(year, month + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array<null>(desplazamiento).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

/**
 * Valida un conjunto de franjas de un día: cada una con fin posterior al
 * inicio y sin solapes entre ellas. Horas "HH:MM" (comparables como texto).
 */
export function validarFranjas(
  franjas: FranjaDia[],
): { ok: true } | { ok: false; error: "horas" | "solape" } {
  for (const f of franjas) {
    if (f.end <= f.start) return { ok: false, error: "horas" };
  }
  const ordenadas = [...franjas].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < ordenadas.length; i++) {
    if (ordenadas[i].start < ordenadas[i - 1].end) return { ok: false, error: "solape" };
  }
  return { ok: true };
}

/**
 * Traduce un estado de día (copiado) a la fila de override de una fecha para
 * pegarlo (FEATURE-056). Devuelve `null` si no es aplicable: día sin configurar
 * o franjas inválidas. `patron` se materializa como horario especial de la fecha.
 */
export function estadoAOverride(estado: EstadoDia, date: string): OverrideDia | null {
  if (estado.tipo === "cerrado") {
    return { date, closed: true, slots: [], note: estado.note };
  }
  if (estado.tipo === "especial" || estado.tipo === "patron") {
    if (!validarFranjas(estado.franjas).ok) return null;
    const note = estado.tipo === "especial" ? estado.note : null;
    return { date, closed: false, slots: estado.franjas, note };
  }
  return null; // sin_configurar
}

function patronAFranjas(franjas: FranjaSemanal[]): FranjaDia[] {
  return franjas
    .filter((f) => f.active)
    .map((f) => ({ start: hhmm(f.start_time), end: hhmm(f.end_time), minutes: f.slot_minutes }));
}

/**
 * Resuelve el estado de un día a partir de las franjas del patrón semanal de
 * ese weekday (ya filtradas por día de la semana) y el override de la fecha.
 *
 * Prioridad: override cerrado > override con franjas > patrón semanal.
 */
export function resolverDiaAgenda(
  franjasPatron: FranjaSemanal[],
  override: OverrideDia | null,
): EstadoDia {
  if (override?.closed) {
    return { tipo: "cerrado", note: override.note };
  }
  if (override && override.slots.length > 0) {
    return { tipo: "especial", franjas: override.slots, note: override.note };
  }
  const franjas = patronAFranjas(franjasPatron);
  if (franjas.length === 0) return { tipo: "sin_configurar" };
  return { tipo: "patron", franjas };
}

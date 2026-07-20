/**
 * Recordatorios del dashboard del adoptante (FEATURE-039).
 *
 * Función pura: la página consulta Supabase y le pasa las filas ya leídas.
 * Así la regla de negocio —sobre todo «solicitud aprobada que todavía no ha
 * reservado visita»— se prueba sin tocar la base de datos.
 */

export type CitaProxima = {
  id: string;
  request_id: string | null;
  starts_at: string;
  animal: string | null;
  protectora: string | null;
};

export type SolicitudViva = {
  id: string;
  status: string;
  animal: string | null;
};

export type PropuestaPendiente = {
  id: string;
  animal: string | null;
  protectora: string | null;
};

export type Recordatorio = {
  tipo: "cita" | "reservar" | "acogida";
  id: string;
  href: string;
  animal: string | null;
  protectora: string | null;
  /** Solo en las citas: instante de inicio, ya en ISO. */
  fecha?: string;
};

/** Tope visual del bloque lateral: más de tres deja de ser un recordatorio. */
const MAXIMO = 3;

export function componerRecordatorios({
  citas,
  solicitudes,
  propuestas,
}: {
  citas: CitaProxima[];
  solicitudes: SolicitudViva[];
  propuestas: PropuestaPendiente[];
}): Recordatorio[] {
  const deCitas: Recordatorio[] = [...citas]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map((c) => ({
      tipo: "cita",
      id: c.id,
      href: "/mi-cuenta/citas",
      animal: c.animal,
      protectora: c.protectora,
      fecha: c.starts_at,
    }));

  const conCita = new Set(citas.map((c) => c.request_id).filter((id): id is string => id !== null));
  const deSolicitudes: Recordatorio[] = solicitudes
    .filter((s) => s.status === "approved" && !conCita.has(s.id))
    .map((s) => ({
      tipo: "reservar",
      id: s.id,
      href: `/mi-cuenta/citas/nueva/${s.id}`,
      animal: s.animal,
      protectora: null,
    }));

  const deAcogida: Recordatorio[] = propuestas.map((p) => ({
    tipo: "acogida",
    id: p.id,
    href: "/mi-cuenta/acogida",
    animal: p.animal,
    protectora: p.protectora,
  }));

  return [...deCitas, ...deSolicitudes, ...deAcogida].slice(0, MAXIMO);
}

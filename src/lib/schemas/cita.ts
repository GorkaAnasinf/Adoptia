import { z } from "zod";

// ---------- Valores del dominio (enum de la BD: appointment_status) ----------
export const ESTADOS_CITA = ["pending", "confirmed", "cancelled", "done", "no_show"] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

// ---------- Body de POST /api/citas ----------
export const crearCitaSchema = z.object({
  request_id: z.uuid(),
  starts_at: z.iso.datetime({ offset: true }),
});
export type CrearCitaInput = z.infer<typeof crearCitaSchema>;

// ---------- Body de PATCH /api/citas/[id] ----------
export const accionCitaSchema = z.discriminatedUnion("accion", [
  // Cancela cualquiera de las partes; el motivo se comunica a la otra.
  z.object({ accion: z.literal("cancel"), motivo: z.string().trim().min(1, "motivo_requerido").max(2000) }),
  // Solo la protectora: visita realizada / adoptante no presentado.
  z.object({ accion: z.literal("done") }),
  z.object({ accion: z.literal("no_show") }),
]);
export type AccionCita = z.infer<typeof accionCitaSchema>;

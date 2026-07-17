import { z } from "zod";

/** Propuesta de acogida de una protectora a un acogedor (FEATURE-029). */
export const propuestaAcogidaSchema = z.object({
  foster_user_id: z.uuid(),
  animal_id: z.uuid().optional(),
  duracion: z.string().trim().min(1).max(120),
  mensaje: z.string().trim().min(1).max(1000),
});

export type PropuestaAcogida = z.infer<typeof propuestaAcogidaSchema>;

export const ESTADOS_PROPUESTA = ["enviada", "aceptada", "rechazada", "finalizada"] as const;
export type EstadoPropuesta = (typeof ESTADOS_PROPUESTA)[number];

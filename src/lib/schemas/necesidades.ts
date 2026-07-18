import { z } from "zod";

export const CATEGORIAS_NECESIDAD = [
  "comida",
  "mantas_ropa",
  "medicinas",
  "transporte",
  "otros",
] as const;
export type CategoriaNecesidad = (typeof CATEGORIAS_NECESIDAD)[number];

/** Alta/edición de una necesidad (panel de protectora, FEATURE-031). */
export const necesidadSchema = z.object({
  categoria: z.enum(CATEGORIAS_NECESIDAD),
  descripcion: z.string().trim().min(1).max(500),
  urgencia: z.enum(["normal", "urgente"]),
});

/** «Puedo ayudar»: mensaje del usuario a la protectora. */
export const ayudaNecesidadSchema = z.object({
  need_id: z.uuid(),
  mensaje: z.string().trim().min(10).max(1000),
});

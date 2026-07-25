import { z } from "zod";

export const ESTADOS_JORNADA = ["draft", "published", "cancelled", "finished"] as const;
export type EstadoJornada = (typeof ESTADOS_JORNADA)[number];

const fechaValida = z
  .string()
  .trim()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "fecha_invalida" });

/**
 * Alta/edición de una jornada de adopción (panel de protectora, FEATURE-062).
 * La ubicación (`lat`/`lng`) es opcional para guardar borrador, pero
 * obligatoria para publicar — se comprueba con `jornadaEsPublicable`, igual que
 * el check de la BD (`status <> 'published' or location is not null`).
 */
export const jornadaSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).default(""),
    starts_at: fechaValida,
    ends_at: fechaValida,
    address: z.string().trim().max(200).nullable().default(null),
    city: z.string().trim().max(120).nullable().default(null),
    lat: z.number().min(-90).max(90).nullable().default(null),
    lng: z.number().min(-180).max(180).nullable().default(null),
    capacity: z.number().int().positive().nullable().default(null),
    animal_ids: z.array(z.uuid()).default([]),
    poster_url: z.string().url().nullable().default(null),
  })
  .refine((v) => Date.parse(v.ends_at) > Date.parse(v.starts_at), {
    message: "fin_antes_de_inicio",
    path: ["ends_at"],
  });

export type JornadaInput = z.infer<typeof jornadaSchema>;

/** Una jornada solo puede publicarse si tiene ubicación (para el mapa). */
export function jornadaEsPublicable(v: Pick<JornadaInput, "lat" | "lng">): boolean {
  return v.lat !== null && v.lng !== null;
}

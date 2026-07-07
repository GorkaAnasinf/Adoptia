import { z } from "zod";

// ---------- Valores del dominio (enums de la BD) ----------
export const ESPECIES = ["dog", "cat", "other"] as const;
export const SEXOS = ["male", "female", "unknown"] as const;
export const TAMANOS = ["small", "medium", "large"] as const;
export const ESTADOS = ["available", "reserved", "adopted", "fostered", "not_listed"] as const;
export const NIVELES_ENERGIA = ["low", "medium", "high"] as const;

export type AnimalStatus = (typeof ESTADOS)[number];

// Sí / No / No sabemos → true / false / null
const triEstado = z.boolean().nullable();

// ---------- Ficha en borrador: casi todo es opcional ----------
export const animalDraftSchema = z.object({
  name: z.string().trim().min(1, "nombre_requerido"),
  species: z.enum(ESPECIES).nullable().optional(),
  breed: z.string().trim().optional(),
  sex: z.enum(SEXOS).optional(),
  size: z.enum(TAMANOS).nullable().optional(),
  birthDateApprox: z.string().optional(),
  weightKg: z.number().positive().nullable().optional(),
  description: z.string().trim().max(4000).optional(),
  goodWithKids: triEstado.optional(),
  goodWithDogs: triEstado.optional(),
  goodWithCats: triEstado.optional(),
  apartmentSuitable: triEstado.optional(),
  energyLevel: z.enum(NIVELES_ENERGIA).nullable().optional(),
  specialNeeds: z.string().trim().optional(),
  vaccinated: z.boolean().optional(),
  sterilized: z.boolean().optional(),
  microchipped: z.boolean().optional(),
  healthNotes: z.string().trim().optional(),
  adoptionFee: z.number().nonnegative().nullable().optional(),
});

// ---------- Publicar: exige los mínimos de una ficha útil ----------
export const animalPublishSchema = animalDraftSchema.extend({
  species: z.enum(ESPECIES),
  sex: z.enum(SEXOS),
  size: z.enum(TAMANOS),
  description: z.string().trim().min(1, "descripcion_requerida"),
});

export type AnimalDraft = z.infer<typeof animalDraftSchema>;
export type AnimalPublish = z.infer<typeof animalPublishSchema>;

/**
 * Comprueba si una ficha puede publicarse. Las fotos no son un campo del
 * schema (viven en animal_media), así que su recuento llega aparte.
 */
export function validarPublicacion(
  data: unknown,
  photoCount: number,
): { ok: boolean; errores: string[] } {
  const res = animalPublishSchema.safeParse(data);
  const errores = res.success ? [] : res.error.issues.map((i) => i.message);
  if (photoCount < 1) errores.push("foto_requerida");
  return { ok: errores.length === 0, errores };
}

/** Slug estable y único: `nombre-hash6` (6 hex aleatorios). */
export function generarSlug(nombre: string): string {
  const base =
    nombre
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "animal";
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  return `${base}-${hash}`;
}

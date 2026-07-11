import { z } from "zod";
import { ENLACE_PAGO_RE } from "@/lib/enlaces-pago";

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
  // Apadrinamiento (FEATURE-013): enlace externo validado; Adoptia no cobra.
  sponsorable: z.boolean().optional(),
  sponsorLink: z
    .string()
    .trim()
    .regex(ENLACE_PAGO_RE, "enlace_pago_invalido")
    .optional()
    .or(z.literal("")),
  sponsorNote: z.string().trim().max(2000).optional(),
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

// ---------- Transiciones de estado válidas ----------
export const TRANSICIONES: Record<AnimalStatus, AnimalStatus[]> = {
  available: ["reserved", "adopted", "fostered", "not_listed"],
  reserved: ["available", "adopted", "not_listed"],
  fostered: ["available", "reserved", "adopted", "not_listed"],
  adopted: ["available", "not_listed"],
  not_listed: ["available"],
};

/** Cambiar a "adoptado" es irreversible de cara al público: pide confirmación. */
export const ESTADOS_CONFIRMACION: AnimalStatus[] = ["adopted"];

export function esTransicionValida(desde: AnimalStatus, hasta: AnimalStatus): boolean {
  return desde === hasta || (TRANSICIONES[desde]?.includes(hasta) ?? false);
}

// ---------- Mapeo formulario (camelCase) → fila de BD (snake_case) ----------
export function animalToRow(
  data: AnimalDraft,
  shelterId: string,
): Record<string, unknown> {
  return {
    shelter_id: shelterId,
    name: data.name,
    species: data.species ?? null,
    breed: data.breed?.trim() || null,
    sex: data.sex ?? "unknown",
    size: data.size ?? null,
    birth_date_approx: data.birthDateApprox || null,
    weight_kg: data.weightKg ?? null,
    description: data.description?.trim() || null,
    good_with_kids: data.goodWithKids ?? null,
    good_with_dogs: data.goodWithDogs ?? null,
    good_with_cats: data.goodWithCats ?? null,
    apartment_suitable: data.apartmentSuitable ?? null,
    energy_level: data.energyLevel ?? null,
    special_needs: data.specialNeeds?.trim() || null,
    vaccinated: data.vaccinated ?? false,
    sterilized: data.sterilized ?? false,
    microchipped: data.microchipped ?? false,
    health_notes: data.healthNotes?.trim() || null,
    adoption_fee: data.adoptionFee ?? null,
    sponsorable: (data.sponsorable ?? false) && Boolean(data.sponsorLink),
    sponsor_link: data.sponsorLink?.trim() || null,
    sponsor_note: data.sponsorNote?.trim() || null,
  };
}

/**
 * Datos para duplicar una ficha: copia todo menos slug, fotos y estado.
 * El resultado es un borrador nuevo (available, sin publicar) con "(copia)".
 */
export function datosDuplicados(
  fila: Record<string, unknown>,
  shelterId: string,
): Record<string, unknown> {
  const resto = { ...fila };
  for (const k of ["id", "slug", "created_at", "updated_at", "published_at", "status"]) {
    delete resto[k];
  }
  return {
    ...resto,
    shelter_id: shelterId,
    name: `${String(fila.name ?? "Animal")} (copia)`,
    slug: generarSlug(String(fila.name ?? "animal")),
    status: "available",
    published_at: null,
  };
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

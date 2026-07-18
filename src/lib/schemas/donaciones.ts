import { z } from "zod";

export const CATEGORIAS_DONACION = [
  "comida",
  "accesorios",
  "mantas_ropa",
  "juguetes",
  "otros",
] as const;
export type CategoriaDonacion = (typeof CATEGORIAS_DONACION)[number];

/** Alta/edición de una oferta de donación (área del donante, FEATURE-032). */
export const donacionOfertaSchema = z.object({
  categoria: z.enum(CATEGORIAS_DONACION),
  descripcion: z.string().trim().min(1).max(1000),
  city: z.string().trim().min(1).max(120),
  radius_km: z.number().int().min(1).max(200),
});

/** «Contactar»: mensaje de la protectora al donante (relay). */
export const contactoDonacionSchema = z.object({
  offer_id: z.uuid(),
  mensaje: z.string().trim().min(10).max(1000),
});

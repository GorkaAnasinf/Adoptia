import { z } from "zod";

/** Tope de días de un cierre por rango, para no generar upserts desmedidos. */
export const LIMITE_RANGO_DIAS = 366;

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fecha_invalida");

// ---------- Cierre por rango de fechas (FEATURE-054) ----------
export const rangoCierreSchema = z
  .object({
    desde: fecha,
    hasta: fecha,
    nota: z.string().trim().max(200, "nota_larga").optional(),
  })
  .refine((v) => v.hasta >= v.desde, { message: "rango_invertido", path: ["hasta"] })
  .refine(
    (v) => {
      const dias =
        (Date.parse(`${v.hasta}T00:00:00Z`) - Date.parse(`${v.desde}T00:00:00Z`)) / 86_400_000 + 1;
      return dias <= LIMITE_RANGO_DIAS;
    },
    { message: "rango_largo", path: ["hasta"] },
  );

export type RangoCierreInput = z.infer<typeof rangoCierreSchema>;

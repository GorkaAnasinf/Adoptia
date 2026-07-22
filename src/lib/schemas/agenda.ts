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

// ---------- Plantilla de horario (FEATURE-057) ----------
const franjaSchema = z
  .object({
    start: z.string().regex(/^\d{2}:\d{2}$/, "hora_invalida"),
    end: z.string().regex(/^\d{2}:\d{2}$/, "hora_invalida"),
    minutes: z.number().int().min(15).max(120),
  })
  .refine((f) => f.end > f.start, { message: "horas", path: ["end"] });

export const plantillaSchema = z.object({
  nombre: z.string().trim().min(1, "nombre_requerido").max(60, "nombre_largo"),
  slots: z.array(franjaSchema).min(1, "sin_franjas"),
});

export type PlantillaInput = z.infer<typeof plantillaSchema>;

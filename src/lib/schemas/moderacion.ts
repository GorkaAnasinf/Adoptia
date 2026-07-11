import { z } from "zod";

// ---------- Valores del dominio (enums de la BD) ----------
export const RAZONES_REPORTE = [
  "contenido_inapropiado",
  "posible_fraude",
  "spam",
  "maltrato",
  "otro",
] as const;
export type RazonReporte = (typeof RAZONES_REPORTE)[number];

export const ESTADOS_REPORTE = ["pending", "reviewed", "dismissed"] as const;
export type EstadoReporte = (typeof ESTADOS_REPORTE)[number];

// ---------- Body de POST /api/reportes ----------
export const crearReporteSchema = z.object({
  animal_id: z.uuid(),
  reason: z.enum(RAZONES_REPORTE),
  details: z.string().trim().max(2000).optional(),
});
export type CrearReporteInput = z.infer<typeof crearReporteSchema>;

// ---------- Body de PATCH /api/admin/reportes/[id] ----------
export const resolverReporteSchema = z.object({
  accion: z.enum(["reviewed", "dismissed"]),
});

// ---------- Body de POST /api/admin/animales/[id]/moderar ----------
export const moderarAnimalSchema = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("unpublish"),
    motivo: z.string().trim().min(1, "motivo_requerido").max(2000),
  }),
  z.object({ accion: z.literal("republish") }),
]);

// ---------- Body de POST /api/admin/usuarios/[id]/suspender ----------
export const suspenderUsuarioSchema = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("suspend"),
    motivo: z.string().trim().min(1, "motivo_requerido").max(2000),
  }),
  z.object({ accion: z.literal("reactivate") }),
]);

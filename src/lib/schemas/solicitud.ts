import { z } from "zod";

// ---------- Valores del dominio (enum de la BD: request_status) ----------
export const ESTADOS_SOLICITUD = [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
  "completed",
] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

export const VIVIENDAS = ["piso", "casa_jardin", "otro"] as const;
export const REGIMENES = ["propiedad", "alquiler"] as const;

// ---------- Paso 1: vivienda ----------
export const viviendaSchema = z
  .object({
    vivienda: z.enum(VIVIENDAS),
    regimen: z.enum(REGIMENES),
    permiten_animales: z.boolean().optional(),
  })
  .refine((d) => d.regimen !== "alquiler" || d.permiten_animales !== undefined, {
    message: "permiten_animales_requerido",
    path: ["permiten_animales"],
  });

// ---------- Paso 2: hogar ----------
export const hogarSchema = z.object({
  convivientes: z.number().int().min(0),
  ninos_edades: z.array(z.number().int().min(0).max(17)).default([]),
  otros_animales: z.string().trim().max(500).optional().default(""),
});

// ---------- Paso 3: experiencia y tiempo ----------
export const experienciaSchema = z.object({
  experiencia: z.string().trim().max(2000).optional().default(""),
  horas_solo: z.number().min(0).max(24),
  todos_de_acuerdo: z.boolean(),
});

// ---------- Paso 4: motivación ----------
export const motivacionSchema = z.object({
  message: z.string().trim().max(4000).optional().default(""),
  aceptaRgpd: z.literal(true, { message: "rgpd_requerido" }),
});

// ---------- Cuestionario combinado (lo que viaja en `questionnaire`) ----------
export const cuestionarioSchema = viviendaSchema
  .and(hogarSchema)
  .and(experienciaSchema)
  .and(motivacionSchema);
export type Cuestionario = z.infer<typeof cuestionarioSchema>;

// ---------- Body de POST /api/solicitudes ----------
export const crearSolicitudSchema = z.object({
  animal_id: z.uuid(),
  questionnaire: cuestionarioSchema,
  message: z.string().trim().max(4000).optional(),
  // Honeypot: campo oculto que un humano nunca rellena.
  website: z.string().max(0).optional(),
});
export type CrearSolicitudInput = z.infer<typeof crearSolicitudSchema>;

// ---------- Body de PATCH /api/solicitudes/[id] ----------
export const accionSolicitudSchema = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("approve") }),
  z.object({ accion: z.literal("reject"), motivo: z.string().trim().min(1, "motivo_requerido") }),
  z.object({ accion: z.literal("complete") }),
]);
export type AccionSolicitud = z.infer<typeof accionSolicitudSchema>;

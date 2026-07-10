import { z } from "zod";

// ---------- CIF español ----------
// Letra de organización + 7 dígitos + carácter de control (dígito o letra).
const CIF_RE = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;
// Letras cuyo control es siempre una letra / siempre un dígito; el resto admite ambos.
const CONTROL_LETRA = "KPQSNW";
const CONTROL_DIGITO = "ABEH";

export function cifValido(input: string): boolean {
  const cif = input.trim().toUpperCase();
  if (!CIF_RE.test(cif)) return false;

  const letra = cif[0];
  const cuerpo = cif.slice(1, 8);
  const control = cif[8];

  let sumaPar = 0;
  let sumaImpar = 0;
  for (let i = 0; i < 7; i++) {
    const n = Number(cuerpo[i]);
    if ((i + 1) % 2 === 0) {
      sumaPar += n;
    } else {
      const doble = n * 2;
      sumaImpar += Math.floor(doble / 10) + (doble % 10);
    }
  }
  const total = sumaPar + sumaImpar;
  const digitoControl = (10 - (total % 10)) % 10;
  const letraControl = "JABCDEFGHI"[digitoControl];

  if (CONTROL_LETRA.includes(letra)) return control === letraControl;
  if (CONTROL_DIGITO.includes(letra)) return control === String(digitoControl);
  return control === String(digitoControl) || control === letraControl;
}

// Teléfono español: opcional +34/0034, móvil o fijo (6,7,8,9) + 8 dígitos.
const TELEFONO_ES_RE = /^(?:\+34|0034)?[6-9]\d{8}$/;
const telefonoEs = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => TELEFONO_ES_RE.test(v), { message: "telefono_invalido" });

const cif = z
  .string()
  .trim()
  .refine(cifValido, { message: "cif_invalido" });

// ---------- Paso 1: entidad ----------
export const entidadSchema = z.object({
  name: z.string().trim().min(1),
  cif,
  email: z.email(),
  phone: telefonoEs,
  website: z
    .union([z.url(), z.literal("")])
    .optional(),
});

// ---------- Paso 2: ubicación ----------
export const ubicacionSchema = z.object({
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  province: z.string().trim().min(1),
  postalCode: z.string().regex(/^\d{5}$/, { message: "cp_invalido" }),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ---------- Geocoding (cuerpo del endpoint) ----------
export const geocodeSchema = z.object({
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  province: z.string().trim().min(1),
  postalCode: z.string().regex(/^\d{5}$/, { message: "cp_invalido" }),
});
export type GeocodeInput = z.infer<typeof geocodeSchema>;

// ---------- Geocoding público del mapa (GET /api/geocode?q=ciudad) ----------
export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});
export type GeocodeQueryInput = z.infer<typeof geocodeQuerySchema>;

/** Normaliza una dirección para usarla como clave estable de caché. */
export function normalizeGeoQuery(p: GeocodeInput): string {
  return [p.address, p.postalCode, p.city, p.province, "España"]
    .join(", ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- Horarios de apertura ----------
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const hhmm = z.string().regex(HHMM_RE, { message: "hora_invalida" });

const franjaSchema = z
  .object({ open: hhmm, close: hhmm })
  .refine((f) => f.open < f.close, { message: "franja_invalida" });

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] as const;
export const openingHoursSchema = z
  .object(
    Object.fromEntries(DIAS.map((d) => [d, z.array(franjaSchema)])) as Record<
      (typeof DIAS)[number],
      z.ZodArray<typeof franjaSchema>
    >,
  )
  .partial();

// ---------- Redes sociales ----------
export const socialLinksSchema = z
  .object({
    instagram: z.url(),
    facebook: z.url(),
    x: z.url(),
    tiktok: z.url(),
  })
  .partial();

// ---------- Paso 3: perfil público ----------
export const perfilSchema = z.object({
  description: z.string().trim().max(2000).optional(),
  logoUrl: z.string().optional(),
  openingHours: openingHoursSchema,
  socialLinks: socialLinksSchema,
  acceptsVolunteers: z.boolean(),
  acceptsFostering: z.boolean(),
});

// ---------- Verificación por admin ----------
export const verificarSchema = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("verify") }),
  z.object({ accion: z.literal("reject"), motivo: z.string().trim().min(1) }),
]);
export type VerificarInput = z.infer<typeof verificarSchema>;

// ---------- Wizard completo ----------
export const shelterOnboardingSchema = entidadSchema
  .and(ubicacionSchema)
  .and(perfilSchema);

export type EntidadInput = z.infer<typeof entidadSchema>;
export type UbicacionInput = z.infer<typeof ubicacionSchema>;
export type PerfilInput = z.infer<typeof perfilSchema>;
export type OpeningHours = z.infer<typeof openingHoursSchema>;
export type SocialLinks = z.infer<typeof socialLinksSchema>;

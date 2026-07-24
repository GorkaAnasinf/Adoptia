import type { SocialLinks } from "@/lib/schemas/shelter";

export type ShelterForm = {
  name: string;
  cif: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  foundedYear?: number;
  donationLink?: string;
  socialLinks: SocialLinks;
  acceptsVolunteers: boolean;
  acceptsFostering: boolean;
};

function leDouble(hex: string): number {
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return new DataView(bytes.buffer).getFloat64(0, true);
}

/**
 * Decodifica la geografía `location` de un Point. Supabase la devuelve como
 * EWKB hexadecimal (little-endian, con SRID); también se acepta GeoJSON por si
 * cambia el formato. Devuelve { lat, lng } o null.
 */
export function parsePoint(loc: unknown): { lat: number; lng: number } | null {
  if (!loc) return null;
  // GeoJSON { type: "Point", coordinates: [lng, lat] }
  if (typeof loc === "object") {
    const coords = (loc as { coordinates?: unknown }).coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      const [lng, lat] = coords as number[];
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return null;
  }
  if (typeof loc !== "string" || loc.length < 42) return null;
  if (loc.slice(0, 2) !== "01") return null; // solo little-endian (lo que usa Supabase)
  // El flag de SRID (0x20000000) vive en el byte alto del dword de tipo (chars 8-10).
  const conSrid = (parseInt(loc.slice(8, 10), 16) & 0x20) !== 0;
  const off = 10 + (conSrid ? 8 : 0);
  const lng = leDouble(loc.slice(off, off + 16));
  const lat = leDouble(loc.slice(off + 16, off + 32));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Mapea una fila de `shelters` de vuelta al formulario del wizard (recupera borrador). */
export function shelterRowToForm(row: Record<string, unknown> | null): Partial<ShelterForm> {
  if (!row) return {};
  const punto = parsePoint(row.location);
  return {
    ...(punto ? { lat: punto.lat, lng: punto.lng } : {}),
    name: (row.name as string) ?? undefined,
    cif: (row.cif as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    website: (row.website as string) ?? undefined,
    address: (row.address as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    province: (row.province as string) ?? undefined,
    postalCode: (row.postal_code as string) ?? undefined,
    description: (row.description as string) ?? undefined,
    logoUrl: (row.logo_url as string) ?? undefined,
    coverUrl: (row.cover_url as string) ?? undefined,
    foundedYear: (row.founded_year as number) ?? undefined,
    donationLink: (row.donation_link as string) ?? undefined,
    socialLinks: (row.social_links as ShelterForm["socialLinks"]) ?? {},
    acceptsVolunteers: Boolean(row.accepts_volunteers),
    acceptsFostering: Boolean(row.accepts_fostering),
  };
}

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Mapea el formulario del wizard a una fila de `shelters` (columnas snake_case). */
export function formToShelterRow(
  form: Partial<ShelterForm>,
  ownerId: string,
  opts: { submit?: boolean } = {},
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    owner_id: ownerId,
    name: form.name,
    cif: form.cif,
    email: form.email,
    phone: form.phone,
    website: form.website || null,
    address: form.address,
    city: form.city,
    province: form.province,
    postal_code: form.postalCode,
    description: form.description ?? null,
    logo_url: form.logoUrl ?? null,
    cover_url: form.coverUrl ?? null,
    founded_year: form.foundedYear ?? null,
    donation_link: form.donationLink || null,
    social_links: form.socialLinks ?? null,
    accepts_volunteers: form.acceptsVolunteers ?? false,
    accepts_fostering: form.acceptsFostering ?? false,
  };

  if (form.name) row.slug = slugify(form.name);
  if (typeof form.lat === "number" && typeof form.lng === "number") {
    row.location = `POINT(${form.lng} ${form.lat})`;
  }
  if (opts.submit) row.submitted_at = new Date().toISOString();

  return row;
}

import type { OpeningHours, SocialLinks } from "@/lib/schemas/shelter";

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
  openingHours: OpeningHours;
  socialLinks: SocialLinks;
  acceptsVolunteers: boolean;
  acceptsFostering: boolean;
};

/** Mapea una fila de `shelters` de vuelta al formulario del wizard (recupera borrador). */
export function shelterRowToForm(row: Record<string, unknown> | null): Partial<ShelterForm> {
  if (!row) return {};
  return {
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
    openingHours: (row.opening_hours as ShelterForm["openingHours"]) ?? {},
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
    opening_hours: form.openingHours ?? null,
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

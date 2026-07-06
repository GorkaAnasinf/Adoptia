import { describe, expect, it } from "vitest";
import { formToShelterRow, slugify } from "./shelter-mapping";

describe("slugify", () => {
  it("normaliza acentos, mayúsculas y espacios", () => {
    expect(slugify("Refugio Esperanza")).toBe("refugio-esperanza");
    expect(slugify("Protectora Ñú & Gatos")).toBe("protectora-nu-gatos");
  });
});

describe("formToShelterRow", () => {
  const form = {
    name: "Refugio Esperanza",
    cif: "B98000003",
    email: "hola@refugio.org",
    phone: "600123456",
    website: "https://refugio.org",
    address: "Calle Mayor 1",
    city: "Bilbao",
    province: "Bizkaia",
    postalCode: "48001",
    lat: 43.263,
    lng: -2.935,
    description: "Somos un refugio",
    logoUrl: "https://cdn/logo.png",
    openingHours: { lun: [{ open: "10:00", close: "14:00" }] },
    socialLinks: { instagram: "https://instagram.com/refugio" },
    acceptsVolunteers: true,
    acceptsFostering: false,
  };

  it("mapea a columnas snake_case con owner y slug", () => {
    const row = formToShelterRow(form, "owner-1");
    expect(row.owner_id).toBe("owner-1");
    expect(row.slug).toBe("refugio-esperanza");
    expect(row.postal_code).toBe("48001");
    expect(row.logo_url).toBe("https://cdn/logo.png");
    expect(row.opening_hours).toEqual(form.openingHours);
    expect(row.social_links).toEqual(form.socialLinks);
    expect(row.accepts_volunteers).toBe(true);
  });

  it("codifica la ubicación como WKT de PostGIS (lng lat)", () => {
    const row = formToShelterRow(form, "owner-1");
    expect(row.location).toBe("POINT(-2.935 43.263)");
  });

  it("marca submitted_at cuando se envía a revisión", () => {
    const borrador = formToShelterRow(form, "owner-1", { submit: false });
    expect(borrador.submitted_at).toBeUndefined();
    const enviado = formToShelterRow(form, "owner-1", { submit: true });
    expect(enviado.submitted_at).not.toBeUndefined();
  });
});

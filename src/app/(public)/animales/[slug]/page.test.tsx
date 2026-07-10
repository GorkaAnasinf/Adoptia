import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const maybeSingleMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: maybeSingleMock })),
      })),
    })),
    rpc: rpcMock,
  })),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/animales/pipa-abc123",
}));

vi.mock("@/components/map/MiniMapa", () => ({
  MiniMapa: () => <div data-testid="mini-mapa" />,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
}));

import AnimalPage, { generateMetadata } from "./page";

const ANIMAL = {
  id: "a1",
  name: "Pipa",
  slug: "pipa-abc123",
  species: "dog",
  breed: "Mestiza",
  sex: "female",
  size: "small",
  birth_date_approx: "2024-06-01",
  weight_kg: 8,
  status: "available",
  description: "Una perrita muy cariñosa que busca familia.",
  good_with_kids: true,
  good_with_dogs: null,
  good_with_cats: false,
  apartment_suitable: true,
  energy_level: "medium",
  special_needs: null,
  vaccinated: true,
  sterilized: true,
  microchipped: false,
  health_notes: null,
  adoption_fee: 120,
  published_at: "2026-07-01T00:00:00Z",
  animal_media: [{ url: "https://example.com/pipa.jpg", is_cover: true, sort_order: 0 }],
  shelters: {
    name: "Protectora Bilbao",
    slug: "protectora-bilbao",
    city: "Bilbao",
    province: "Bizkaia",
    logo_url: null,
    location: null,
    status: "verified",
  },
};

async function renderFicha(slug = "pipa-abc123") {
  const ui = await AnimalPage({ params: Promise.resolve({ slug }) });
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Ficha pública del animal", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: [], error: null });
  });

  it("muestra nombre, historia, protectora y botón Me interesa", async () => {
    maybeSingleMock.mockResolvedValue({ data: ANIMAL, error: null });
    await renderFicha();
    expect(screen.getByRole("heading", { level: 1, name: "Pipa" })).toBeInTheDocument();
    expect(screen.getByText(/perrita muy cariñosa/)).toBeInTheDocument();
    expect(screen.getByText("Protectora Bilbao")).toBeInTheDocument();
    // CTA presente en la columna de acciones y en la barra sticky móvil
    expect(screen.getAllByRole("button", { name: "Me interesa" }).length).toBeGreaterThan(0);
  });

  it("incluye el enlace de compartir por WhatsApp con la URL de la ficha", async () => {
    maybeSingleMock.mockResolvedValue({ data: ANIMAL, error: null });
    await renderFicha();
    const enlace = screen.getAllByRole("link", { name: "Compartir por WhatsApp" })[0];
    expect(enlace).toHaveAttribute("href", expect.stringContaining("wa.me"));
    expect(enlace).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("/animales/pipa-abc123")),
    );
  });

  it("un animal reservado muestra aviso y NO tiene botón Me interesa", async () => {
    maybeSingleMock.mockResolvedValue({ data: { ...ANIMAL, status: "reserved" }, error: null });
    await renderFicha();
    expect(screen.getByText(/está reservado/)).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Me interesa" })).toHaveLength(0);
  });

  it("un animal adoptado muestra celebración y NO tiene botón Me interesa", async () => {
    maybeSingleMock.mockResolvedValue({ data: { ...ANIMAL, status: "adopted" }, error: null });
    await renderFicha();
    expect(screen.getByText(/ya ha encontrado hogar/)).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Me interesa" })).toHaveLength(0);
  });

  it("si no existe (o está despublicado) muestra página amable con sugerencias", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "s1",
          name: "Golfo",
          slug: "golfo-xyz",
          species: "dog",
          sex: "male",
          size: "large",
          birth_date_approx: null,
          status: "available",
          published_at: "2026-07-01T00:00:00Z",
          shelter_name: "Protectora Madrid",
          shelter_slug: "protectora-madrid",
          city: "Madrid",
          province: "Madrid",
          distance_m: null,
          cover_url: null,
          total_count: 1,
        },
      ],
      error: null,
    });
    await renderFicha("no-existe");
    expect(screen.getByText("Este peludo ya no está disponible")).toBeInTheDocument();
    expect(screen.getByText("Golfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todos los animales" })).toHaveAttribute(
      "href",
      "/animales",
    );
  });

  it("generateMetadata usa el nombre del animal", async () => {
    maybeSingleMock.mockResolvedValue({ data: ANIMAL, error: null });
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "pipa-abc123" }) });
    expect(meta.title).toBe("Pipa, en adopción");
  });
});

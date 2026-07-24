import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { type PublicAnimal, ShelterPublicProfile } from "./ShelterPublicProfile";

// Leaflet toca window: en tests lo sustituimos, como en el resto de fichas.
vi.mock("@/components/map/MiniMapa", () => ({
  MiniMapa: () => <div data-testid="mini-mapa" />,
}));

// El corazón de favorito usa router y Supabase en cliente.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const animales: PublicAnimal[] = [
  { id: "a1", name: "Luna", slug: "luna", status: "available", animal_media: [] },
];

describe("ShelterPublicProfile", () => {
  it("muestra nombre, ubicación, descripción y colaboración", () => {
    conIntl(
      <ShelterPublicProfile
        shelter={{
          name: "Refugio Esperanza",
          city: "Bilbao",
          province: "Bizkaia",
          description: "Somos un refugio de prueba.",
          accepts_volunteers: true,
          status: "verified",
        }}
        animals={animales}
      />,
    );
    expect(screen.getByRole("heading", { name: "Refugio Esperanza" })).toBeInTheDocument();
    expect(screen.getByText(/Bilbao, Bizkaia/)).toBeInTheDocument();
    expect(screen.getByText("Somos un refugio de prueba.")).toBeInTheDocument();
    expect(screen.getByText(messages.shelterPublic.volunteers)).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
  });

  it("sin animales muestra el mensaje vacío", () => {
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(screen.getByText(messages.shelterPublic.noAnimals)).toBeInTheDocument();
  });

  it("con necesidades abiertas muestra la sección «Necesitamos» con CTA de ayuda", () => {
    conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio" }}
        animals={[]}
        needs={[
          { id: "n1", categoria: "comida", descripcion: "Pienso de cachorro", urgencia: "urgente" },
        ]}
      />,
    );
    expect(screen.getByText(messages.necesidades.perfilTitulo)).toBeInTheDocument();
    expect(screen.getByText("Pienso de cachorro")).toBeInTheDocument();
    expect(screen.getByText(messages.necesidades.urgenteChip)).toBeInTheDocument();
    // Sin sesión: el CTA lleva a login
    expect(screen.getByRole("link", { name: messages.necesidades.ayudar })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("sin necesidades no hay sección", () => {
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} needs={[]} />);
    expect(screen.queryByText(messages.necesidades.perfilTitulo)).not.toBeInTheDocument();
  });
});

describe("ShelterPublicProfile — métricas (FEATURE-028)", () => {
  const HOY = new Date().getFullYear();

  it("muestra adopciones, animales y años de labor cuando hay datos", () => {
    conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio", founded_year: HOY - 8 }}
        animals={[]}
        stats={{ adopciones: 245, disponibles: 42 }}
      />,
    );
    expect(screen.getByText("245")).toBeInTheDocument();
    expect(screen.getByText(messages.shelterPublic.metricsAdoptions)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(messages.shelterPublic.metricsAnimals)).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(messages.shelterPublic.metricsYears)).toBeInTheDocument();
  });

  it("sin año de fundación no aparece el tile de años de labor", () => {
    conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio" }}
        animals={[]}
        stats={{ adopciones: 3, disponibles: 1 }}
      />,
    );
    expect(screen.queryByText(messages.shelterPublic.metricsYears)).not.toBeInTheDocument();
    expect(screen.getByText(messages.shelterPublic.metricsAdoptions)).toBeInTheDocument();
  });

  it("fundada este año no muestra «0 años»; sin ningún dato la franja no se pinta", () => {
    const { unmount } = conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio", founded_year: HOY }}
        animals={[]}
        stats={{ adopciones: 1, disponibles: 0 }}
      />,
    );
    expect(screen.queryByText(messages.shelterPublic.metricsYears)).not.toBeInTheDocument();
    unmount();
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(screen.queryByText(messages.shelterPublic.metricsAdoptions)).not.toBeInTheDocument();
  });
});

describe("ShelterPublicProfile — ubicación (FEATURE-028)", () => {
  // POINT(-2.935 43.263) en EWKB hex (como lo devuelve Supabase)
  const LOCATION = "0101000020E61000007B14AE47E17A07C08B6CE7FBA9A14540";

  it("muestra el mini-mapa y la dirección cuando hay location", () => {
    conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio", address: "Calle Esperanza 14", location: LOCATION }}
        animals={[]}
      />,
    );
    expect(screen.getByTestId("mini-mapa")).toBeInTheDocument();
    expect(screen.getByText(/calle esperanza 14/i)).toBeInTheDocument();
  });

  it("sin location ni dirección no se pinta la sección de ubicación", () => {
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(screen.queryByTestId("mini-mapa")).not.toBeInTheDocument();
    expect(screen.queryByText(messages.shelterPublic.locationTitle)).not.toBeInTheDocument();
  });
});

describe("ShelterPublicProfile — hero (FEATURE-028)", () => {
  it("muestra la foto de portada cuando existe", () => {
    conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio", cover_url: "https://cdn/cover.webp" }}
        animals={[]}
      />,
    );
    const img = screen.getByAltText(/portada de refugio/i);
    expect(img).toBeInTheDocument();
  });

  it("sin portada no hay imagen de portada (degradado de marca)", () => {
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(screen.queryByAltText(/portada/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Refugio" })).toBeInTheDocument();
  });

  it("sin logo, el avatar es la huella accesible con el nombre (IMPROVEMENT-024)", () => {
    const { unmount } = conIntl(
      <ShelterPublicProfile shelter={{ name: "Refugio Sin Logo" }} animals={[]} />,
    );
    expect(screen.getByRole("img", { name: "Refugio Sin Logo" })).toBeInTheDocument();
    unmount();
    conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio Con Logo", logo_url: "https://cdn/logo.png" }}
        animals={[]}
      />,
    );
    // Con logo, la imagen accesible es el propio logo (next/image con alt)
    expect(screen.getByRole("img", { name: "Refugio Con Logo" })).toBeInTheDocument();
  });

  it("el badge de verificada solo aparece con status verified", () => {
    const { unmount } = conIntl(
      <ShelterPublicProfile shelter={{ name: "Refugio", status: "verified" }} animals={[]} />,
    );
    expect(screen.getByText(messages.shelterPublic.verified)).toBeInTheDocument();
    unmount();
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio", status: "pending" }} animals={[]} />);
    expect(screen.queryByText(messages.shelterPublic.verified)).not.toBeInTheDocument();
  });

  it("Contactar es un mailto al email de la protectora; sin email no aparece", () => {
    const { unmount } = conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio", email: "hola@refugio.org" }}
        animals={[]}
      />,
    );
    const enlace = screen.getByRole("link", { name: messages.shelterPublic.contactCta });
    expect(enlace).toHaveAttribute("href", "mailto:hola@refugio.org");
    unmount();
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(
      screen.queryByRole("link", { name: messages.shelterPublic.contactCta }),
    ).not.toBeInTheDocument();
  });

  it("Donar solo aparece con enlace de donaciones", () => {
    const { unmount } = conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio", donation_link: "https://www.teaming.net/x" }}
        animals={[]}
      />,
    );
    expect(screen.getAllByText(messages.shelterPublic.donarCta).length).toBeGreaterThan(0);
    unmount();
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(screen.queryByText(messages.shelterPublic.donarCta)).not.toBeInTheDocument();
  });
});

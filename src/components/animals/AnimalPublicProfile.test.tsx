import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalPublicProfile, type PublicAnimalFull } from "./AnimalPublicProfile";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
    }),
  }),
}));

vi.mock("@/components/map/MiniMapa", () => ({
  MiniMapa: () => <div data-testid="mini-mapa" />,
}));

const BASE: PublicAnimalFull = {
  id: "a1",
  name: "Luna",
  slug: "luna-abc",
  species: "dog",
  breed: "Cruce de Galgo",
  sex: "female",
  size: "medium",
  birth_date_approx: "2024-01-01",
  weight_kg: 15,
  status: "available",
  description: "Luna fue rescatada de una zona industrial.",
  good_with_kids: true,
  good_with_dogs: true,
  good_with_cats: false,
  apartment_suitable: true,
  energy_level: "medium",
  special_needs: null,
  vaccinated: true,
  sterilized: true,
  microchipped: true,
  health_notes: "Perfecto estado de salud.",
  adoption_fee: null,
  media: [],
  shelter: {
    name: "Huellas Felices",
    slug: "huellas-felices",
    city: "Madrid",
    province: null,
    logo_url: null,
    lat: 40.4,
    lng: -3.7,
  },
};

function renderProfile(overrides: Partial<PublicAnimalFull> = {}, interesados = 0) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AnimalPublicProfile
        animal={{ ...BASE, ...overrides }}
        shareUrl="https://adoptia.es/animales/luna-abc"
        interesados={interesados}
      />
    </NextIntlClientProvider>,
  );
}

describe("AnimalPublicProfile", () => {
  it("muestra la tarjeta de acción con el nombre del animal", () => {
    renderProfile();
    expect(screen.getByRole("heading", { name: "Luna", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("¿Te has enamorado?")).toBeInTheDocument();
  });

  it("lista los cuatro pasos del proceso de adopción", () => {
    renderProfile();
    expect(screen.getByText("Proceso de adopción")).toBeInTheDocument();
    expect(screen.getByText("Solicitud inicial online")).toBeInTheDocument();
    expect(screen.getByText("Entrevista con el refugio")).toBeInTheDocument();
    expect(screen.getByText("Visita presencial")).toBeInTheDocument();
    expect(screen.getByText("Contrato y seguimiento")).toBeInTheDocument();
  });

  it("muestra el contador de interesados con plural correcto", () => {
    renderProfile({}, 3);
    expect(screen.getByText("3 personas interesadas")).toBeInTheDocument();
  });

  it("con un único interesado usa el singular", () => {
    renderProfile({}, 1);
    expect(screen.getByText("1 persona interesada")).toBeInTheDocument();
  });

  it("marca la compatibilidad positiva y negativa de forma distinguible", () => {
    renderProfile();
    // 'No gatos' se marca como incompatibilidad
    const gatos = screen.getByText("Bien con gatos").closest("[data-compat]");
    expect(gatos).toHaveAttribute("data-compat", "no");
    const ninos = screen.getByText("Bien con niños").closest("[data-compat]");
    expect(ninos).toHaveAttribute("data-compat", "si");
  });
});

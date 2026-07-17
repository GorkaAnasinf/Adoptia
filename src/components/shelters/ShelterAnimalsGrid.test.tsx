import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import type { PublicAnimal } from "./ShelterPublicProfile";
import { ShelterAnimalsGrid } from "./ShelterAnimalsGrid";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

function haceAnios(n: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - n);
  return d.toISOString().slice(0, 10);
}

function haceMeses(n: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString().slice(0, 10);
}

const animal = (extra: Partial<PublicAnimal> & { id: string; name: string }): PublicAnimal => ({
  slug: extra.name.toLowerCase(),
  status: "available",
  species: "dog",
  sex: "unknown",
  size: null,
  breed: null,
  birth_date_approx: null,
  published_at: new Date().toISOString(),
  animal_media: [],
  ...extra,
});

const ANIMALES: PublicAnimal[] = [
  animal({
    id: "a1",
    name: "Luna",
    breed: "Golden Retriever",
    birth_date_approx: haceAnios(2),
  }),
  animal({ id: "a2", name: "Toby", breed: "Mestizo", birth_date_approx: haceMeses(5) }),
  animal({
    id: "a3",
    name: "Bimba",
    species: "cat",
    breed: "Común europeo",
    birth_date_approx: haceAnios(3),
  }),
  animal({
    id: "a4",
    name: "Zeus",
    breed: "Gran Danés",
    birth_date_approx: haceAnios(4),
    sponsorable: true,
  }),
];

function renderGrid(animals: PublicAnimal[] = ANIMALES) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ShelterAnimalsGrid animals={animals} shelterName="Huellas de Esperanza" />
    </NextIntlClientProvider>,
  );
}

describe("ShelterAnimalsGrid", () => {
  it("muestra el contador y una tarjeta por animal con su raza", () => {
    renderGrid();
    expect(screen.getByText("(4)")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.getByText(/golden retriever/i)).toBeInTheDocument();
  });

  it("los apadrinables van primero en el orden por defecto", () => {
    renderGrid();
    const nombres = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent?.trim());
    expect(nombres?.[0]).toContain("Zeus");
  });

  it("el buscador filtra por nombre sin distinguir mayúsculas ni acentos", async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.type(screen.getByRole("searchbox"), "LÚNA");
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.queryByText("Toby")).not.toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument();
  });

  it("filtra por especie y por edad, combinables", async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.selectOptions(
      screen.getByLabelText(messages.busqueda.especie),
      "cat",
    );
    expect(screen.getByText("Bimba")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(messages.busqueda.edad), "cachorro");
    // Gato + cachorro: nadie encaja
    expect(screen.getByText(messages.shelterPublic.noAnimalsFiltered)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(messages.busqueda.especie), "");
    expect(screen.getByText("Toby")).toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument();
  });

  it("sin animales muestra el estado vacío general", () => {
    renderGrid([]);
    expect(screen.getByText(messages.shelterPublic.noAnimals)).toBeInTheDocument();
  });

  it("las tarjetas llevan corazón de favorito", () => {
    renderGrid();
    const tarjetas = screen.getAllByRole("link");
    expect(within(tarjetas[0].parentElement as HTMLElement).getAllByRole("button").length)
      .toBeGreaterThan(0);
  });
});

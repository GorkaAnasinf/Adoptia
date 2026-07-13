import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalCard, type AnimalSearchResult } from "./AnimalCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

const base: AnimalSearchResult = {
  id: "a1",
  name: "Pipa",
  slug: "pipa-abc123",
  species: "dog",
  sex: "female",
  size: "small",
  birth_date_approx: "2024-06-01",
  status: "available",
  published_at: "2026-07-01T00:00:00Z",
  shelter_name: "Protectora Bilbao",
  shelter_slug: "protectora-bilbao",
  city: "Bilbao",
  province: "Bizkaia",
  distance_m: null,
  cover_url: null,
  total_count: 1,
};

function renderCard(
  animal: Partial<AnimalSearchResult> = {},
  opciones: { conCta?: boolean; conFavorito?: boolean } = {},
) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AnimalCard animal={{ ...base, ...animal }} {...opciones} />
    </NextIntlClientProvider>,
  );
}

const hacedias = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

describe("AnimalCard", () => {
  it("enlaza a la ficha del animal por slug", () => {
    renderCard();
    const link = screen.getByRole("link", { name: /pipa/i });
    expect(link).toHaveAttribute("href", "/animales/pipa-abc123");
  });

  it("un animal reservado muestra el badge de reservado", () => {
    renderCard({ status: "reserved" });
    expect(screen.getByText("Reservado")).toBeInTheDocument();
  });

  it("un animal disponible no muestra badge de estado", () => {
    renderCard();
    expect(screen.queryByText("Reservado")).not.toBeInTheDocument();
  });

  it("muestra la distancia solo cuando hay ubicación (distance_m)", () => {
    renderCard({ distance_m: 12_300 });
    expect(screen.getByText(/a 12 km/)).toBeInTheDocument();
  });

  it("sin distance_m no muestra distancia", () => {
    renderCard();
    expect(screen.queryByText(/a \d+ km/)).not.toBeInTheDocument();
  });

  it("la foto lleva alt con el nombre; sin foto muestra placeholder accesible", () => {
    renderCard({ cover_url: "https://example.com/pipa.jpg" });
    expect(screen.getByRole("img", { name: "Pipa" })).toBeInTheDocument();
  });

  it("una cover_url inválida (sin http ni /) cae al placeholder sin romper", () => {
    renderCard({ cover_url: "a.jpg" });
    expect(screen.queryByRole("img", { name: "Pipa" })).not.toBeInTheDocument();
    expect(screen.getByText("Sin foto")).toBeInTheDocument();
  });

  it("muestra edad, tamaño, sexo (icono) y protectora", () => {
    renderCard();
    expect(screen.getByText(/Pequeño/)).toBeInTheDocument();
    expect(screen.getByLabelText("Hembra")).toBeInTheDocument();
    expect(screen.getByText("Protectora Bilbao")).toBeInTheDocument();
  });

  it("con conCta muestra el botón visual de Adoptar", () => {
    renderCard({}, { conCta: true });
    expect(screen.getByText(messages.busqueda.ctaAdoptar)).toBeInTheDocument();
  });

  it("sin conCta no muestra el botón de Adoptar", () => {
    renderCard();
    expect(screen.queryByText(messages.busqueda.ctaAdoptar)).not.toBeInTheDocument();
  });

  it("publicado hace menos de 14 días lleva el badge Recién llegado (también sin conCta)", () => {
    renderCard({ published_at: hacedias(2) });
    expect(screen.getByText(messages.busqueda.badgeNuevo)).toBeInTheDocument();
  });

  it("publicado hace más de 14 días no lleva badge", () => {
    renderCard({ published_at: hacedias(30) });
    expect(screen.queryByText(messages.busqueda.badgeNuevo)).not.toBeInTheDocument();
  });

  it("un animal reservado no muestra el badge de nuevo (prima el estado)", () => {
    renderCard({ status: "reserved", published_at: hacedias(2) });
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    expect(screen.queryByText(messages.busqueda.badgeNuevo)).not.toBeInTheDocument();
  });

  it("con conFavorito muestra el corazón y su clic no navega a la ficha", () => {
    renderCard({}, { conFavorito: true });
    const corazon = screen.getByRole("button", { name: messages.ficha.favGuardar });
    const clic = fireEvent.click(corazon);
    // El wrapper corta la propagación: el Link no recibe el clic (defaultPrevented)
    expect(clic).toBe(false);
  });

  it("sin conFavorito no hay corazón", () => {
    renderCard();
    expect(
      screen.queryByRole("button", { name: messages.ficha.favGuardar }),
    ).not.toBeInTheDocument();
  });
});

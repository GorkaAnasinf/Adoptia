import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalCard, type AnimalSearchResult } from "./AnimalCard";

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

function renderCard(animal: Partial<AnimalSearchResult> = {}, conCta = false) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AnimalCard animal={{ ...base, ...animal }} conCta={conCta} />
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
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Sin foto")).toBeInTheDocument();
  });

  it("muestra especie, edad aproximada y ciudad", () => {
    renderCard();
    expect(screen.getByText(/perro/i)).toBeInTheDocument();
    expect(screen.getByText(/Bilbao/)).toBeInTheDocument();
  });

  it("con conCta muestra el botón visual de Adoptar", () => {
    renderCard({}, true);
    expect(screen.getByText(messages.busqueda.ctaAdoptar)).toBeInTheDocument();
  });

  it("sin conCta no muestra Adoptar ni badge de recién llegado", () => {
    renderCard({ published_at: hacedias(2) });
    expect(screen.queryByText(messages.busqueda.ctaAdoptar)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.busqueda.badgeNuevo)).not.toBeInTheDocument();
  });

  it("con conCta y publicado hace menos de 14 días muestra el badge Recién llegado", () => {
    renderCard({ published_at: hacedias(2) }, true);
    expect(screen.getByText(messages.busqueda.badgeNuevo)).toBeInTheDocument();
  });

  it("con conCta pero publicado hace más de 14 días no lleva badge", () => {
    renderCard({ published_at: hacedias(30) }, true);
    expect(screen.queryByText(messages.busqueda.badgeNuevo)).not.toBeInTheDocument();
  });

  it("un animal reservado con conCta no muestra el badge de nuevo (prima el estado)", () => {
    renderCard({ status: "reserved", published_at: hacedias(2) }, true);
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    expect(screen.queryByText(messages.busqueda.badgeNuevo)).not.toBeInTheDocument();
  });
});

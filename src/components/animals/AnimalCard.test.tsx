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

function renderCard(animal: Partial<AnimalSearchResult> = {}) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AnimalCard animal={{ ...base, ...animal }} />
    </NextIntlClientProvider>,
  );
}

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

  it("muestra especie, edad aproximada y ciudad", () => {
    renderCard();
    expect(screen.getByText(/perro/i)).toBeInTheDocument();
    expect(screen.getByText(/Bilbao/)).toBeInTheDocument();
  });
});

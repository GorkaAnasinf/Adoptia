import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { ShelterDirectory, type ShelterDirectoryEntry } from "./ShelterDirectory";

const base: ShelterDirectoryEntry = {
  id: "s1",
  name: "Protectora Bilbao",
  slug: "protectora-bilbao",
  logo_url: "https://example.com/logo.jpg",
  city: "Bilbao",
  province: "Bizkaia",
  description: "Protectora con más de 20 años rescatando perros y gatos en Bizkaia.",
  available_count: 5,
};

function renderDirectory(shelters: ShelterDirectoryEntry[]) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ShelterDirectory shelters={shelters} />
    </NextIntlClientProvider>,
  );
}

describe("ShelterDirectory", () => {
  it("cada card enlaza al perfil público de la protectora por slug", () => {
    renderDirectory([base]);
    const link = screen.getByRole("link", { name: /protectora bilbao/i });
    expect(link).toHaveAttribute("href", "/protectoras/protectora-bilbao");
  });

  it("muestra nombre, ubicación y número de animales en adopción", () => {
    renderDirectory([base]);
    expect(screen.getByText("Protectora Bilbao")).toBeInTheDocument();
    expect(screen.getByText(/Bilbao, Bizkaia/)).toBeInTheDocument();
    expect(screen.getByText(/5 animales en adopción/i)).toBeInTheDocument();
  });

  it("con 0 disponibles muestra el texto de sin animales publicados", () => {
    renderDirectory([{ ...base, available_count: 0 }]);
    expect(screen.getByText(/sin animales publicados/i)).toBeInTheDocument();
  });

  it("el logo lleva alt con el nombre; sin logo muestra fallback accesible sin romper", () => {
    renderDirectory([
      base,
      { ...base, id: "s2", name: "Refugio Getxo", slug: "refugio-getxo", logo_url: null, description: null },
    ]);
    expect(screen.getByRole("img", { name: "Protectora Bilbao" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Refugio Getxo" })).not.toBeInTheDocument();
    expect(screen.getByText("Refugio Getxo")).toBeInTheDocument();
  });

  it("sin protectoras muestra el estado vacío con CTA a /animales", () => {
    renderDirectory([]);
    expect(screen.getByText(/todavía no hay protectoras/i)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /ver animales/i });
    expect(cta).toHaveAttribute("href", "/animales");
  });
});

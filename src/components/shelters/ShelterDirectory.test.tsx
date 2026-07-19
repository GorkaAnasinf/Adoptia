import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { ShelterDirectory, type ShelterDirectoryEntry } from "./ShelterDirectory";

const base: ShelterDirectoryEntry = {
  id: "s1",
  name: "Protectora Bilbao",
  slug: "protectora-bilbao",
  logo_url: "https://example.com/logo.jpg",
  cover_url: "https://example.com/cover.jpg",
  city: "Bilbao",
  province: "Bizkaia",
  description: "Protectora con más de 20 años rescatando perros y gatos en Bizkaia.",
  available_count: 5,
  adopted_count: 12,
};

function otra(cambios: Partial<ShelterDirectoryEntry>): ShelterDirectoryEntry {
  return { ...base, id: crypto.randomUUID(), slug: `slug-${Math.random()}`, ...cambios };
}

function renderDirectory(shelters: ShelterDirectoryEntry[]) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ShelterDirectory shelters={shelters} />
    </NextIntlClientProvider>,
  );
}

describe("ShelterDirectory", () => {
  it("la tarjeta muestra badge Verificada, contadores y CTA al perfil por slug", () => {
    renderDirectory([base]);
    expect(screen.getByText(messages.protectorasDir.verificada)).toBeInTheDocument();
    const tarjeta = screen.getByText("Protectora Bilbao").closest("article")!;
    expect(within(tarjeta).getByText("5")).toBeInTheDocument();
    expect(within(tarjeta).getByText(messages.protectorasDir.statsAnimales)).toBeInTheDocument();
    expect(within(tarjeta).getByText("12")).toBeInTheDocument();
    expect(within(tarjeta).getByText(messages.protectorasDir.statsAdopciones)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver perfil de Protectora Bilbao" }),
    ).toHaveAttribute("href", "/protectoras/protectora-bilbao");
  });

  it("sin cover no hay imagen rota: cabecera de respaldo y logo con alt", () => {
    renderDirectory([otra({ name: "Refugio Getxo", cover_url: null, logo_url: null })]);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Refugio Getxo")).toBeInTheDocument();
  });

  it("el buscador filtra por nombre, ciudad o provincia sin distinguir mayúsculas", () => {
    renderDirectory([
      base,
      otra({ name: "Refugio Getxo", city: "Getxo", province: "Bizkaia" }),
      otra({ name: "Santuario Sur", city: "Sevilla", province: "Sevilla" }),
    ]);
    const buscador = screen.getByRole("searchbox", {
      name: messages.protectorasDir.buscarLabel,
    });
    fireEvent.change(buscador, { target: { value: "sevil" } });
    expect(screen.getByText("Santuario Sur")).toBeInTheDocument();
    expect(screen.queryByText("Protectora Bilbao")).not.toBeInTheDocument();
    fireEvent.change(buscador, { target: { value: "GETXO" } });
    expect(screen.getByText("Refugio Getxo")).toBeInTheDocument();
    expect(screen.queryByText("Santuario Sur")).not.toBeInTheDocument();
  });

  it("búsqueda sin coincidencias: estado propio con limpiar que restaura la lista", () => {
    renderDirectory([base]);
    fireEvent.change(
      screen.getByRole("searchbox", { name: messages.protectorasDir.buscarLabel }),
      { target: { value: "no-existe-xyz" } },
    );
    expect(screen.getByText(messages.protectorasDir.vacioBusquedaTitulo)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: messages.protectorasDir.limpiarBusqueda }),
    );
    expect(screen.getByText("Protectora Bilbao")).toBeInTheDocument();
  });

  it("el chip Con animales en adopción deja fuera las protectoras sin disponibles", () => {
    renderDirectory([base, otra({ name: "Refugio Vacío", available_count: 0 })]);
    const chip = screen.getByRole("button", {
      name: messages.protectorasDir.chipConAnimales,
    });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Refugio Vacío")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: messages.protectorasDir.chipTodas }));
    expect(screen.getByText("Refugio Vacío")).toBeInTheDocument();
  });

  it("pagina de 12 en 12 con «Página X de N» y las flechas justas", () => {
    const muchas = Array.from({ length: 15 }, (_, i) => otra({ name: `Protectora ${i + 1}` }));
    renderDirectory(muchas);
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.protectorasDir.paginaAnterior }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: messages.protectorasDir.paginaSiguiente }),
    );
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(screen.getByText("Protectora 13")).toBeInTheDocument();
    expect(screen.queryByText("Protectora 1", { exact: true })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.protectorasDir.paginaSiguiente }),
    ).not.toBeInTheDocument();
  });

  it("cambiar la búsqueda vuelve a la página 1", () => {
    const muchas = Array.from({ length: 15 }, (_, i) => otra({ name: `Protectora ${i + 1}` }));
    renderDirectory(muchas);
    fireEvent.click(
      screen.getByRole("button", { name: messages.protectorasDir.paginaSiguiente }),
    );
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("searchbox", { name: messages.protectorasDir.buscarLabel }),
      { target: { value: "Protectora" } },
    );
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
  });

  it("sin protectoras muestra el estado vacío original con CTA a /animales", () => {
    renderDirectory([]);
    expect(screen.getByText(/todavía no hay protectoras/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver animales/i })).toHaveAttribute(
      "href",
      "/animales",
    );
  });
});

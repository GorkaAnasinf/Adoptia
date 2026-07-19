import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("./MapaAvisos", () => ({
  MapaAvisos: ({ avisos }: { avisos: unknown[] }) => (
    <div data-testid="mapa-avisos" data-count={avisos.length} />
  ),
}));

import { PerdidosView } from "./PerdidosView";
import type { AvisoMapa } from "./tipos";

const hace = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);

const SIN_DATOS = {
  breed: null,
  color: null,
  sex: null,
  has_collar: null,
  collar_description: null,
  has_microchip: null,
};

const AVISOS: AvisoMapa[] = [
  {
    ...SIN_DATOS,
    id: "p1",
    type: "lost",
    species: "dog",
    name: "Rocky",
    description: "Perdido en el parque",
    cover_url: null,
    city: "Bilbao",
    status: "open",
    size: "large",
    occurred_on: hace(2),
    lat: 43.264,
    lng: -2.934,
    created_at: "2026-07-01T00:00:00Z",
  },
  {
    ...SIN_DATOS,
    id: "p2",
    type: "found",
    species: "cat",
    name: null,
    description: "Gata encontrada",
    cover_url: null,
    city: "Getxo",
    status: "open",
    size: "small",
    occurred_on: hace(20),
    lat: 43.35,
    lng: -3.01,
    created_at: "2026-07-02T00:00:00Z",
  },
];

function renderVista(avisos = AVISOS) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PerdidosView avisos={avisos} />
    </NextIntlClientProvider>,
  );
}

/** Los selects viven tras «Más filtros» (FEATURE-025): hay que abrirlos. */
async function abrirMasFiltros(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: messages.perdidos.masFiltros }));
}

describe("PerdidosView", () => {
  it("muestra todos los avisos con distinción visual perdido/encontrado", () => {
    renderVista();
    expect(screen.getByRole("link", { name: "Rocky" })).toHaveAttribute(
      "href",
      "/perdidos-encontrados/p1",
    );
    expect(screen.getAllByText(messages.perdidos.tipoLost).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(messages.perdidos.tipoFound).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "2");
  });

  it("el filtro 'Perdidos' deja fuera los encontrados (mapa y lista)", async () => {
    const user = userEvent.setup();
    renderVista();
    await user.click(screen.getByRole("button", { name: messages.perdidos.filtroLost }));

    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "1");
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Getxo")).not.toBeInTheDocument();
  });

  it("sin avisos muestra el estado vacío", () => {
    renderVista([]);
    expect(screen.getByText(messages.perdidos.vacio)).toBeInTheDocument();
  });

  it("muestra el aviso de privacidad de la ubicación", () => {
    renderVista();
    expect(screen.getByText(messages.perdidos.avisoPrivacidad)).toBeInTheDocument();
  });

  // FEATURE-023 — filtros
  it("filtra por especie (mapa y lista a la vez)", async () => {
    const user = userEvent.setup();
    renderVista();
    await abrirMasFiltros(user);
    await user.selectOptions(
      screen.getByLabelText(messages.perdidos.filtroEspecie),
      "cat",
    );
    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "1");
    expect(screen.getByText("Getxo")).toBeInTheDocument();
    expect(screen.queryByText("Rocky")).not.toBeInTheDocument();
  });

  it("filtra por tamaño", async () => {
    const user = userEvent.setup();
    renderVista();
    await abrirMasFiltros(user);
    await user.selectOptions(screen.getByLabelText(messages.perdidos.filtroTamano), "large");
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Getxo")).not.toBeInTheDocument();
  });

  it("filtra por fecha del suceso, no por la de publicación", async () => {
    const user = userEvent.setup();
    renderVista();
    // p1 ocurrió hace 2 días, p2 hace 20 — pero ambos se publicaron en julio.
    await abrirMasFiltros(user);
    await user.selectOptions(screen.getByLabelText(messages.perdidos.filtroFecha), "7");
    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "1");
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Getxo")).not.toBeInTheDocument();
  });

  it("combina los filtros con el de perdido/encontrado", async () => {
    const user = userEvent.setup();
    renderVista();
    await user.click(screen.getByRole("button", { name: messages.perdidos.filtroLost }));
    await abrirMasFiltros(user);
    await user.selectOptions(screen.getByLabelText(messages.perdidos.filtroEspecie), "cat");
    // Perdido + gato: no hay ninguno.
    expect(screen.getByTestId("mapa-avisos")).toHaveAttribute("data-count", "0");
    expect(screen.getByText(messages.perdidos.vacioFiltros)).toBeInTheDocument();
  });

  it("distingue 'no hay avisos' de 'ninguno encaja con los filtros'", async () => {
    const user = userEvent.setup();
    const { rerender } = renderVista();
    await abrirMasFiltros(user);
    await user.selectOptions(screen.getByLabelText(messages.perdidos.filtroTamano), "medium");
    expect(screen.getByText(messages.perdidos.vacioFiltros)).toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="es" messages={messages}>
        <PerdidosView avisos={[]} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.perdidos.vacio)).toBeInTheDocument();
  });

  // FEATURE-038 — rediseño Stitch: badges con roles del design system, fecha
  // absoluta del suceso, tarjeta clicable entera y contador accesible.
  it("los badges usan granate para perdido y teal para encontrado", () => {
    renderVista();
    const lost = screen.getAllByText(messages.perdidos.tipoLost);
    const found = screen.getAllByText(messages.perdidos.tipoFound);
    expect(lost.some((b) => b.className.includes("bg-primary"))).toBe(true);
    expect(found.some((b) => b.className.includes("bg-secondary"))).toBe(true);
  });

  it("muestra la fecha del suceso en absoluto, no la de publicación", () => {
    renderVista();
    const fmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "long" });
    // p1 se publicó el 1 de julio, pero el suceso fue hace 2 días: manda el
    // suceso (la lección de FEATURE-023).
    expect(
      screen.getByText(`Perdido el ${fmt.format(new Date(hace(2)))}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Encontrado el ${fmt.format(new Date(hace(20)))}`),
    ).toBeInTheDocument();
  });

  it("la tarjeta entera es clicable: un único enlace extendido y sin «Ver detalles»", () => {
    renderVista();
    const enlace = screen.getByRole("link", { name: "Rocky" });
    expect(enlace).toHaveAttribute("href", "/perdidos-encontrados/p1");
    expect(enlace.className).toContain("after:absolute");
    const alaFicha = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href") === "/perdidos-encontrados/p1");
    expect(alaFicha).toHaveLength(1);
  });

  it("anuncia cuántos avisos quedan al filtrar (aria-live)", async () => {
    const user = userEvent.setup();
    renderVista();
    const contador = screen.getByText("2 avisos");
    expect(contador).toHaveAttribute("aria-live", "polite");
    await user.click(screen.getByRole("button", { name: messages.perdidos.filtroLost }));
    expect(screen.getByText("1 aviso")).toBeInTheDocument();
  });

  // FEATURE-025 — rediseño: filtros colapsados, tarjetas verticales, «Ver todos»
  it("los filtros avanzados están colapsados tras «Más filtros»", async () => {
    const user = userEvent.setup();
    renderVista();
    expect(screen.queryByLabelText(messages.perdidos.filtroEspecie)).not.toBeInTheDocument();

    const boton = screen.getByRole("button", { name: messages.perdidos.masFiltros });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    await user.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText(messages.perdidos.filtroEspecie)).toBeInTheDocument();
  });

  it("sin foto la tarjeta cae al placeholder, nunca imagen rota", () => {
    renderVista();
    expect(screen.getAllByText("🐾")).toHaveLength(2);
  });

  it("con más de 8 avisos, «Ver más avisos» despliega el resto", async () => {
    const user = userEvent.setup();
    const muchos = Array.from({ length: 10 }, (_, i) => ({
      ...AVISOS[0],
      id: `m${i}`,
      name: `Aviso ${i}`,
    }));
    renderVista(muchos);
    expect(screen.getAllByRole("listitem")).toHaveLength(8);

    await user.click(screen.getByRole("button", { name: messages.perdidos.verTodosAvisos }));
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
  });

  it("con 8 avisos o menos no hay botón «Ver todos»", () => {
    renderVista();
    expect(
      screen.queryByRole("button", { name: messages.perdidos.verTodosAvisos }),
    ).not.toBeInTheDocument();
  });
});

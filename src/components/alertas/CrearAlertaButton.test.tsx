import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import type { AnimalSearch } from "@/lib/animal-search";
import { CrearAlertaButton } from "./CrearAlertaButton";

const pushMock = vi.fn();
const getUserMock = vi.fn();
const insertMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({ insert: insertMock })),
  })),
}));

function search(over: Partial<AnimalSearch> = {}): AnimalSearch {
  return {
    q: undefined,
    especie: undefined,
    tamanos: [],
    sexos: [],
    edad: undefined,
    ninos: undefined,
    perros: undefined,
    gatos: undefined,
    distanciaKm: undefined,
    lat: undefined,
    lng: undefined,
    orden: "recientes",
    pagina: 1,
    ...over,
  };
}

function renderBoton(s: AnimalSearch, variant?: "bloque" | "compacto") {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <CrearAlertaButton search={s} variant={variant} />
    </NextIntlClientProvider>,
  );
}

describe("CrearAlertaButton", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    insertMock.mockReset().mockResolvedValue({ error: null });
  });

  afterEach(() => vi.restoreAllMocks());

  it("sin filtros guardables el botón está deshabilitado y no inserta", async () => {
    // Solo edad activa: no es un filtro que la alerta pueda guardar/casar.
    renderBoton(search({ edad: "cachorro" }), "compacto");
    const boton = screen.getByRole("button", { name: messages.busqueda.crearAlertaCorto });
    expect(boton).toBeDisabled();
    expect(screen.getByText(messages.busqueda.alertaSinFiltros)).toBeInTheDocument();
    await userEvent.click(boton);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("con filtros crea la alerta con los filtros y un nombre resumen", async () => {
    const user = userEvent.setup();
    renderBoton(
      search({ especie: "dog", tamanos: ["medium"], sexos: ["male"], lat: 40.4, lng: -3.7, distanciaKm: 30 }),
      "compacto",
    );
    const boton = screen.getByRole("button", { name: messages.busqueda.crearAlertaCorto });
    expect(boton).toBeEnabled();
    await user.click(boton);

    expect(insertMock).toHaveBeenCalledOnce();
    const fila = insertMock.mock.calls[0][0];
    expect(fila.filters).toEqual({
      especie: "dog",
      tamano: "medium",
      sexo: "male",
      lat: 40.4,
      lng: -3.7,
      radio_km: 30,
    });
    // Nombre resumen a partir de los filtros guardados.
    expect(fila.name).toContain("Perro");
    expect(fila.name).toContain("Mediano");
    expect(fila.name).toContain("Macho");
    expect(fila.name).toContain("30 km");
    expect(await screen.findByText(messages.busqueda.alertaCreada)).toBeInTheDocument();
  });

  it("guarda solo el primer tamaño/sexo cuando hay varios (formato de hoy)", async () => {
    const user = userEvent.setup();
    renderBoton(search({ especie: "cat", tamanos: ["small", "large"], sexos: ["female", "male"] }), "compacto");
    await user.click(screen.getByRole("button", { name: messages.busqueda.crearAlertaCorto }));
    const fila = insertMock.mock.calls[0][0];
    expect(fila.filters).toEqual({ especie: "cat", tamano: "small", sexo: "female" });
  });

  it("una alerta solo por distancia es válida", async () => {
    const user = userEvent.setup();
    renderBoton(search({ lat: 43.2, lng: -2.9, distanciaKm: 50 }), "compacto");
    const boton = screen.getByRole("button", { name: messages.busqueda.crearAlertaCorto });
    expect(boton).toBeEnabled();
    await user.click(boton);
    expect(insertMock.mock.calls[0][0].filters).toEqual({ lat: 43.2, lng: -2.9, radio_km: 50 });
  });

  it("sin sesión el clic lleva a /login y no inserta", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const user = userEvent.setup();
    renderBoton(search({ especie: "dog" }), "compacto");
    await user.click(screen.getByRole("button", { name: messages.busqueda.crearAlertaCorto }));
    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("con el tope de 5 alertas muestra el aviso de límite", async () => {
    insertMock.mockResolvedValue({ error: { message: "saved_searches_limit" } });
    const user = userEvent.setup();
    renderBoton(search({ especie: "dog" }), "compacto");
    await user.click(screen.getByRole("button", { name: messages.busqueda.crearAlertaCorto }));
    expect(await screen.findByText(messages.busqueda.alertaErrorLimite)).toBeInTheDocument();
  });
});

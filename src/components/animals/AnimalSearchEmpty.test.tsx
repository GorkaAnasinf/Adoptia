import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

const getUserMock = vi.fn();
const insertMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({ insert: insertMock })),
  })),
}));

import { AnimalSearchEmpty } from "./AnimalSearchEmpty";
import type { AnimalSearch } from "@/lib/animal-search";

const SEARCH: AnimalSearch = {
  q: undefined,
  especie: "dog",
  tamanos: [],
  sexos: [],
  edad: undefined,
  ninos: undefined,
  perros: undefined,
  gatos: undefined,
  distanciaKm: 50,
  lat: 43.26,
  lng: -2.94,
  orden: "recientes",
  pagina: 1,
};

function renderVacio() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AnimalSearchEmpty search={SEARCH} />
    </NextIntlClientProvider>,
  );
}

describe("AnimalSearchEmpty", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    insertMock.mockReset().mockResolvedValue({ error: null });
  });

  afterEach(() => vi.restoreAllMocks());

  it("muestra mensaje amable y CTA de crear alerta (FEATURE-010)", () => {
    renderVacio();
    expect(screen.getByText("No hay animales con esos filtros")).toBeInTheDocument();
    expect(
      screen.getByText("Prueba a ampliar la distancia o a quitar algún filtro."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.busqueda.crearAlerta }),
    ).toBeEnabled();
  });

  it("crea la alerta con los filtros de la URL", async () => {
    const user = userEvent.setup();
    renderVacio();
    await user.click(screen.getByRole("button", { name: messages.busqueda.crearAlerta }));

    expect(insertMock).toHaveBeenCalledOnce();
    const fila = insertMock.mock.calls[0][0];
    expect(fila.filters).toEqual({
      especie: "dog",
      lat: 43.26,
      lng: -2.94,
      radio_km: 50,
    });
    expect(await screen.findByText(messages.busqueda.alertaCreada)).toBeInTheDocument();
  });

  it("sin sesión el clic lleva a /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const user = userEvent.setup();
    renderVacio();
    await user.click(screen.getByRole("button", { name: messages.busqueda.crearAlerta }));
    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("con el tope de 5 alertas muestra el aviso de límite", async () => {
    insertMock.mockResolvedValue({ error: { message: "saved_searches_limit" } });
    const user = userEvent.setup();
    renderVacio();
    await user.click(screen.getByRole("button", { name: messages.busqueda.crearAlerta }));
    expect(await screen.findByText(messages.busqueda.alertaErrorLimite)).toBeInTheDocument();
  });
});

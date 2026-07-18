import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const maybeSingleMock = vi.fn();
const rpcMock = vi.fn();
const selectMocks: Record<string, import("vitest").Mock<(campos: unknown) => void>> = {};

// Builder encadenable: cualquier método devuelve el propio builder y es
// "thenable" para que `await` resuelva con { data }.
function builder(tabla: string) {
  const b: Record<string, unknown> = {};
  for (const m of ["select", "eq", "not", "order"]) {
    b[m] = vi.fn((...args: unknown[]) => {
      if (m === "select") selectMocks[tabla]?.(args[0]);
      return b;
    });
  }
  b.maybeSingle = maybeSingleMock;
  b.then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: tabla === "animals" ? [] : [] });
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    from: vi.fn((tabla: string) => builder(tabla)),
    rpc: rpcMock,
  })),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
}));

vi.mock("@/components/map/MiniMapa", () => ({
  MiniMapa: () => <div data-testid="mini-mapa" />,
}));

import ProtectoraPublicaPage from "./page";

const SHELTER = {
  id: "s1",
  name: "Huellas de Esperanza",
  slug: "huellas",
  status: "verified",
  city: "Bilbao",
  email: "hola@huellas.org",
  cover_url: "https://cdn/cover.webp",
  founded_year: new Date().getFullYear() - 8,
};

async function renderPagina() {
  const ui = await ProtectoraPublicaPage({ params: Promise.resolve({ slug: "huellas" }) });
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Página pública de protectora (FEATURE-028)", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: SHELTER });
    rpcMock.mockReset().mockResolvedValue({ data: [{ adopciones: 245, disponibles: 42 }] });
    selectMocks.shelters = vi.fn();
    selectMocks.animals = vi.fn();
  });

  it("pide los campos nuevos del perfil (email, portada, año, dirección, location)", async () => {
    await renderPagina();
    const campos = String(selectMocks.shelters?.mock.calls[0]?.[0]);
    for (const campo of ["email", "cover_url", "founded_year", "address", "location"]) {
      expect(campos).toContain(campo);
    }
  });

  it("pide los datos de tarjeta de los animales (raza, nacimiento, especie)", async () => {
    await renderPagina();
    const campos = String(selectMocks.animals?.mock.calls[0]?.[0]);
    for (const campo of ["breed", "birth_date_approx", "species", "sex", "published_at"]) {
      expect(campos).toContain(campo);
    }
  });

  it("llama al RPC de métricas con el id de la protectora y las pinta", async () => {
    await renderPagina();
    expect(rpcMock).toHaveBeenCalledWith("shelter_public_stats", { p_shelter_id: "s1" });
    expect(screen.getByText("245")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("si el RPC no devuelve datos, la página no revienta (sin métricas de conteo)", async () => {
    rpcMock.mockResolvedValue({ data: [] });
    await renderPagina();
    expect(
      screen.queryByText(messages.shelterPublic.metricsAdoptions),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Huellas de Esperanza" })).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";

const { state, buscarCiudadMock, rpcMock } = vi.hoisted(() => ({
  state: {
    user: null as { id: string } | null,
    filas: [] as Record<string, unknown>[],
  },
  buscarCiudadMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/lib/geocode-ciudad", () => ({ buscarCiudad: buscarCiudadMock }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
    rpc: rpcMock,
    from: () => ({
      select: () => ({
        order: () => ({ order: async () => ({ data: state.filas }) }),
      }),
    }),
  })),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
}));

import NecesidadesPage from "./page";

const FILA = {
  id: "n1",
  categoria: "comida",
  descripcion: "Pienso de cachorro",
  urgencia: "urgente",
  created_at: "2026-07-18T09:00:00Z",
  shelters: { name: "Protectora Murcia", slug: "protectora-murcia", city: "Murcia" },
};

async function renderPagina(params: Record<string, string> = {}) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await NecesidadesPage({ searchParams: Promise.resolve(params) })}
    </NextIntlClientProvider>,
  );
}

describe("Tablón público de necesidades", () => {
  beforeEach(() => {
    state.user = null;
    state.filas = [FILA];
    buscarCiudadMock.mockReset().mockResolvedValue({ lat: 37.98, lng: -1.13 });
    rpcMock.mockReset().mockResolvedValue({ data: [], error: null });
  });

  it("lista necesidades con categoría, urgencia, protectora y CTA de ayuda (login sin sesión)", async () => {
    await renderPagina();
    expect(screen.getByText("Pienso de cachorro")).toBeInTheDocument();
    expect(screen.getByText(messages.necesidades.urgenteChip)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Protectora Murcia" })).toHaveAttribute(
      "href",
      "/protectoras/protectora-murcia",
    );
    expect(screen.getByRole("link", { name: messages.necesidades.ayudar })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("filtra por categoría en memoria", async () => {
    state.filas = [FILA, { ...FILA, id: "n2", categoria: "transporte", descripcion: "Viaje a Madrid" }];
    await renderPagina({ categoria: "transporte" });
    expect(screen.getByText("Viaje a Madrid")).toBeInTheDocument();
    expect(screen.queryByText("Pienso de cachorro")).not.toBeInTheDocument();
  });

  it("con ciudad usa el RPC de proximidad y muestra la distancia", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "n1",
          categoria: "comida",
          descripcion: "Pienso de cachorro",
          urgencia: "normal",
          created_at: "2026-07-18T09:00:00Z",
          shelter_name: "Protectora Murcia",
          shelter_slug: "protectora-murcia",
          shelter_city: "Murcia",
          distance_km: 3.2,
        },
      ],
      error: null,
    });
    await renderPagina({ ciudad: "Murcia" });
    expect(buscarCiudadMock).toHaveBeenCalledWith("Murcia");
    expect(rpcMock).toHaveBeenCalledWith("shelter_needs_nearby", {
      p_lat: 37.98,
      p_lng: -1.13,
      p_radius_km: 50,
    });
    expect(screen.getByText(/a 3.2 km/)).toBeInTheDocument();
  });

  it("vacío: estado cuidado", async () => {
    state.filas = [];
    await renderPagina();
    expect(screen.getByText(messages.necesidades.tablonEmpty)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const { state } = vi.hoisted(() => ({
  state: {
    shelter: { id: "s1", status: "verified" } as Record<string, unknown> | null,
    ofertas: [] as Record<string, unknown>[],
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }) }),
    })),
    rpc: vi.fn(async () => ({ data: state.ofertas })),
  })),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
  getFormatter: vi.fn(async () => {
    const { createFormatter } = await import("next-intl");
    return createFormatter({ locale: "es" });
  }),
}));

import DonacionesPanelPage from "./page";

const OFERTA = {
  id: "d1",
  full_name: "Dani Donante",
  categoria: "comida",
  descripcion: "Dos sacos de pienso sin abrir",
  city: "Bilbao",
  distance_km: 3.2,
  created_at: "2026-07-18T09:00:00Z",
};

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await DonacionesPanelPage()}
    </NextIntlClientProvider>,
  );
}

describe("Tablón de donaciones del panel", () => {
  beforeEach(() => {
    state.shelter = { id: "s1", status: "verified" };
    state.ofertas = [];
  });

  it("verificada sin ofertas: estado vacío cuidado", async () => {
    await renderPagina();
    expect(screen.getByText(messages.donaciones.tablonEmpty)).toBeInTheDocument();
  });

  it("lista ofertas con donante, distancia y botón de contactar", async () => {
    state.ofertas = [OFERTA, { ...OFERTA, id: "d2", full_name: null, descripcion: "Mantas" }];
    await renderPagina();
    expect(screen.getByText("Dos sacos de pienso sin abrir")).toBeInTheDocument();
    expect(screen.getByText(/Dani Donante/)).toBeInTheDocument();
    expect(screen.getByText(messages.donaciones.donanteAnonimo)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: messages.donaciones.contactar }),
    ).toHaveLength(2);
  });

  it("sin verificar: aviso y sin tablón", async () => {
    state.shelter = { id: "s1", status: "pending" };
    await renderPagina();
    expect(screen.getByText(messages.donaciones.panelSoloVerificadas)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.donaciones.contactar }),
    ).not.toBeInTheDocument();
  });
});

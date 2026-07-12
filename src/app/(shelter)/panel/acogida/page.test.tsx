import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const { state } = vi.hoisted(() => ({
  state: {
    shelter: { id: "s1", status: "verified" } as Record<string, unknown> | null,
    acogedores: [] as Record<string, unknown>[],
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
    rpc: vi.fn(async () => ({ data: state.acogedores, error: null })),
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }) }),
    })),
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

import AcogidaPanelPage from "./page";

const ACOGEDOR = {
  user_id: "u9",
  full_name: "Ane Acogedora",
  city: "Bilbao",
  distance_km: 4.2,
  radius_km: 25,
  condiciones: { especies: ["dog", "cat"], vivienda: "casa", jardin: true, notas: "Mejor findes" },
  created_at: "2026-07-10T10:00:00Z",
};

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await AcogidaPanelPage()}
    </NextIntlClientProvider>,
  );
}

describe("Panel de casas de acogida", () => {
  beforeEach(() => {
    state.shelter = { id: "s1", status: "verified" };
    state.acogedores = [ACOGEDOR];
  });

  it("lista acogedores con condiciones, distancia y botón de contactar", async () => {
    await renderPagina();
    expect(screen.getByText("Ane Acogedora")).toBeInTheDocument();
    expect(screen.getByText(/a 4.2 km/)).toBeInTheDocument();
    expect(screen.getByText(messages.acogida.jardin)).toBeInTheDocument();
    expect(screen.getByText(/Mejor findes/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.acogida.contactar })).toBeInTheDocument();
  });

  it("una protectora sin verificar ve el aviso, no la lista", async () => {
    state.shelter = { id: "s1", status: "pending" };
    await renderPagina();
    expect(screen.getByText(messages.acogida.panelSoloVerificadas)).toBeInTheDocument();
  });

  it("sin acogedores muestra el estado vacío", async () => {
    state.acogedores = [];
    await renderPagina();
    expect(screen.getByText(messages.acogida.panelEmpty)).toBeInTheDocument();
  });
});

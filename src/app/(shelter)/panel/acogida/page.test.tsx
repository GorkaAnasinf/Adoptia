import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const { state } = vi.hoisted(() => ({
  state: {
    shelter: { id: "s1", status: "verified" } as Record<string, unknown> | null,
    acogedores: [] as Record<string, unknown>[],
    animales: [] as Record<string, unknown>[],
    propuestas: [] as Record<string, unknown>[],
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
    rpc: vi.fn(async () => ({ data: state.acogedores, error: null })),
    from: vi.fn((tabla: string) => {
      if (tabla === "animals") {
        return {
          select: () => ({
            eq: () => ({
              not: () => ({ order: async () => ({ data: state.animales }) }),
            }),
          }),
        };
      }
      if (tabla === "foster_proposals") {
        return {
          select: () => ({
            eq: () => ({ order: async () => ({ data: state.propuestas }) }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }) }),
      };
    }),
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

const PROPUESTA = {
  id: "p1",
  foster_user_id: "u9",
  duracion: "2 semanas",
  mensaje: "Camada de cachorros",
  status: "enviada",
  created_at: "2026-07-15T10:00:00Z",
  animals: { name: "Trufa" },
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
    state.animales = [{ id: "a1", name: "Trufa" }];
    state.propuestas = [];
  });

  it("lista acogedores con condiciones, distancia y botón de proponer", async () => {
    await renderPagina();
    expect(screen.getByText("Ane Acogedora")).toBeInTheDocument();
    expect(screen.getByText(/a 4.2 km/)).toBeInTheDocument();
    expect(screen.getByText(messages.acogida.jardin)).toBeInTheDocument();
    expect(screen.getByText(/Mejor findes/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.acogida.contactar })).toBeInTheDocument();
    // Sin propuestas: el historial muestra su estado vacío
    expect(screen.getByText(messages.acogida.historialEmpty)).toBeInTheDocument();
  });

  it("con propuesta activa muestra el estado en vez del botón de proponer", async () => {
    state.propuestas = [PROPUESTA];
    await renderPagina();
    expect(
      screen.queryByRole("button", { name: messages.acogida.contactar }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Propuesta enviada el/)).toBeInTheDocument();
  });

  it("el historial lista las propuestas con animal, duración, estado y acciones", async () => {
    state.propuestas = [PROPUESTA];
    await renderPagina();
    expect(screen.getByText(messages.acogida.historialTitulo)).toBeInTheDocument();
    expect(screen.getByText(/Trufa/)).toBeInTheDocument();
    expect(screen.getByText(/2 semanas/)).toBeInTheDocument();
    // El chip de estado sale en la tarjeta del acogedor Y en el historial
    expect(screen.getAllByText(messages.acogida.estadoPropuestaEnviada)).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: messages.acogida.marcarAceptada }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.acogida.marcarRechazada }),
    ).toBeInTheDocument();
  });

  it("con relevo pedido muestra el aviso con fecha y motivo", async () => {
    state.propuestas = [
      {
        ...PROPUESTA,
        status: "aceptada",
        relevo_pedido_at: "2026-07-17T10:00:00Z",
        relevo_motivo: "Obras en casa",
        relevo_fecha_limite: "2026-08-01",
      },
    ];
    await renderPagina();
    expect(screen.getAllByText(/2026-08-01/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Obras en casa/)).toBeInTheDocument();
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

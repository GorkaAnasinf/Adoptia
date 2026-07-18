import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const { state } = vi.hoisted(() => ({
  state: {
    shelter: { id: "s1", status: "verified" } as Record<string, unknown> | null,
    necesidades: [] as Record<string, unknown>[],
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      insert: async () => ({ error: null }),
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
    from: vi.fn((tabla: string) => {
      if (tabla === "shelter_needs") {
        return {
          select: () => ({
            eq: () => ({ order: async () => ({ data: state.necesidades }) }),
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
}));

import NecesidadesPanelPage from "./page";

const NECESIDAD = {
  id: "n1",
  categoria: "comida",
  descripcion: "Pienso de cachorro",
  urgencia: "urgente",
  status: "abierta",
  created_at: "2026-07-18T09:00:00Z",
};

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await NecesidadesPanelPage()}
    </NextIntlClientProvider>,
  );
}

describe("Panel de necesidades", () => {
  beforeEach(() => {
    state.shelter = { id: "s1", status: "verified" };
    state.necesidades = [];
  });

  it("verificada: formulario de alta y estados vacíos cuidados", async () => {
    await renderPagina();
    expect(screen.getByRole("button", { name: messages.necesidades.publicar })).toBeInTheDocument();
    expect(screen.getByText(messages.necesidades.panelEmpty)).toBeInTheDocument();
    expect(screen.getByText(messages.necesidades.historialEmpty)).toBeInTheDocument();
  });

  it("lista abiertas con urgencia y acciones; cubiertas con reabrir", async () => {
    state.necesidades = [
      NECESIDAD,
      { ...NECESIDAD, id: "n2", descripcion: "Mantas viejas", urgencia: "normal", status: "cubierta" },
    ];
    await renderPagina();
    expect(screen.getByText("Pienso de cachorro")).toBeInTheDocument();
    expect(screen.getByText(messages.necesidades.urgenteChip)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.necesidades.cubrir })).toBeInTheDocument();
    expect(screen.getByText("Mantas viejas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.necesidades.reabrir })).toBeInTheDocument();
  });

  it("sin verificar: aviso y sin formulario", async () => {
    state.shelter = { id: "s1", status: "pending" };
    await renderPagina();
    expect(screen.getByText(messages.necesidades.panelSoloVerificadas)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.necesidades.publicar }),
    ).not.toBeInTheDocument();
  });
});

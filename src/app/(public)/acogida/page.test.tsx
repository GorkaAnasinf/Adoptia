import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";

const { state } = vi.hoisted(() => ({
  state: {
    user: null as { id: string } | null,
    fosterHome: null as Record<string, unknown> | null,
    propuestas: [] as Record<string, unknown>[],
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/components/shelters/MapPinPicker", () => ({
  MapPinPicker: () => <div data-testid="pin" />,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
    from: vi.fn((tabla: string) => {
      if (tabla === "foster_proposals") {
        return {
          select: () => ({
            eq: () => ({ order: async () => ({ data: state.propuestas }) }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.fosterHome }) }) }),
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

import AcogidaPage from "./page";

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await AcogidaPage()}
    </NextIntlClientProvider>,
  );
}

describe("Página pública de acogida", () => {
  beforeEach(() => {
    state.user = null;
    state.fosterHome = null;
    state.propuestas = [];
  });

  it("sin sesión invita a iniciar sesión y no muestra propuestas", async () => {
    await renderPagina();
    expect(screen.getByText(messages.acogida.loginNecesario)).toBeInTheDocument();
    expect(screen.queryByText(messages.acogida.recibidasTitulo)).not.toBeInTheDocument();
  });

  it("acogedor registrado ve sus propuestas recibidas", async () => {
    state.user = { id: "u1" };
    state.fosterHome = {
      user_id: "u1",
      city: "Bilbao",
      radius_km: 25,
      condiciones: { especies: ["dog"] },
      active: true,
    };
    state.propuestas = [
      {
        id: "p1",
        duracion: "2 semanas",
        mensaje: "Camada de cachorros",
        status: "enviada",
        created_at: "2026-07-15T10:00:00Z",
        shelters: { name: "Protectora Bilbao" },
        animals: { name: "Trufa" },
      },
    ];
    await renderPagina();
    expect(screen.getByText(messages.acogida.recibidasTitulo)).toBeInTheDocument();
    expect(screen.getByText(/Protectora Bilbao/)).toBeInTheDocument();
  });

  it("usuario con sesión pero sin registro: formulario de alta sin bloque de propuestas", async () => {
    state.user = { id: "u1" };
    await renderPagina();
    expect(screen.getByRole("button", { name: messages.acogida.registrar })).toBeInTheDocument();
    expect(screen.queryByText(messages.acogida.recibidasTitulo)).not.toBeInTheDocument();
  });
});

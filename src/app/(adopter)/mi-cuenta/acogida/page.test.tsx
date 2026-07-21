import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const { state } = vi.hoisted(() => ({
  state: {
    user: { id: "u1" } as { id: string } | null,
    fosterHome: null as Record<string, unknown> | null,
    propuestas: [] as Record<string, unknown>[],
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  redirect: vi.fn((destino: string) => {
    throw new Error(`REDIRECT:${destino}`);
  }),
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

import MiAcogidaPage from "./page";

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await MiAcogidaPage()}
    </NextIntlClientProvider>,
  );
}

describe("Mi cuenta — Acogidas", () => {
  beforeEach(() => {
    state.user = { id: "u1" };
    state.fosterHome = null;
    state.propuestas = [];
  });

  it("sin sesión redirige a /login", async () => {
    state.user = null;
    await expect(MiAcogidaPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("sin registro arranca en la pestaña de registro con el formulario de alta", async () => {
    await renderPagina();
    expect(screen.getByRole("tab", { name: messages.acogida.tabRegistro })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: messages.acogida.registrar })).toBeInTheDocument();
    expect(screen.queryByText(messages.acogida.yaRegistradoTitle)).not.toBeInTheDocument();
  });

  it("con registro, la pestaña 'Mi registro' muestra el estado y la gestión (pausar / baja)", async () => {
    state.fosterHome = {
      user_id: "u1",
      city: "Bilbao",
      radius_km: 25,
      condiciones: { especies: ["dog"], vivienda: "casa", jardin: true },
      active: true,
    };
    await renderPagina();
    await userEvent.click(screen.getByRole("tab", { name: messages.acogida.tabRegistro }));
    expect(screen.getByText(messages.acogida.estadoActivo)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.acogida.pausar })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.acogida.baja })).toBeInTheDocument();
  });

  it("con registro arranca en 'Propuestas' con la lista recibida", async () => {
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
        shelters: { name: "Protectora Bilbao", slug: "protectora-bilbao" },
        animals: { name: "Trufa" },
      },
    ];
    await renderPagina();
    expect(screen.getByText(/Protectora Bilbao/)).toBeInTheDocument();
    expect(screen.getByText(/Trufa/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.acogida.contactarRefugio }),
    ).toHaveAttribute("href", "/protectoras/protectora-bilbao");
  });

  it("sin registro, la pestaña de propuestas invita a registrarse", async () => {
    await renderPagina();
    await userEvent.click(screen.getByRole("tab", { name: messages.acogida.tabPropuestas }));
    expect(screen.getByText(messages.acogida.propuestasSinRegistro)).toBeInTheDocument();
  });
});

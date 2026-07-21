import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const { state } = vi.hoisted(() => ({
  state: {
    user: { id: "u1" } as Record<string, unknown> | null,
    ofertas: [] as Record<string, unknown>[],
  },
}));

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error("REDIRECT");
  },
}));

vi.mock("@/components/shelters/MapPinPicker", () => ({
  MapPinPicker: () => <div data-testid="pin" />,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      insert: async () => ({ error: null }),
      update: () => ({ eq: async () => ({ error: null }) }),
      delete: () => ({ eq: async () => ({ error: null }) }),
    }),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
    from: vi.fn(() => ({
      select: () => ({ order: async () => ({ data: state.ofertas }) }),
    })),
  })),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
}));

import DonacionesPage from "./page";

const OFERTA = {
  id: "d1",
  categoria: "comida",
  descripcion: "Dos sacos de pienso",
  city: "Bilbao",
  radius_km: 25,
  status: "abierta",
  renovada_at: "2026-07-18T09:00:00Z",
  created_at: "2026-07-18T09:00:00Z",
};

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await DonacionesPage()}
    </NextIntlClientProvider>,
  );
}

describe("Mis donaciones", () => {
  beforeEach(() => {
    state.user = { id: "u1" };
    state.ofertas = [];
    redirectMock.mockClear();
  });

  it("sin sesión redirige a login", async () => {
    state.user = null;
    await expect(renderPagina()).rejects.toThrow("REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("sin ofertas: arranca en Publicar; la pestaña de lista muestra el vacío", async () => {
    await renderPagina();
    expect(screen.getByRole("button", { name: messages.donaciones.publicar })).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("tab", { name: messages.donaciones.tabMisDonaciones }),
    );
    expect(screen.getByText(messages.donaciones.miEmpty)).toBeInTheDocument();
  });

  it("lista las ofertas con estado y acciones según su status", async () => {
    state.ofertas = [
      OFERTA,
      { ...OFERTA, id: "d2", descripcion: "Transportín", status: "caducada" },
      { ...OFERTA, id: "d3", descripcion: "Mantas", status: "entregada" },
    ];
    await renderPagina();
    expect(screen.getByText("Dos sacos de pienso")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.donaciones.entregar })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.donaciones.renovar })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: messages.donaciones.borrar })).toHaveLength(3);
    expect(screen.getByText(messages.donaciones.caducaInfo)).toBeInTheDocument();
  });
});

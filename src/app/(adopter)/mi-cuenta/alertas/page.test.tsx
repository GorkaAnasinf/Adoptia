import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const getUserMock = vi.fn();
const orderMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order: orderMock })),
    })),
  })),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  useRouter: () => ({ refresh: vi.fn() }),
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

import AlertasPage from "./page";

const ALERTA = {
  id: "al1",
  name: "Perro",
  filters: { especie: "dog", radio_km: 50 },
  active: true,
  created_at: "2026-07-01T00:00:00Z",
};

async function renderPagina() {
  const ui = await AlertasPage();
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Mis alertas (adoptante)", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    orderMock.mockReset().mockResolvedValue({ data: [ALERTA], error: null });
  });

  it("sin sesión redirige a /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(AlertasPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("lista la alerta con resumen de filtros, estado y acciones", async () => {
    await renderPagina();
    expect(screen.getByText("Perro")).toBeInTheDocument();
    expect(screen.getByText(/a 50 km/)).toBeInTheDocument();
    expect(screen.getByText(messages.account.alertaActiva)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.account.alertaPausar })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.account.alertaBorrar })).toBeInTheDocument();
  });

  it("una alerta pausada ofrece reactivar", async () => {
    orderMock.mockResolvedValue({ data: [{ ...ALERTA, active: false }], error: null });
    await renderPagina();
    expect(screen.getByText(messages.account.alertaPausada)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.account.alertaActivar }),
    ).toBeInTheDocument();
  });

  it("con 5 alertas avisa del tope", async () => {
    orderMock.mockResolvedValue({
      data: Array.from({ length: 5 }, (_, i) => ({ ...ALERTA, id: `al${i}` })),
      error: null,
    });
    await renderPagina();
    expect(screen.getByText(messages.account.alertaLimite)).toBeInTheDocument();
  });

  it("sin alertas muestra estado vacío", async () => {
    orderMock.mockResolvedValue({ data: [], error: null });
    await renderPagina();
    expect(screen.getByText(messages.account.alertasEmptyTitle)).toBeInTheDocument();
  });
});

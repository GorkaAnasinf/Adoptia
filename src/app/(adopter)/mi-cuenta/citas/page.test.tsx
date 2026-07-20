import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const { getUserMock, orderMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  orderMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({ select: vi.fn(() => ({ order: orderMock })) })),
  })),
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

import MisCitasPage from "./page";

const futura = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

const CITA = {
  id: "c1",
  status: "confirmed",
  starts_at: futura,
  cancel_reason: null,
  adoption_requests: {
    animals: {
      name: "Pipa",
      slug: "pipa",
      animal_media: [],
      shelters: { name: "Protectora Bilbao", slug: "pb" },
    },
  },
};

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await MisCitasPage()}
    </NextIntlClientProvider>,
  );
}

describe("Mis citas (adoptante)", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    orderMock.mockReset().mockResolvedValue({ data: [CITA], error: null });
  });

  it("sin sesión redirige a /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(MisCitasPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("una cita futura activa muestra animal, protectora y cancelar", async () => {
    await renderPagina();
    expect(screen.getByRole("link", { name: "Pipa" })).toHaveAttribute("href", "/animales/pipa");
    expect(screen.getByText("Protectora Bilbao")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.citas.cancelarCita })).toBeInTheDocument();
  });

  it("agrupa en Próximas y muestra el banner de ayuda hacia las guías", async () => {
    await renderPagina();
    expect(screen.getByText(messages.account.citasProximas)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.account.citasAyudaCta }),
    ).toHaveAttribute("href", "/guias");
  });

  it("una cita cancelada muestra el motivo y no ofrece cancelar", async () => {
    orderMock.mockResolvedValue({
      data: [{ ...CITA, status: "cancelled", cancel_reason: "Cerramos por obras" }],
      error: null,
    });
    await renderPagina();
    expect(screen.getByText(messages.citas.estadoCancelada)).toBeInTheDocument();
    expect(screen.getByText("Cerramos por obras")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.citas.cancelarCita }),
    ).not.toBeInTheDocument();
  });

  it("sin citas muestra estado vacío con CTA a mis solicitudes", async () => {
    orderMock.mockResolvedValue({ data: [], error: null });
    await renderPagina();
    expect(screen.getByText(messages.account.citasEmptyTitle)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.account.citasEmptyCta })).toHaveAttribute(
      "href",
      "/mi-cuenta/solicitudes",
    );
  });
});

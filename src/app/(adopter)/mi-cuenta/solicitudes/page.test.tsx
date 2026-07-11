import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const getUserMock = vi.fn();
const orderMock = vi.fn();
const citasMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: vi.fn((tabla: string) => ({
      select: vi.fn(() =>
        tabla === "appointments" ? { in: citasMock } : { order: orderMock },
      ),
    })),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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

import MisSolicitudesPage from "./page";

const SOLICITUD = {
  id: "req1",
  status: "pending",
  created_at: "2026-07-01T10:00:00Z",
  message: "Nos encanta Luna",
  animals: {
    name: "Luna",
    slug: "luna-demo0001",
    published_at: "2026-06-01T00:00:00Z",
    animal_media: [{ url: "https://example.com/luna.jpg", is_cover: true, sort_order: 0 }],
    shelters: { name: "Protectora Última Oportunidad", slug: "protectora-ultima-oportunidad" },
  },
};

async function renderPagina() {
  const ui = await MisSolicitudesPage();
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Mis solicitudes (adoptante)", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "adopter1" } } });
    orderMock.mockReset().mockResolvedValue({ data: [SOLICITUD], error: null });
    citasMock.mockReset().mockResolvedValue({ data: [], error: null });
  });

  it("sin sesión redirige a /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(MisSolicitudesPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("lista la solicitud con animal, protectora, fecha y estado", async () => {
    await renderPagina();
    expect(screen.getByRole("link", { name: "Luna" })).toHaveAttribute(
      "href",
      "/animales/luna-demo0001",
    );
    expect(screen.getByText("Protectora Última Oportunidad")).toBeInTheDocument();
    expect(screen.getByText(messages.account.statusPending)).toBeInTheDocument();
    expect(screen.getByText(/Enviada el/)).toBeInTheDocument();
  });

  it("una solicitud pendiente ofrece el botón de retirar", async () => {
    await renderPagina();
    expect(screen.getByRole("button", { name: messages.account.retirar })).toBeInTheDocument();
  });

  it("una solicitud resuelta NO ofrece retirar y muestra su estado", async () => {
    orderMock.mockResolvedValue({
      data: [{ ...SOLICITUD, status: "rejected" }],
      error: null,
    });
    await renderPagina();
    expect(screen.getByText(messages.account.statusRejected)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.account.retirar }),
    ).not.toBeInTheDocument();
  });

  it("una solicitud aprobada sin cita ofrece reservar visita", async () => {
    orderMock.mockResolvedValue({ data: [{ ...SOLICITUD, status: "approved" }], error: null });
    await renderPagina();
    expect(screen.getByRole("link", { name: messages.citas.reservarVisita })).toHaveAttribute(
      "href",
      "/mi-cuenta/citas/nueva/req1",
    );
  });

  it("una solicitud aprobada con cita muestra la fecha y permite cancelarla", async () => {
    orderMock.mockResolvedValue({ data: [{ ...SOLICITUD, status: "approved" }], error: null });
    citasMock.mockResolvedValue({
      data: [{ id: "cita1", request_id: "req1", starts_at: "2026-08-01T10:00:00Z", status: "confirmed" }],
      error: null,
    });
    await renderPagina();
    expect(screen.getByText(/Visita:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.citas.cancelarCita })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: messages.citas.reservarVisita })).not.toBeInTheDocument();
  });

  it("sin solicitudes muestra estado vacío con CTA al listado", async () => {
    orderMock.mockResolvedValue({ data: [], error: null });
    await renderPagina();
    expect(screen.getByText(messages.account.solicitudesEmptyTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.account.solicitudesEmptyCta }),
    ).toHaveAttribute("href", "/animales");
  });
});

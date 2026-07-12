import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const { limitMock } = vi.hoisted(() => ({ limitMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order: vi.fn(() => ({ limit: limitMock })) })),
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

import AdminReportesPage from "./page";

const REPORTE = {
  id: "r1",
  reason: "posible_fraude",
  details: "Piden Bizum por adelantado",
  status: "pending",
  created_at: "2026-07-10T10:00:00Z",
  animals: { id: "a1", name: "Pipa", slug: "pipa", published_at: "2026-07-01T00:00:00Z" },
};

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await AdminReportesPage()}
    </NextIntlClientProvider>,
  );
}

describe("Cola de reportes (admin)", () => {
  beforeEach(() => {
    limitMock.mockReset().mockResolvedValue({ data: [REPORTE], error: null });
  });

  it("muestra el reporte pendiente con razón, detalles, ficha y acciones", async () => {
    await renderPagina();
    expect(screen.getByText(messages.moderacion.razonPosible_fraude)).toBeInTheDocument();
    expect(screen.getByText("Piden Bizum por adelantado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pipa" })).toHaveAttribute("href", "/animales/pipa");
    expect(screen.getByRole("button", { name: messages.moderacion.despublicar })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.moderacion.descartar })).toBeInTheDocument();
  });

  it("los resueltos van al histórico sin acciones", async () => {
    limitMock.mockResolvedValue({
      data: [{ ...REPORTE, status: "reviewed" }],
      error: null,
    });
    await renderPagina();
    expect(screen.getByText(messages.moderacion.colaEmpty)).toBeInTheDocument();
    expect(screen.getByText(messages.moderacion.estadoReviewed)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: messages.moderacion.descartar }),
    ).not.toBeInTheDocument();
  });

  it("sin reportes celebra la cola vacía", async () => {
    limitMock.mockResolvedValue({ data: [], error: null });
    await renderPagina();
    expect(screen.getByText(messages.moderacion.colaEmpty)).toBeInTheDocument();
  });
});

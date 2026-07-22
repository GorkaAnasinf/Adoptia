import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const state = vi.hoisted(() => ({
  shelter: { id: "s1" } as Record<string, unknown> | null,
  citas: [] as Record<string, unknown>[],
  perfiles: [] as Record<string, unknown>[],
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/server", () => {
  const thenable = (payload: unknown) => {
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "in"]) b[m] = () => b;
    b.then = (resolve: (v: unknown) => void) => resolve(payload);
    return b;
  };
  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
      from: vi.fn((tabla: string) => {
        if (tabla === "shelters") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }) }),
          };
        }
        return thenable({ data: state.citas });
      }),
    })),
  };
});

vi.mock("@/lib/supabase/admin", () => {
  const thenable = (payload: unknown) => {
    const b: Record<string, unknown> = {};
    for (const m of ["select", "in"]) b[m] = () => b;
    b.then = (resolve: (v: unknown) => void) => resolve(payload);
    return b;
  };
  return {
    createAdminClient: vi.fn(() => ({ from: vi.fn(() => thenable({ data: state.perfiles })) })),
  };
});

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

import CitasPanelPage from "./page";

const futura = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
const pasada = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await CitasPanelPage()}
    </NextIntlClientProvider>,
  );
}

describe("Agenda de citas de la protectora", () => {
  beforeEach(() => {
    state.shelter = { id: "s1" };
    state.citas = [
      {
        id: "c1",
        status: "confirmed",
        starts_at: futura,
        cancel_reason: null,
        adopter_id: "adopter1",
        adoption_requests: { animals: { name: "Pipa", slug: "pipa", animal_media: [] } },
      },
      {
        id: "c2",
        status: "no_show",
        starts_at: pasada,
        cancel_reason: null,
        adopter_id: "adopter1",
        adoption_requests: { animals: { name: "Golfo", slug: "golfo", animal_media: [] } },
      },
    ];
    state.perfiles = [{ id: "adopter1", full_name: "Marta" }];
  });

  it("la pestaña Próximas muestra la cita activa con acción y el resumen semanal", async () => {
    await renderPagina();
    expect(screen.getByText("Cita para conocer a Pipa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.citas.marcarRealizada })).toBeInTheDocument();
    expect(screen.getByText(messages.citas.resumenTitle)).toBeInTheDocument();
    // La cita pasada no aparece en la pestaña activa (Próximas).
    expect(screen.queryByText("Cita para conocer a Golfo")).not.toBeInTheDocument();
  });

  it("enlaza el editor de disponibilidad", async () => {
    await renderPagina();
    expect(
      screen.getByRole("link", { name: messages.citas.disponibilidadTitle }),
    ).toHaveAttribute("href", "/panel/agenda");
  });

  it("sin citas muestra el estado vacío", async () => {
    state.citas = [];
    await renderPagina();
    expect(screen.getByText(messages.citas.agendaEmpty)).toBeInTheDocument();
  });
});

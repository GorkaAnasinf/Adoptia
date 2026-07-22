import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const hoyISO = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Europe/Madrid",
}).format(new Date());

const state = vi.hoisted(() => ({
  shelter: { id: "s1" } as Record<string, unknown> | null,
  franjas: [] as Record<string, unknown>[],
  overrides: [] as Record<string, unknown>[],
  citas: [] as Record<string, unknown>[],
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("@/lib/supabase/server", () => {
  const thenable = (payload: unknown) => {
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "gte", "lte", "in", "order"]) b[m] = () => b;
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
        if (tabla === "availability_slots") return thenable({ data: state.franjas });
        if (tabla === "availability_overrides") return thenable({ data: state.overrides });
        return thenable({ data: state.citas });
      }),
    })),
  };
});

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
}));

import AgendaPage from "./page";

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await AgendaPage()}
    </NextIntlClientProvider>,
  );
}

describe("Agenda de disponibilidad de la protectora", () => {
  beforeEach(() => {
    state.shelter = { id: "s1" };
    state.franjas = [
      { weekday: 3, start_time: "10:00:00", end_time: "13:00:00", slot_minutes: 30, active: true },
    ];
    state.overrides = [{ date: hoyISO, closed: true, slots: [], note: "Cerrado" }];
    state.citas = [{ starts_at: new Date().toISOString() }];
  });

  it("compone el calendario con el patrón, las excepciones y las citas cargadas", async () => {
    const { container } = await renderPagina();
    expect(screen.getByText(messages.agenda.title)).toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    // El patrón semanal pinta días 'patron'; el override de hoy los 'cerrado'.
    expect(container.querySelector('[data-estado="patron"]')).not.toBeNull();
    expect(container.querySelector('[data-estado="cerrado"]')).not.toBeNull();
    // La cita de hoy marca su día.
    expect(container.querySelector('[data-citas="true"]')).not.toBeNull();
    // Sin día elegido, el editor muestra el aviso.
    expect(screen.getByText(messages.agenda.sinSeleccion)).toBeInTheDocument();
  });

  it("sin franjas ni citas el calendario se muestra vacío pero navegable", async () => {
    state.franjas = [];
    state.overrides = [];
    state.citas = [];
    const { container } = await renderPagina();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(container.querySelector('[data-estado="patron"]')).toBeNull();
    expect(container.querySelector('[data-citas="true"]')).toBeNull();
  });
});

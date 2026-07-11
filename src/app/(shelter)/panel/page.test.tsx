import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";
import PanelPage from "./page";

const state = vi.hoisted(() => ({
  shelter: { id: "s1", name: "Refugio Uno", status: "verified", verification_note: null, description: "x" } as
    | Record<string, unknown>
    | null,
  animals: [] as Array<Record<string, unknown>>,
  pendingCount: 0,
  requests: [] as Array<Record<string, unknown>>,
  citas: [] as Array<Record<string, unknown>>,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => (key: string, vars?: Record<string, unknown>) => {
    const obj = (messages as unknown as Record<string, Record<string, string>>)[ns];
    let s = obj?.[key] ?? `${ns}.${key}`;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  }),
}));

vi.mock("@/lib/supabase/server", () => {
  const thenable = (payload: unknown) => {
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "limit", "in", "gte"]) b[m] = () => b;
    b.then = (resolve: (v: unknown) => void) => resolve(payload);
    return b;
  };
  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
      from: vi.fn((table: string) => {
        if (table === "shelters") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }) }),
          };
        }
        if (table === "animals") return thenable({ data: state.animals });
        if (table === "appointments") return thenable({ data: state.citas });
        return thenable({ count: state.pendingCount, data: state.requests });
      }),
    })),
  };
});

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("PanelPage — dashboard", () => {
  beforeEach(() => {
    state.shelter = { id: "s1", name: "Refugio Uno", status: "verified", verification_note: null, description: "x" };
    state.animals = [];
    state.pendingCount = 0;
    state.requests = [];
    state.citas = [];
  });

  it("protectora nueva (sin animales) ve los primeros pasos, no ceros", async () => {
    conIntl(await PanelPage());
    expect(screen.getByText(messages.panel.firstStepsTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.panel.addAnimal }),
    ).toHaveAttribute("href", "/panel/animales/nueva");
    // No hay stat tiles todavía
    expect(screen.queryByText(messages.panel.statPublished)).not.toBeInTheDocument();
  });

  it("con animales muestra los contadores correctos", async () => {
    const now = new Date().toISOString();
    state.animals = [
      { id: "a1", name: "Luna", slug: "luna", status: "available", published_at: now, updated_at: now, animal_media: [] },
      { id: "a2", name: "Rocky", slug: "rocky", status: "available", published_at: null, updated_at: now, animal_media: [] },
      { id: "a3", name: "Toby", slug: "toby", status: "adopted", published_at: now, updated_at: now, animal_media: [] },
    ];
    state.pendingCount = 4;
    conIntl(await PanelPage());

    const publicados = screen.getByText(messages.panel.statPublished).closest("a, div")!;
    expect(within(publicados as HTMLElement).getByText("2")).toBeInTheDocument(); // a1 + a3 publicados

    const borradores = screen.getByText(messages.panel.statDrafts).closest("a, div")!;
    expect(within(borradores as HTMLElement).getByText("1")).toBeInTheDocument();

    const pendientes = screen.getByText(messages.panel.statPending).closest("a, div")!;
    expect(within(pendientes as HTMLElement).getByText("4")).toBeInTheDocument();

    const adoptados = screen.getByText(messages.panel.statAdopted).closest("a, div")!;
    expect(within(adoptados as HTMLElement).getByText("1")).toBeInTheDocument();

    // Lista de animales recientes con enlace de edición
    expect(screen.getByRole("link", { name: /Luna/ })).toHaveAttribute("href", "/panel/animales/a1");
  });

  it("en estado pending muestra el enlace para editar el alta", async () => {
    state.shelter = { id: "s1", name: "Refugio Uno", status: "pending", verification_note: null, description: null };
    conIntl(await PanelPage());
    expect(
      screen.getByRole("link", { name: messages.onboarding.bannerPendingEdit }),
    ).toHaveAttribute("href", "/panel/alta");
  });
});

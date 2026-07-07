import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";
import AnimalesPage from "./page";

const state = vi.hoisted(() => ({
  animals: [] as Array<Record<string, unknown>>,
  shelter: { id: "s1" } as { id: string } | null,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => (key: string) => {
    const obj = (messages as unknown as Record<string, Record<string, string>>)[ns];
    return obj?.[key] ?? `${ns}.${key}`;
  }),
}));

vi.mock("@/lib/supabase/server", () => {
  const animalsBuilder = () => {
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.eq = () => b;
    b.order = () => b;
    b.then = (resolve: (v: { data: unknown }) => void) => resolve({ data: state.animals });
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
        return animalsBuilder();
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

describe("AnimalesPage — listado de gestión", () => {
  beforeEach(() => {
    state.shelter = { id: "s1" };
    state.animals = [];
  });

  it("muestra el estado vacío con CTA cuando no hay animales", async () => {
    conIntl(await AnimalesPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(messages.animales.empty)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.animales.emptyCta }),
    ).toHaveAttribute("href", "/panel/animales/nueva");
  });

  it("lista los animales con enlace de edición y su estado", async () => {
    state.animals = [
      {
        id: "a1",
        name: "Luna",
        slug: "luna-x",
        species: "dog",
        status: "available",
        published_at: "2026-01-01",
        animal_media: [],
      },
      {
        id: "a2",
        name: "Rocky",
        slug: "rocky-x",
        species: "cat",
        status: "reserved",
        published_at: null,
        animal_media: [],
      },
    ];
    conIntl(await AnimalesPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getAllByText("Luna").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rocky").length).toBeGreaterThan(0);
    // Enlace de edición apunta a la ficha por id
    const editar = screen.getAllByRole("link", { name: messages.animales.edit });
    expect(editar[0]).toHaveAttribute("href", "/panel/animales/a1");
    // El borrador (published_at null) se marca como tal
    expect(screen.getAllByText(messages.animales.draft).length).toBeGreaterThan(0);
  });
});

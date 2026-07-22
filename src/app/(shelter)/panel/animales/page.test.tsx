import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";
import AnimalesPage from "./page";

const state = vi.hoisted(() => ({
  animals: [] as Array<Record<string, unknown>>,
  shelter: { id: "s1", status: "verified" } as { id: string; status: string } | null,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => (key: string) => {
    const obj = (messages as unknown as Record<string, Record<string, string>>)[ns];
    return obj?.[key] ?? `${ns}.${key}`;
  }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

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
    state.shelter = { id: "s1", status: "verified" };
    state.animals = [];
  });

  it("muestra el estado vacío con CTA cuando no hay animales", async () => {
    conIntl(await AnimalesPage());
    expect(screen.getByText(messages.animales.empty)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.animales.emptyCta }),
    ).toHaveAttribute("href", "/panel/animales/nueva");
  });

  it("monta la rejilla con las tarjetas de los animales", async () => {
    state.animals = [
      {
        id: "a1",
        name: "Luna",
        slug: "luna-x",
        species: "dog",
        sex: "female",
        breed: "Podenco",
        birth_date_approx: null,
        status: "available",
        published_at: "2026-01-01",
        moderation_note: null,
        animal_media: [],
      },
      {
        id: "a2",
        name: "Rocky",
        slug: "rocky-x",
        species: "cat",
        sex: "male",
        breed: null,
        birth_date_approx: null,
        status: "reserved",
        published_at: null,
        moderation_note: null,
        animal_media: [],
      },
    ];
    conIntl(await AnimalesPage());

    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    const editar = screen.getAllByRole("link", { name: messages.animales.edit });
    expect(editar[0]).toHaveAttribute("href", "/panel/animales/a1");
    expect(screen.getByText(messages.animales.draft)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.animales.newAnimalCard })).toHaveAttribute(
      "href",
      "/panel/animales/nueva",
    );
  });
});

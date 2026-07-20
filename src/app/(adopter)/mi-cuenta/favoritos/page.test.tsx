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

// El corazón (FavoritoButton) consulta sesión y estado al montar: stub que no rompe.
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: { animal_id: "a1" } })) })),
      })),
      delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
    })),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
}));

import FavoritosPage from "./page";

const FAVORITO = {
  animal_id: "a1",
  animals: {
    id: "a1",
    name: "Luna",
    slug: "luna-demo",
    status: "available",
    species: "cat",
    sex: "female",
    size: "small",
    breed: null,
    birth_date_approx: "2025-01-01",
    published_at: "2026-07-01T00:00:00Z",
    animal_media: [],
    shelters: { name: "Protectora Bilbao", slug: "protectora-bilbao" },
  },
};

async function renderPagina() {
  const ui = await FavoritosPage();
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Favoritos (adoptante)", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    orderMock.mockReset().mockResolvedValue({ data: [FAVORITO], error: null });
  });

  it("sin sesión redirige a /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(FavoritosPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("lista el favorito como tarjeta con enlace a la ficha", async () => {
    await renderPagina();
    expect(screen.getByRole("link", { name: /Luna/ })).toHaveAttribute(
      "href",
      "/animales/luna-demo",
    );
  });

  it("muestra el contador, vaciar favoritos y el banner de alerta", async () => {
    await renderPagina();
    expect(
      screen.getByRole("button", { name: messages.account.favoritosVaciar }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.account.favoritosAlertaCta }),
    ).toHaveAttribute("href", "/animales");
  });

  it("un favorito adoptado muestra su estado en la tarjeta", async () => {
    orderMock.mockResolvedValue({
      data: [{ ...FAVORITO, animals: { ...FAVORITO.animals, status: "adopted" } }],
      error: null,
    });
    await renderPagina();
    expect(screen.getByText(messages.animales.statusAdopted)).toBeInTheDocument();
  });

  it("sin favoritos muestra estado vacío con CTA al listado", async () => {
    orderMock.mockResolvedValue({ data: [], error: null });
    await renderPagina();
    expect(screen.getByText(messages.account.favoritosEmptyTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.account.favoritosEmptyCta }),
    ).toHaveAttribute("href", "/animales");
  });
});

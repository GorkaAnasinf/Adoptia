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
}));

import FavoritosPage from "./page";

const FAVORITO = {
  animal_id: "a1",
  animals: {
    name: "Luna",
    slug: "luna-demo",
    status: "available",
    published_at: "2026-07-01T00:00:00Z",
    animal_media: [],
    shelters: { name: "Protectora Bilbao" },
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

  it("lista el favorito con enlace a la ficha y botón de quitar", async () => {
    await renderPagina();
    expect(screen.getByRole("link", { name: "Luna" })).toHaveAttribute(
      "href",
      "/animales/luna-demo",
    );
    expect(
      screen.getByRole("button", { name: messages.account.quitarFavorito }),
    ).toBeInTheDocument();
    expect(screen.queryByText(messages.account.favoritoAdoptado)).not.toBeInTheDocument();
  });

  it("un favorito adoptado se marca visualmente", async () => {
    orderMock.mockResolvedValue({
      data: [{ ...FAVORITO, animals: { ...FAVORITO.animals, status: "adopted" } }],
      error: null,
    });
    await renderPagina();
    expect(screen.getByText(messages.account.favoritoAdoptado)).toBeInTheDocument();
  });

  it("sin favoritos muestra estado vacío", async () => {
    orderMock.mockResolvedValue({ data: [], error: null });
    await renderPagina();
    expect(screen.getByText(messages.account.favoritosEmptyTitle)).toBeInTheDocument();
  });
});

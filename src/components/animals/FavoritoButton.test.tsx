import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { FavoritoButton } from "./FavoritoButton";

const pushMock = vi.fn();
const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
    }),
  }),
}));

function renderFav(variant?: "icon" | "wide") {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <FavoritoButton animalId="a1" variant={variant} />
    </NextIntlClientProvider>,
  );
}

describe("FavoritoButton", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getUserMock.mockReset();
    maybeSingleMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: null } });
    maybeSingleMock.mockResolvedValue({ data: null });
  });

  it("variante icon renderiza un botón compacto con etiqueta accesible", async () => {
    renderFav("icon");
    expect(await screen.findByRole("button", { name: "Guardar en favoritos" })).toBeInTheDocument();
  });

  it("variante wide muestra el texto 'Guardar para luego'", async () => {
    renderFav("wide");
    await waitFor(() => expect(screen.getByText("Guardar para luego")).toBeInTheDocument());
  });
});

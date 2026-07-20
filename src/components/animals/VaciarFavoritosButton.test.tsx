import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { VaciarFavoritosButton } from "./VaciarFavoritosButton";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const getUserMock = vi.fn();
const deleteEqMock = vi.fn();
const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));
const fromMock = vi.fn(() => ({ delete: deleteMock }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

function renderBoton() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <VaciarFavoritosButton />
    </NextIntlClientProvider>,
  );
}

describe("VaciarFavoritosButton", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    deleteEqMock.mockReset().mockResolvedValue({ error: null });
    deleteMock.mockClear();
    fromMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra el botón con el texto de vaciar", () => {
    renderBoton();
    expect(
      screen.getByRole("button", { name: messages.account.favoritosVaciar }),
    ).toBeInTheDocument();
  });

  it("si el usuario cancela el confirm no borra nada", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderBoton();
    await userEvent.click(screen.getByRole("button"));
    expect(fromMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("al confirmar borra los favoritos del usuario y refresca", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderBoton();
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(fromMock).toHaveBeenCalledWith("favorites");
    expect(deleteEqMock).toHaveBeenCalledWith("user_id", "u1");
  });

  it("al confirmar sin sesión redirige a /login y no borra", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    getUserMock.mockResolvedValue({ data: { user: null } });
    renderBoton();
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(deleteMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { InterestButton } from "./InterestButton";

const pushMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({ auth: { getUser: getUserMock } })),
}));

function renderButton() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <InterestButton slug="pipa-abc123" />
    </NextIntlClientProvider>,
  );
}

describe("InterestButton", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getUserMock.mockReset();
  });

  it("sin sesión, al pulsarlo lleva al login con retorno a la ficha", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Me interesa" }));
    expect(pushMock).toHaveBeenCalledWith("/login?next=%2Fanimales%2Fpipa-abc123");
  });

  it("con sesión muestra el aviso de solicitudes próximamente", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Me interesa" }));
    expect(pushMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText("¡Genial! Muy pronto podrás enviar tu solicitud desde aquí."),
    ).toBeInTheDocument();
  });
});

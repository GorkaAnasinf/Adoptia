import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { CommandPalette } from "./CommandPalette";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

function renderPalette(open = true) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <CommandPalette role="shelter" open={open} onClose={vi.fn()} />
    </NextIntlClientProvider>,
  );
}

describe("CommandPalette", () => {
  beforeEach(() => {
    pushMock.mockReset();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { results: [] } }) });
  });

  it("cerrado no renderiza nada", () => {
    renderPalette(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abierto muestra las secciones del rol", () => {
    renderPalette();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Alguna sección de protectora (por su etiqueta de nav)
    expect(screen.getByText(messages.shell.navAnimals)).toBeInTheDocument();
    expect(screen.getByText(messages.shell.navAgenda)).toBeInTheDocument();
  });

  it("filtra las secciones por el término escrito", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.type(screen.getByRole("textbox"), "agenda");
    expect(screen.getByText(messages.shell.navAgenda)).toBeInTheDocument();
    expect(screen.queryByText(messages.shell.navAnimals)).not.toBeInTheDocument();
  });

  it("Enter navega a la sección activa", async () => {
    const user = userEvent.setup();
    renderPalette();
    const input = screen.getByRole("textbox");
    await user.type(screen.getByRole("textbox"), "estadi");
    await user.type(input, "{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/panel/estadisticas");
  });
});

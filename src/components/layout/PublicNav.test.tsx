import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { PublicNav } from "./PublicNav";

const pathnameMock = vi.fn();
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useRouter: () => ({ push: pushMock }),
}));

function renderAt(pathname: string) {
  pathnameMock.mockReturnValue(pathname);
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PublicNav />
    </NextIntlClientProvider>,
  );
}

describe("PublicNav", () => {
  it("muestra los enlaces públicos con sus destinos", () => {
    renderAt("/");
    expect(screen.getByRole("link", { name: messages.nav.animals })).toHaveAttribute(
      "href",
      "/animales",
    );
    expect(screen.getByRole("link", { name: messages.nav.shelters })).toHaveAttribute(
      "href",
      "/protectoras",
    );
    expect(screen.getByRole("link", { name: messages.nav.map })).toHaveAttribute("href", "/mapa");
    expect(screen.getByRole("link", { name: messages.nav.lostFound })).toHaveAttribute(
      "href",
      "/perdidos-encontrados",
    );
  });

  it("marca como actual el enlace de la sección en la que estás", () => {
    renderAt("/animales");
    expect(screen.getByRole("link", { name: messages.nav.animals })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: messages.nav.map })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("el buscador envía el término a /animales?q=…", async () => {
    pushMock.mockReset();
    renderAt("/");
    const inputs = screen.getAllByRole("searchbox", { name: messages.nav.searchPlaceholder });
    await userEvent.type(inputs[0], "labrador{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/animales?q=labrador");
  });

  it("el buscador vacío lleva al listado sin filtro", async () => {
    pushMock.mockReset();
    renderAt("/");
    const inputs = screen.getAllByRole("searchbox", { name: messages.nav.searchPlaceholder });
    inputs[0].closest("form")!.requestSubmit();
    expect(pushMock).toHaveBeenCalledWith("/animales");
  });

  it("el menú móvil abre y cierra el panel de navegación", async () => {
    renderAt("/");
    const abrir = screen.getByRole("button", { name: messages.nav.openMenu });
    expect(abrir).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(abrir);
    const panel = screen.getByRole("dialog");
    expect(within(panel).getByRole("link", { name: messages.nav.animals })).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole("button", { name: messages.nav.closeMenu }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

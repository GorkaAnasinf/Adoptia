import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { PublicBreadcrumbs } from "./PublicBreadcrumbs";

const pathnameMock = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => pathnameMock() }));

function renderAt(pathname: string) {
  pathnameMock.mockReturnValue(pathname);
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PublicBreadcrumbs />
    </NextIntlClientProvider>,
  );
}

describe("PublicBreadcrumbs", () => {
  it("no muestra migas en la home", () => {
    renderAt("/");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("en una ruta pública muestra Inicio (enlace) y la sección actual", () => {
    renderAt("/animales");
    expect(screen.getByRole("link", { name: messages.shell.crumbHome })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText(messages.shell.crumbAnimales)).toBeInTheDocument();
  });

  it("encadena varias secciones anidadas", () => {
    renderAt("/perdidos-encontrados");
    expect(screen.getByText(messages.shell.crumbPerdidos)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.shell.crumbHome })).toBeInTheDocument();
  });
});

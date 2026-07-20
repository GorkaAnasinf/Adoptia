import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { PanelAportacion } from "./PanelAportacion";

function conIntl(props: { donaciones: number; acogida: boolean; alertas: number }) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages} timeZone="Europe/Madrid">
      <PanelAportacion {...props} />
    </NextIntlClientProvider>,
  );
}

describe("PanelAportacion", () => {
  it("muestra los contadores reales de quien ya está aportando", () => {
    conIntl({ donaciones: 2, acogida: true, alertas: 1 });
    expect(screen.getByText("2 ofrecimientos de donación activos")).toBeInTheDocument();
    expect(screen.getByText("Estás dado de alta como casa de acogida")).toBeInTheDocument();
    expect(screen.getByText("1 alerta activa")).toBeInTheDocument();
  });

  it("singulariza el ofrecimiento cuando solo hay uno", () => {
    conIntl({ donaciones: 1, acogida: false, alertas: 0 });
    expect(screen.getByText("1 ofrecimiento de donación activo")).toBeInTheDocument();
  });

  it("invita a activar cada vía en lugar de mostrar un cero", () => {
    conIntl({ donaciones: 0, acogida: false, alertas: 0 });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.getByText(/Ofrece pienso, mantas o material/)).toBeInTheDocument();
    expect(screen.getByText(/Apúntate como casa de acogida/)).toBeInTheDocument();
    expect(screen.getByText(/Crea una alerta/)).toBeInTheDocument();
  });

  it("enlaza cada vía con su página y cierra con la llamada a necesidades", () => {
    conIntl({ donaciones: 3, acogida: true, alertas: 2 });
    expect(screen.getByRole("link", { name: /ofrecimientos de donación/ })).toHaveAttribute(
      "href",
      "/mi-cuenta/donaciones",
    );
    expect(screen.getByRole("link", { name: /casa de acogida/ })).toHaveAttribute("href", "/mi-cuenta/acogida");
    expect(screen.getByRole("link", { name: /alertas activas/ })).toHaveAttribute("href", "/mi-cuenta/alertas");
    expect(screen.getByRole("link", { name: /Ver qué necesitan/ })).toHaveAttribute("href", "/necesidades");
  });
});

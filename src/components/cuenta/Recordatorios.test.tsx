import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import type { Recordatorio } from "@/lib/cuenta/recordatorios";
import { Recordatorios } from "./Recordatorios";

function conIntl(recordatorios: Recordatorio[]) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages} timeZone="Europe/Madrid">
      <Recordatorios recordatorios={recordatorios} />
    </NextIntlClientProvider>,
  );
}

describe("Recordatorios", () => {
  it("no renderiza nada cuando no hay recordatorios", () => {
    const { container } = conIntl([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra la cita con su animal, protectora y enlace a las citas", () => {
    conIntl([
      {
        tipo: "cita",
        id: "c1",
        href: "/mi-cuenta/citas",
        animal: "Luna",
        protectora: "Refugio Uno",
        fecha: "2026-07-22T16:30:00.000Z",
      },
    ]);
    const enlace = screen.getByRole("link", { name: /Cita con Luna/ });
    expect(enlace).toHaveAttribute("href", "/mi-cuenta/citas");
    expect(enlace).toHaveTextContent("Refugio Uno");
    // 18:30 en Madrid (UTC+2), no las 16:30 de UTC
    expect(enlace).toHaveTextContent("18:30");
  });

  it("enlaza la reserva de visita al formulario de la solicitud aprobada", () => {
    conIntl([
      { tipo: "reservar", id: "s1", href: "/mi-cuenta/citas/nueva/s1", animal: "Bruno", protectora: null },
    ]);
    const enlace = screen.getByRole("link", { name: /Reserva tu visita/ });
    expect(enlace).toHaveAttribute("href", "/mi-cuenta/citas/nueva/s1");
    expect(enlace).toHaveTextContent("Bruno");
  });

  it("muestra la propuesta de acogida con la protectora que la envía", () => {
    conIntl([
      { tipo: "acogida", id: "p1", href: "/mi-cuenta/acogida", animal: "Copito", protectora: "Refugio Dos" },
    ]);
    const enlace = screen.getByRole("link", { name: /Propuesta de acogida/ });
    expect(enlace).toHaveAttribute("href", "/mi-cuenta/acogida");
    expect(enlace).toHaveTextContent("Refugio Dos");
  });

  it("usa un texto neutro cuando el animal no tiene nombre", () => {
    conIntl([{ tipo: "reservar", id: "s1", href: "/x", animal: null, protectora: null }]);
    expect(screen.getByRole("link")).toHaveTextContent("Este animal");
  });
});

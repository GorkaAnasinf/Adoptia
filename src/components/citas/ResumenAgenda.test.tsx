import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import mensajes from "../../../messages/es.json";
import { ResumenAgenda } from "./ResumenAgenda";

function pintar(props: Partial<Parameters<typeof ResumenAgenda>[0]> = {}) {
  render(
    <NextIntlClientProvider locale="es" messages={mensajes}>
      <ResumenAgenda
        capacidad={12}
        citasPendientesHoy={4}
        proximaISO={null}
        hoyISO="2026-08-12"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe("ResumenAgenda", () => {
  it("muestra capacidad y citas pendientes", () => {
    pintar();
    expect(screen.getByText("12 huecos")).toBeInTheDocument();
    expect(screen.getByText("4 hoy")).toBeInTheDocument();
  });

  it("sin próxima disponibilidad muestra un guion", () => {
    pintar({ proximaISO: null });
    expect(screen.getByText(mensajes.agenda.sinDatos)).toBeInTheDocument();
  });

  it("formatea la próxima disponibilidad de hoy", () => {
    // 07:00 UTC = 09:00 Europe/Madrid (verano).
    pintar({ proximaISO: "2026-08-12T07:00:00.000Z" });
    expect(screen.getByText(/Hoy 09:00/)).toBeInTheDocument();
  });

  it("formatea la próxima disponibilidad de mañana", () => {
    pintar({ proximaISO: "2026-08-13T07:00:00.000Z" });
    expect(screen.getByText(/Mañana 09:00/)).toBeInTheDocument();
  });
});

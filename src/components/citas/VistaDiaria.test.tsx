import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import mensajes from "../../../messages/es.json";
import { VistaDiaria } from "./VistaDiaria";
import type { CitaAgenda } from "@/lib/agenda";

function pintar(props: Partial<Parameters<typeof VistaDiaria>[0]> = {}) {
  render(
    <NextIntlClientProvider locale="es" messages={mensajes}>
      <VistaDiaria fecha="2026-08-12" citas={[]} {...props} />
    </NextIntlClientProvider>,
  );
}

// 2026-08-12 11:30 en Europe/Madrid (verano, UTC+2) = 09:30 UTC.
const cita: CitaAgenda = {
  id: "c1",
  starts_at: "2026-08-12T09:30:00.000Z",
  status: "confirmed",
  animalName: "Luna",
  animalSlug: "luna",
  adopterName: "Sergio Montes",
};

describe("VistaDiaria", () => {
  it("sin día seleccionado muestra el aviso", () => {
    pintar({ fecha: null });
    expect(screen.getByText(mensajes.agenda.diariaSinDia)).toBeInTheDocument();
  });

  it("con día pero sin citas muestra el estado vacío", () => {
    pintar({ citas: [] });
    expect(screen.getByText(mensajes.agenda.sinCitasDia)).toBeInTheDocument();
  });

  it("lista las citas del día con hora, animal, adoptante y estado", () => {
    pintar({ citas: [cita] });
    expect(screen.getByText("11:30")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.getByText("Sergio Montes")).toBeInTheDocument();
    expect(screen.getByText(mensajes.citas.estadoConfirmada)).toBeInTheDocument();
  });
});

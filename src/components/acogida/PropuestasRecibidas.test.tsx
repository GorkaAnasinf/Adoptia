import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { PropuestasRecibidas, type PropuestaRecibida } from "./PropuestasRecibidas";

const PROPUESTA: PropuestaRecibida = {
  id: "p1",
  duracion: "2 semanas",
  mensaje: "Camada de cachorros, ¿puedes ayudarnos?",
  status: "enviada",
  created_at: "2026-07-15T10:00:00Z",
  shelters: { name: "Protectora Bilbao" },
  animals: { name: "Trufa" },
};

function renderBloque(propuestas: PropuestaRecibida[]) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PropuestasRecibidas propuestas={propuestas} />
    </NextIntlClientProvider>,
  );
}

describe("PropuestasRecibidas", () => {
  it("lista protectora, animal, duración, mensaje y estado", () => {
    renderBloque([PROPUESTA]);
    expect(screen.getByText(messages.acogida.recibidasTitulo)).toBeInTheDocument();
    expect(screen.getByText(/Protectora Bilbao/)).toBeInTheDocument();
    expect(screen.getByText(/Trufa/)).toBeInTheDocument();
    expect(screen.getByText(/2 semanas/)).toBeInTheDocument();
    expect(screen.getByText(/Camada de cachorros/)).toBeInTheDocument();
    expect(screen.getByText(messages.acogida.estadoPropuestaEnviada)).toBeInTheDocument();
  });

  it("sin animal concreto lo indica", () => {
    renderBloque([{ ...PROPUESTA, animals: null }]);
    expect(screen.getByText(new RegExp(messages.acogida.sinAnimalConcreto))).toBeInTheDocument();
  });

  it("vacío: estado cuidado", () => {
    renderBloque([]);
    expect(screen.getByText(messages.acogida.recibidasEmpty)).toBeInTheDocument();
  });
});

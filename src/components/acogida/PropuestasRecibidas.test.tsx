import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

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

  it("propuesta aceptada ofrece pedir relevo; enviada no", () => {
    renderBloque([
      { ...PROPUESTA, id: "p1", status: "aceptada" },
      { ...PROPUESTA, id: "p2", status: "enviada" },
    ]);
    expect(screen.getAllByRole("button", { name: messages.acogida.relevoNecesito })).toHaveLength(
      1,
    );
  });

  it("con relevo ya pedido muestra el aviso con la fecha", () => {
    renderBloque([
      {
        ...PROPUESTA,
        status: "aceptada",
        relevo_pedido_at: "2026-07-17T10:00:00Z",
        relevo_motivo: "Obras",
        relevo_fecha_limite: "2026-08-01",
      },
    ]);
    expect(screen.getByText(/2026-08-01/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.acogida.relevoCancelar }),
    ).toBeInTheDocument();
  });
});

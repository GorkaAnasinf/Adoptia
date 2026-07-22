import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import mensajes from "../../../messages/es.json";
import { PlantillasPicker } from "./PlantillasPicker";
import type { Plantilla } from "@/lib/agenda";

const plantillas: Plantilla[] = [
  { id: "p1", nombre: "Mañanas L-V", slots: [{ start: "10:00", end: "13:00", minutes: 30 }] },
  { id: "p2", nombre: "Tardes", slots: [{ start: "16:00", end: "19:00", minutes: 60 }] },
];

function pintar(props: Partial<Parameters<typeof PlantillasPicker>[0]> = {}) {
  const onAplicar = vi.fn();
  const onBorrar = vi.fn();
  render(
    <NextIntlClientProvider locale="es" messages={mensajes}>
      <PlantillasPicker
        plantillas={plantillas}
        nSeleccionados={2}
        guardando={false}
        onAplicar={onAplicar}
        onBorrar={onBorrar}
        {...props}
      />
    </NextIntlClientProvider>,
  );
  return { onAplicar, onBorrar };
}

describe("PlantillasPicker", () => {
  it("lista las plantillas de la protectora", () => {
    pintar();
    expect(screen.getByText("Mañanas L-V")).toBeInTheDocument();
    expect(screen.getByText("Tardes")).toBeInTheDocument();
  });

  it("aplica una plantilla a la selección", () => {
    const { onAplicar } = pintar();
    fireEvent.click(screen.getAllByRole("button", { name: /^aplicar$/i })[0]);
    expect(onAplicar).toHaveBeenCalledWith(plantillas[0]);
  });

  it("borra una plantilla", () => {
    const { onBorrar } = pintar();
    fireEvent.click(screen.getAllByRole("button", { name: /borrar plantilla/i })[1]);
    expect(onBorrar).toHaveBeenCalledWith("p2");
  });

  it("deshabilita 'Aplicar' si no hay días seleccionados", () => {
    pintar({ nSeleccionados: 0 });
    expect(screen.getAllByRole("button", { name: /^aplicar$/i })[0]).toBeDisabled();
  });

  it("muestra el estado vacío sin plantillas", () => {
    pintar({ plantillas: [] });
    expect(screen.getByText(mensajes.agenda.sinPlantillas)).toBeInTheDocument();
  });
});

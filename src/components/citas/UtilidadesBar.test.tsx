import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import mensajes from "../../../messages/es.json";
import { UtilidadesBar } from "./UtilidadesBar";

function pintar(props: Partial<Parameters<typeof UtilidadesBar>[0]> = {}) {
  const onToggleSeleccion = vi.fn();
  const onAbrirRango = vi.fn();
  const onCerrarFestivos = vi.fn();
  render(
    <NextIntlClientProvider locale="es" messages={mensajes}>
      <UtilidadesBar
        modoSeleccion={false}
        onToggleSeleccion={onToggleSeleccion}
        onAbrirRango={onAbrirRango}
        onCerrarFestivos={onCerrarFestivos}
        {...props}
      />
    </NextIntlClientProvider>,
  );
  return { onToggleSeleccion, onAbrirRango, onCerrarFestivos };
}

describe("UtilidadesBar", () => {
  it("activa el modo selección", () => {
    const { onToggleSeleccion } = pintar();
    fireEvent.click(screen.getByRole("button", { name: /seleccionar días/i }));
    expect(onToggleSeleccion).toHaveBeenCalledOnce();
  });

  it("en modo selección el botón invita a salir", () => {
    pintar({ modoSeleccion: true });
    expect(screen.getByRole("button", { name: /salir de selección/i })).toBeInTheDocument();
  });

  it("abre el diálogo de rango", () => {
    const { onAbrirRango } = pintar();
    fireEvent.click(screen.getByRole("button", { name: /cerrar rango/i }));
    expect(onAbrirRango).toHaveBeenCalledOnce();
  });

  it("cierra los festivos", () => {
    const { onCerrarFestivos } = pintar();
    fireEvent.click(screen.getByRole("button", { name: /cerrar festivos/i }));
    expect(onCerrarFestivos).toHaveBeenCalledOnce();
  });
});

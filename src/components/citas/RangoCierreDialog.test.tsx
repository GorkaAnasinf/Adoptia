import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import mensajes from "../../../messages/es.json";
import { RangoCierreDialog } from "./RangoCierreDialog";

function pintar(props: Partial<Parameters<typeof RangoCierreDialog>[0]> = {}) {
  const onConfirmar = vi.fn();
  const onCerrar = vi.fn();
  render(
    <NextIntlClientProvider locale="es" messages={mensajes}>
      <RangoCierreDialog
        abierto
        guardando={false}
        onConfirmar={onConfirmar}
        onCerrar={onCerrar}
        {...props}
      />
    </NextIntlClientProvider>,
  );
  return { onConfirmar, onCerrar };
}

describe("RangoCierreDialog", () => {
  it("confirma un rango válido con su nota", () => {
    const { onConfirmar } = pintar();
    fireEvent.change(screen.getByLabelText(/desde/i), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText(/hasta/i), { target: { value: "2026-08-15" } });
    fireEvent.change(screen.getByLabelText(/nota/i), { target: { value: "Vacaciones" } });
    fireEvent.click(screen.getByRole("button", { name: /cerrar rango/i }));
    expect(onConfirmar).toHaveBeenCalledWith({
      desde: "2026-08-01",
      hasta: "2026-08-15",
      nota: "Vacaciones",
    });
  });

  it("rechaza un rango invertido con aviso y no confirma", () => {
    const { onConfirmar } = pintar();
    fireEvent.change(screen.getByLabelText(/desde/i), { target: { value: "2026-08-15" } });
    fireEvent.change(screen.getByLabelText(/hasta/i), { target: { value: "2026-08-01" } });
    fireEvent.click(screen.getByRole("button", { name: /cerrar rango/i }));
    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.getByText(/posterior a «Desde»/i)).toBeInTheDocument();
  });

  it("no se muestra si no está abierto", () => {
    pintar({ abierto: false });
    expect(screen.queryByRole("button", { name: /cerrar rango/i })).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import mensajes from "../../../messages/es.json";
import { PanelDiaEditor } from "./PanelDiaEditor";
import type { EstadoDia } from "@/lib/agenda";

function pintar(props: Partial<Parameters<typeof PanelDiaEditor>[0]> = {}) {
  const onGuardar = vi.fn();
  const onResetear = vi.fn();
  render(
    <NextIntlClientProvider locale="es" messages={mensajes}>
      <PanelDiaEditor
        fecha="2026-08-12" // miércoles
        estadoInicial={{ tipo: "sin_configurar" } as EstadoDia}
        guardando={false}
        errorGuardar={false}
        onGuardar={onGuardar}
        onResetear={onResetear}
        {...props}
      />
    </NextIntlClientProvider>,
  );
  return { onGuardar, onResetear };
}

describe("PanelDiaEditor", () => {
  it("sin día seleccionado muestra el aviso", () => {
    render(
      <NextIntlClientProvider locale="es" messages={mensajes}>
        <PanelDiaEditor
          fecha={null}
          estadoInicial={null}
          guardando={false}
          errorGuardar={false}
          onGuardar={vi.fn()}
          onResetear={vi.fn()}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(/elige un día del calendario/i)).toBeInTheDocument();
  });

  it("cerrar el día emite intent 'cerrar' con la nota", () => {
    const { onGuardar } = pintar();
    fireEvent.click(screen.getByRole("switch", { name: /cerrar este día/i }));
    fireEvent.change(screen.getByPlaceholderText(/vacaciones/i), {
      target: { value: "Festivo local" },
    });
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    expect(onGuardar).toHaveBeenCalledWith({ tipo: "cerrar", note: "Festivo local" });
  });

  it("guardar franjas sin repetir emite intent 'especial'", () => {
    const estadoInicial: EstadoDia = {
      tipo: "especial",
      franjas: [{ start: "16:00", end: "18:00", minutes: 60 }],
      note: null,
    };
    const { onGuardar } = pintar({ estadoInicial });
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "especial",
      slots: [{ start: "16:00", end: "18:00", minutes: 60 }],
      note: null,
    });
  });

  it("con 'repetir semanalmente' emite intent 'patron'", () => {
    const estadoInicial: EstadoDia = {
      tipo: "patron",
      franjas: [{ start: "10:00", end: "13:00", minutes: 30 }],
    };
    const { onGuardar } = pintar({ estadoInicial });
    fireEvent.click(screen.getByRole("checkbox", { name: /repetir semanalmente/i }));
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "patron",
      slots: [{ start: "10:00", end: "13:00", minutes: 30 }],
    });
  });

  it("bloquea el guardado si una franja tiene el fin antes del inicio", () => {
    const estadoInicial: EstadoDia = {
      tipo: "especial",
      franjas: [{ start: "18:00", end: "16:00", minutes: 60 }],
      note: null,
    };
    const { onGuardar } = pintar({ estadoInicial });
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByText(/hora de fin debe ser posterior/i)).toBeInTheDocument();
  });

  it("añadir una franja abre el día y la guarda como horario especial", () => {
    const { onGuardar } = pintar(); // parte de sin_configurar (sin franjas)
    expect(screen.getByText(/añade una franja/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /añadir franja/i }));
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "especial",
      slots: [{ start: "10:00", end: "13:00", minutes: 30 }],
      note: null,
    });
  });

  it("borrar una franja la quita del guardado", () => {
    const estadoInicial: EstadoDia = {
      tipo: "especial",
      franjas: [
        { start: "10:00", end: "12:00", minutes: 30 },
        { start: "16:00", end: "18:00", minutes: 60 },
      ],
      note: null,
    };
    const { onGuardar } = pintar({ estadoInicial });
    fireEvent.click(screen.getAllByRole("button", { name: /borrar franja/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "especial",
      slots: [{ start: "16:00", end: "18:00", minutes: 60 }],
      note: null,
    });
  });

  it("editar la hora de inicio se refleja en el guardado", () => {
    const estadoInicial: EstadoDia = {
      tipo: "especial",
      franjas: [{ start: "10:00", end: "13:00", minutes: 30 }],
      note: null,
    };
    const { onGuardar } = pintar({ estadoInicial });
    fireEvent.change(screen.getByLabelText(/inicio/i), { target: { value: "11:00" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: "especial",
      slots: [{ start: "11:00", end: "13:00", minutes: 30 }],
      note: null,
    });
  });

  it("bloquea el guardado si dos franjas se solapan", () => {
    const estadoInicial: EstadoDia = {
      tipo: "especial",
      franjas: [
        { start: "10:00", end: "14:00", minutes: 30 },
        { start: "12:00", end: "16:00", minutes: 30 },
      ],
      note: null,
    };
    const { onGuardar } = pintar({ estadoInicial });
    fireEvent.click(screen.getByRole("button", { name: /guardar disponibilidad/i }));
    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByText(/no pueden solaparse/i)).toBeInTheDocument();
  });

  it("muestra el error de guardado que llega del servidor", () => {
    pintar({ errorGuardar: true });
    expect(screen.getByText(mensajes.agenda.errorGuardar)).toBeInTheDocument();
  });

  it("resetear el día llama a onResetear", () => {
    const { onResetear } = pintar({
      estadoInicial: { tipo: "patron", franjas: [{ start: "10:00", end: "13:00", minutes: 30 }] },
    });
    fireEvent.click(screen.getByRole("button", { name: /resetear día/i }));
    expect(onResetear).toHaveBeenCalledOnce();
  });
});

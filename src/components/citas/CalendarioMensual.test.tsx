import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import mensajes from "../../../messages/es.json";
import { CalendarioMensual } from "./CalendarioMensual";
import type { EstadoDia } from "@/lib/agenda";

function pintar(props: Partial<Parameters<typeof CalendarioMensual>[0]> = {}) {
  const onSelect = vi.fn();
  const onPrev = vi.fn();
  const onNext = vi.fn();
  const estadoDe = props.estadoDe ?? (() => ({ tipo: "sin_configurar" as EstadoDia["tipo"], conCitas: false }));
  render(
    <NextIntlClientProvider locale="es" messages={mensajes}>
      <CalendarioMensual
        year={2026}
        month={7} // agosto (0-indexado)
        todayISO={null}
        seleccionadoISO={null}
        estadoDe={estadoDe}
        onSelect={onSelect}
        onPrev={onPrev}
        onNext={onNext}
        {...props}
      />
    </NextIntlClientProvider>,
  );
  return { onSelect, onPrev, onNext };
}

describe("CalendarioMensual", () => {
  it("muestra el mes y todos los días", () => {
    pintar();
    expect(screen.getByText(/agosto de 2026/i)).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: /^15$/ })).toBeInTheDocument();
    // 31 días de agosto
    expect(screen.getAllByRole("gridcell")).toHaveLength(31);
  });

  it("marca los días cerrados y los que tienen citas", () => {
    const estadoDe = (iso: string) =>
      iso === "2026-08-10"
        ? { tipo: "cerrado" as EstadoDia["tipo"], conCitas: false }
        : iso === "2026-08-12"
          ? { tipo: "patron" as EstadoDia["tipo"], conCitas: true }
          : { tipo: "sin_configurar" as EstadoDia["tipo"], conCitas: false };
    pintar({ estadoDe });
    expect(screen.getByRole("gridcell", { name: /^10$/ })).toHaveAttribute("data-estado", "cerrado");
    expect(screen.getByRole("gridcell", { name: /^12$/ })).toHaveAttribute("data-citas", "true");
  });

  it("selecciona un día con su fecha ISO", () => {
    const { onSelect } = pintar();
    fireEvent.click(screen.getByRole("gridcell", { name: /^5$/ }));
    expect(onSelect).toHaveBeenCalledWith("2026-08-05");
  });

  it("navega entre meses", () => {
    const { onPrev, onNext } = pintar();
    fireEvent.click(screen.getByRole("button", { name: /mes anterior/i }));
    fireEvent.click(screen.getByRole("button", { name: /mes siguiente/i }));
    expect(onPrev).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });
});

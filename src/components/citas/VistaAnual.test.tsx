import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VistaAnual } from "./VistaAnual";
import type { EstadoDia } from "@/lib/agenda";

function pintar(props: Partial<Parameters<typeof VistaAnual>[0]> = {}) {
  const onIrADia = vi.fn();
  const estadoDe =
    props.estadoDe ??
    (() => ({ tipo: "sin_configurar" as EstadoDia["tipo"], conCitas: false }));
  render(<VistaAnual year={2026} todayISO={null} estadoDe={estadoDe} onIrADia={onIrADia} {...props} />);
  return { onIrADia };
}

describe("VistaAnual", () => {
  it("muestra los 12 meses del año", () => {
    pintar();
    expect(screen.getByText(/^enero$/i)).toBeInTheDocument();
    expect(screen.getByText(/^diciembre$/i)).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
  });

  it("colorea los días según su estado", () => {
    const estadoDe = (iso: string) =>
      iso === "2026-03-10"
        ? { tipo: "cerrado" as EstadoDia["tipo"], conCitas: false }
        : iso === "2026-03-12"
          ? { tipo: "patron" as EstadoDia["tipo"], conCitas: true }
          : { tipo: "sin_configurar" as EstadoDia["tipo"], conCitas: false };
    pintar({ estadoDe });
    expect(screen.getByRole("gridcell", { name: "2026-03-10" })).toHaveAttribute(
      "data-estado",
      "cerrado",
    );
    expect(screen.getByRole("gridcell", { name: "2026-03-12" })).toHaveAttribute("data-citas", "true");
  });

  it("al pulsar un día salta a esa fecha", () => {
    const { onIrADia } = pintar();
    fireEvent.click(screen.getByRole("gridcell", { name: "2026-06-15" }));
    expect(onIrADia).toHaveBeenCalledWith("2026-06-15");
  });
});

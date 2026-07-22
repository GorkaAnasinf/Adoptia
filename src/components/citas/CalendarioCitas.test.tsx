import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarioCitas } from "./CalendarioCitas";

describe("CalendarioCitas", () => {
  it("resalta hoy y marca los días con citas", () => {
    render(<CalendarioCitas year={2026} month={6} todayDay={16} diasConCitas={[17, 24]} />);
    // Cabecera del mes (julio de 2026)
    expect(screen.getByText(/julio de 2026/i)).toBeInTheDocument();
    // Hoy marcado con aria-current="date"
    expect(screen.getByRole("gridcell", { name: "16" })).toHaveAttribute("aria-current", "date");
    // Los días con cita llevan un punto (marcado con data-cita)
    expect(screen.getByRole("gridcell", { name: "17" }).querySelector("[data-cita]")).not.toBeNull();
    expect(screen.getByRole("gridcell", { name: "24" }).querySelector("[data-cita]")).not.toBeNull();
    // Un día sin cita no lo lleva
    expect(screen.getByRole("gridcell", { name: "3" }).querySelector("[data-cita]")).toBeNull();
  });
});

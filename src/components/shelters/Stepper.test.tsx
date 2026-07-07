import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  const pasos = ["Entidad", "Ubicación", "Perfil público"];

  it("muestra las etiquetas de todos los pasos", () => {
    render(<Stepper pasos={pasos} actual={1} />);
    for (const p of pasos) expect(screen.getByText(p)).toBeInTheDocument();
  });

  it("marca el paso activo con aria-current", () => {
    render(<Stepper pasos={pasos} actual={1} />);
    const activo = screen.getByText("Ubicación").closest("li");
    expect(activo?.querySelector('[aria-current="step"]')).not.toBeNull();
  });

  it("los pasos previos aparecen como completados (check)", () => {
    const { container } = render(<Stepper pasos={pasos} actual={2} />);
    // dos pasos completados → al menos dos iconos de check (svg)
    const items = container.querySelectorAll("li");
    const completados = Array.from(items).filter((li) =>
      li.querySelector('[data-completado="true"]'),
    );
    expect(completados.length).toBe(2);
  });
});

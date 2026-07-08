import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  const pasos = ["Entidad", "Ubicación", "Perfil público"];

  it("muestra las etiquetas de todos los pasos", () => {
    render(<Stepper pasos={pasos} actual={1} label="Progreso" />);
    for (const p of pasos) expect(screen.getByText(p)).toBeInTheDocument();
  });

  it("marca el paso activo con aria-current", () => {
    render(<Stepper pasos={pasos} actual={1} label="Progreso" />);
    const activo = screen.getByText("Ubicación").closest("li");
    expect(activo?.querySelector('[aria-current="step"]')).not.toBeNull();
  });

  it("los pasos previos aparecen como completados (check)", () => {
    const { container } = render(<Stepper pasos={pasos} actual={2} label="Progreso" />);
    // dos pasos completados → al menos dos iconos de check (svg)
    const items = container.querySelectorAll("li");
    const completados = Array.from(items).filter((li) =>
      li.querySelector('[data-completado="true"]'),
    );
    expect(completados.length).toBe(2);
  });

  it("permite pulsar un paso ya visitado y no uno futuro", async () => {
    const onStepClick = vi.fn();
    render(
      <Stepper
        pasos={pasos}
        actual={2}
        maxAlcanzable={2}
        onStepClick={onStepClick}
        label="Progreso"
      />,
    );
    // El paso 1 (Entidad, índice 0) es alcanzable → botón clicable
    await userEvent.click(screen.getByRole("button", { name: /Entidad — paso 1/i }));
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it("sin onStepClick no hay botones de navegación", () => {
    render(<Stepper pasos={pasos} actual={2} label="Progreso" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

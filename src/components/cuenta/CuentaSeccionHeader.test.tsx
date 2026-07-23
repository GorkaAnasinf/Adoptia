import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CuentaSeccionHeader } from "./CuentaSeccionHeader";

describe("CuentaSeccionHeader", () => {
  it("renderiza el título como encabezado de nivel 1 y el subtítulo", () => {
    render(<CuentaSeccionHeader titulo="Mis favoritos" subtitulo="Los animales que guardaste" />);
    expect(screen.getByRole("heading", { level: 1, name: "Mis favoritos" })).toBeInTheDocument();
    expect(screen.getByText("Los animales que guardaste")).toBeInTheDocument();
  });

  it("muestra la acción cuando se pasa", () => {
    render(
      <CuentaSeccionHeader
        titulo="Mis alertas"
        accion={<button type="button">Crear alerta</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Crear alerta" })).toBeInTheDocument();
  });

  it("sin subtítulo no renderiza párrafo vacío", () => {
    const { container } = render(<CuentaSeccionHeader titulo="Solo título" />);
    expect(container.querySelector("p")).toBeNull();
  });
});

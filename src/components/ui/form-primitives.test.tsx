import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PawPrint } from "lucide-react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ChipGroup, type ChipOption } from "./ChipGroup";
import { FormSection } from "./FormSection";
import { SegmentedControl } from "./SegmentedControl";

describe("FormSection", () => {
  it("muestra icono (oculto), título y descripción", () => {
    render(
      <FormSection icon={PawPrint} title="Tu vivienda" description="Nos ayuda a encajar">
        <p>contenido</p>
      </FormSection>,
    );
    expect(screen.getByRole("heading", { name: "Tu vivienda" })).toBeInTheDocument();
    expect(screen.getByText("Nos ayuda a encajar")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});

const OPS: ChipOption[] = [
  { value: "dog", label: "Perros", icon: PawPrint },
  { value: "cat", label: "Gatos" },
];

describe("ChipGroup", () => {
  it("multiple: alterna la selección añadiendo y quitando valores", async () => {
    function Harness() {
      const [v, setV] = useState<string[]>(["dog"]);
      return <ChipGroup multiple ariaLabel="especies" options={OPS} value={v} onChange={setV} />;
    }
    render(<Harness />);
    const dog = screen.getByRole("checkbox", { name: /Perros/ });
    const cat = screen.getByRole("checkbox", { name: "Gatos" });
    expect(dog).toBeChecked();
    expect(cat).not.toBeChecked();
    await userEvent.click(screen.getByText("Gatos"));
    expect(cat).toBeChecked();
    await userEvent.click(screen.getByText("Perros"));
    expect(dog).not.toBeChecked();
  });

  it("single: selecciona una sola opción (radios)", async () => {
    const onChange = vi.fn();
    render(
      <ChipGroup ariaLabel="tamaño" options={OPS} value="dog" onChange={onChange} />,
    );
    expect(screen.getByRole("radio", { name: /Perros/ })).toBeChecked();
    await userEvent.click(screen.getByText("Gatos"));
    expect(onChange).toHaveBeenCalledWith("cat");
  });
});

describe("SegmentedControl", () => {
  it("marca la opción activa y emite el cambio al pulsar otra", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="vivienda"
        options={[
          { value: "piso", label: "Piso" },
          { value: "casa", label: "Casa" },
        ]}
        value="piso"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("radio", { name: "Piso" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Casa" })).not.toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "Casa" }));
    expect(onChange).toHaveBeenCalledWith("casa");
  });
});

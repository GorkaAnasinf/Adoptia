import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProvinciaCombo } from "./ProvinciaCombo";

describe("ProvinciaCombo", () => {
  it("al enfocar muestra la lista de provincias", async () => {
    render(<ProvinciaCombo id="province" label="Provincia" value="" onChange={() => {}} />);
    await userEvent.click(screen.getByLabelText("Provincia"));
    expect(screen.getByRole("option", { name: /Navarra/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Bizkaia/ })).toBeInTheDocument();
  });

  it("filtra según lo escrito y al elegir llama onChange", async () => {
    const onChange = vi.fn();
    render(<ProvinciaCombo id="province" label="Provincia" value="nav" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("Provincia"));
    const opciones = screen.getAllByRole("option");
    expect(opciones).toHaveLength(1);
    await userEvent.click(screen.getByRole("option", { name: /Navarra/ }));
    expect(onChange).toHaveBeenCalledWith("Navarra");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddressAutocomplete } from "./AddressAutocomplete";

const sugerencia = {
  label: "Calle Iparraguirre 12, 48009, Bilbao",
  address: "Calle Iparraguirre 12",
  city: "Bilbao",
  province: "Bizkaia",
  postalCode: "48009",
  lat: 43.263,
  lng: -2.935,
};

function setup(value = "") {
  const onChange = vi.fn();
  const onSelect = vi.fn();
  const utils = render(
    <AddressAutocomplete
      id="address"
      label="Dirección"
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      searchingLabel="Buscando…"
      noResultsLabel="Sin resultados"
    />,
  );
  return { onChange, onSelect, ...utils };
}

describe("AddressAutocomplete", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ json: async () => ({ data: [sugerencia] }) })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("escribir emite onChange (edición libre)", async () => {
    const { onChange } = setup("");
    await userEvent.type(screen.getByLabelText("Dirección"), "C");
    expect(onChange).toHaveBeenCalled();
  });

  it("con ≥3 caracteres busca y al elegir una sugerencia llama onSelect", async () => {
    const { onSelect } = setup("Calle Iparraguirre");
    const opcion = await screen.findByText(sugerencia.label);
    await userEvent.click(opcion);
    expect(onSelect).toHaveBeenCalledWith(sugerencia);
  });

  it("no busca con menos de 3 caracteres", async () => {
    setup("Ca");
    await waitFor(() => expect(fetch).not.toHaveBeenCalled());
  });
});

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

  it("al teclear ≥3 caracteres busca y al elegir una sugerencia llama onSelect", async () => {
    // value controlado desde el padre: simulamos el tecleo real
    let val = "";
    const onSelect = vi.fn();
    const { rerender } = render(
      <AddressAutocomplete
        id="address"
        label="Dirección"
        value={val}
        onChange={(v) => {
          val = v;
        }}
        onSelect={onSelect}
        searchingLabel="Buscando…"
        noResultsLabel="Sin resultados"
      />,
    );
    const input = screen.getByLabelText("Dirección");
    await userEvent.type(input, "Iparraguirre");
    // reflejar el valor tecleado en el prop controlado
    rerender(
      <AddressAutocomplete
        id="address"
        label="Dirección"
        value="Iparraguirre"
        onChange={(v) => {
          val = v;
        }}
        onSelect={onSelect}
        searchingLabel="Buscando…"
        noResultsLabel="Sin resultados"
      />,
    );
    const opcion = await screen.findByText(sugerencia.label);
    await userEvent.click(opcion);
    expect(onSelect).toHaveBeenCalledWith(sugerencia);
  });

  it("no busca si el valor llega precargado sin teclear (borrador)", async () => {
    setup("Calle Iparraguirre 12");
    await waitFor(() => expect(fetch).not.toHaveBeenCalled());
  });
});

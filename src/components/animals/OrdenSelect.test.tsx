import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { parseAnimalSearch } from "@/lib/animal-search";
import { OrdenSelect } from "./OrdenSelect";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/animales",
}));

function renderOrden(params: Record<string, string> = {}) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <OrdenSelect search={parseAnimalSearch(params)} />
    </NextIntlClientProvider>,
  );
}

describe("OrdenSelect", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("cambiar el orden navega conservando los filtros", async () => {
    renderOrden({ especie: "dog", lat: "43.263", lng: "-2.935" });
    await userEvent.selectOptions(screen.getByLabelText(messages.busqueda.orden), "cercanos");
    expect(replaceMock).toHaveBeenCalledWith(
      "/animales?especie=dog&lat=43.263&lng=-2.935&orden=cercanos",
      { scroll: false },
    );
  });

  it("'Más cercanos' está deshabilitado sin ubicación", () => {
    renderOrden();
    const opcion = screen.getByRole("option", { name: messages.busqueda.ordenCercanos });
    expect(opcion).toBeDisabled();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalesGrid, type AnimalGridRow } from "./AnimalesGrid";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock, push: vi.fn() }) }));

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const base: AnimalGridRow = {
  id: "a1", name: "Luna", slug: "luna-x", sex: "female",
  breed: "Podenco", birth_date_approx: null, status: "available",
  published_at: "2026-01-01", animal_media: [],
};
const rocky: AnimalGridRow = {
  id: "a2", name: "Rocky", slug: "rocky-x", sex: "male",
  breed: "Mestizo", birth_date_approx: null, status: "adopted",
  published_at: null, animal_media: [],
};

describe("AnimalesGrid", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200 })));
    vi.stubGlobal("confirm", vi.fn(() => true));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("la búsqueda filtra por nombre", () => {
    conIntl(<AnimalesGrid animales={[base, rocky]} shelterVerified />);
    fireEvent.change(screen.getByPlaceholderText(messages.animales.searchPlaceholder), {
      target: { value: "luna" },
    });
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.queryByText("Rocky")).not.toBeInTheDocument();
  });

  it("la búsqueda filtra por raza", () => {
    conIntl(<AnimalesGrid animales={[base, rocky]} shelterVerified />);
    fireEvent.change(screen.getByPlaceholderText(messages.animales.searchPlaceholder), {
      target: { value: "mestizo" },
    });
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();
  });

  it("el chip de estado filtra (solo adoptados)", () => {
    conIntl(<AnimalesGrid animales={[base, rocky]} shelterVerified />);
    fireEvent.click(screen.getByRole("button", { name: messages.animales.statusAdopted }));
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();
  });

  it("el borrador muestra 'Borrador' y no ofrece 'Ver ficha'", () => {
    conIntl(<AnimalesGrid animales={[rocky]} shelterVerified />);
    expect(screen.getByText(messages.animales.draft)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: messages.animales.viewProfile })).not.toBeInTheDocument();
  });

  it("el publicado ofrece 'Ver ficha' hacia el perfil público", () => {
    conIntl(<AnimalesGrid animales={[base]} shelterVerified />);
    expect(screen.getByRole("link", { name: messages.animales.viewProfile })).toHaveAttribute(
      "href",
      "/animales/luna-x",
    );
  });

  it("Eliminar pide confirmación y llama a la API con DELETE", async () => {
    conIntl(<AnimalesGrid animales={[base]} shelterVerified />);
    fireEvent.click(screen.getByRole("button", { name: messages.animales.menuLabel }));
    fireEvent.click(screen.getByRole("menuitem", { name: messages.animales.delete }));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/animales/a1", expect.objectContaining({ method: "DELETE" })));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("la tarjeta 'Nueva mascota' enlaza al alta", () => {
    conIntl(<AnimalesGrid animales={[base]} shelterVerified />);
    expect(screen.getByRole("link", { name: messages.animales.newAnimalCard })).toHaveAttribute(
      "href",
      "/panel/animales/nueva",
    );
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AlertaCard, type AlertaVista } from "./AlertaCard";

const refreshMock = vi.fn();
const updateEqMock = vi.fn();
const deleteEqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: updateEqMock }));
const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));
const fromMock = vi.fn(() => ({ update: updateMock, delete: deleteMock }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

function alerta(over: Partial<AlertaVista> = {}): AlertaVista {
  return {
    id: "al1",
    name: "Perros medianos en Madrid",
    active: true,
    createdAt: "2026-07-01T00:00:00Z",
    filters: { especie: "dog", tamano: "medium", sexo: "male", lat: 40.4, lng: -3.7, radio_km: 50 },
    ...over,
  };
}

function renderCard(a: AlertaVista) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AlertaCard alerta={a} />
    </NextIntlClientProvider>,
  );
}

describe("AlertaCard", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    updateEqMock.mockReset().mockResolvedValue({ error: null });
    deleteEqMock.mockReset().mockResolvedValue({ error: null });
    updateMock.mockClear();
    deleteMock.mockClear();
    fromMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pinta un chip por cada filtro real", () => {
    renderCard(alerta());
    expect(screen.getByText("Perro")).toBeInTheDocument();
    expect(screen.getByText("Mediano")).toBeInTheDocument();
    expect(screen.getByText("Macho")).toBeInTheDocument();
    expect(screen.getByText(/a 50 km/)).toBeInTheDocument();
  });

  it("sin ubicación muestra 'Toda España' y la url no lleva distancia", () => {
    renderCard(alerta({ filters: { especie: "cat" } }));
    expect(screen.getByText(messages.account.alertaTodaEspana)).toBeInTheDocument();
    const ver = screen.getByRole("link", { name: messages.account.alertaVerResultados });
    expect(ver).toHaveAttribute("href", "/animales?especie=cat");
  });

  it("'Ver resultados' construye la url con todos los filtros", () => {
    renderCard(alerta());
    const href = screen
      .getByRole("link", { name: messages.account.alertaVerResultados })
      .getAttribute("href")!;
    expect(href).toContain("especie=dog");
    expect(href).toContain("tamano=medium");
    expect(href).toContain("sexo=male");
    expect(href).toContain("distancia=50");
    expect(href).toContain("lat=40.4");
    expect(href).toContain("lng=-3.7");
  });

  it("el interruptor refleja el estado y al pulsarlo alterna 'active'", async () => {
    renderCard(alerta({ active: true }));
    const sw = screen.getByRole("switch");
    expect(sw).toBeChecked();
    await userEvent.click(sw);
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(fromMock).toHaveBeenCalledWith("saved_searches");
    expect(updateMock).toHaveBeenCalledWith({ active: false });
    expect(updateEqMock).toHaveBeenCalledWith("id", "al1");
  });

  it("una alerta pausada muestra el interruptor apagado", () => {
    renderCard(alerta({ active: false }));
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(screen.getByText(messages.account.alertaPausada)).toBeInTheDocument();
  });

  it("'Eliminar' pide confirmación y borra la alerta", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderCard(alerta());
    await userEvent.click(screen.getByRole("button", { name: messages.account.alertaBorrar }));
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(deleteMock).toHaveBeenCalled();
    expect(deleteEqMock).toHaveBeenCalledWith("id", "al1");
  });

  it("si se cancela la confirmación no borra", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderCard(alerta());
    await userEvent.click(screen.getByRole("button", { name: messages.account.alertaBorrar }));
    expect(deleteMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

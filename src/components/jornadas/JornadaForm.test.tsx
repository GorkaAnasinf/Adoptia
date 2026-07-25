import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/components/shelters/MapPinPicker", () => ({
  MapPinPicker: ({ onChange }: { onChange: (c: { lat: number; lng: number }) => void }) => (
    <button type="button" data-testid="pin" onClick={() => onChange({ lat: 36.84, lng: -2.46 })} />
  ),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({ from: vi.fn(), storage: { from: vi.fn() } })),
}));

import { type AnimalOpcion, JornadaForm } from "./JornadaForm";

const animales: AnimalOpcion[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Luna" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Toby" },
];

function renderForm() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <JornadaForm userId="u1" shelterId="s1" animales={animales} />
    </NextIntlClientProvider>,
  );
}

describe("JornadaForm", () => {
  it("muestra las cuatro secciones del formulario", () => {
    renderForm();
    expect(screen.getByText("Datos de la jornada")).toBeInTheDocument();
    expect(screen.getByText("Ubicación")).toBeInTheDocument();
    expect(screen.getByText("Animales que van")).toBeInTheDocument();
    expect(screen.getByText("Cartel")).toBeInTheDocument();
  });

  it("lista los animales de la protectora como opciones", () => {
    renderForm();
    expect(screen.getByLabelText("Luna")).toBeInTheDocument();
    expect(screen.getByLabelText("Toby")).toBeInTheDocument();
  });

  it("no deja publicar sin ubicación y lo habilita al situar el punto", async () => {
    renderForm();
    const publicar = screen.getByRole("button", { name: "Publicar" });
    expect(publicar).toBeDisabled();
    await userEvent.click(screen.getByTestId("pin"));
    expect(publicar).toBeEnabled();
  });

  it("exige título al guardar el borrador", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(screen.getByText("Ponle un título a la jornada.")).toBeInTheDocument();
  });
});

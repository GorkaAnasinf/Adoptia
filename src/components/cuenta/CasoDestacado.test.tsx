import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterAll, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { CasoDestacado } from "./CasoDestacado";

function conIntl(animal: Parameters<typeof CasoDestacado>[0]["animal"]) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages} timeZone="Europe/Madrid">
      <CasoDestacado animal={animal} />
    </NextIntlClientProvider>,
  );
}

const animalHace = (dias: number, extra: Record<string, unknown> = {}) => ({
  name: "Koda",
  slug: "koda",
  published_at: new Date(Date.now() - dias * 86_400_000).toISOString(),
  foto: "https://ejemplo.test/koda.jpg",
  ...extra,
});

describe("CasoDestacado", () => {
  vi.setSystemTime(new Date("2026-07-20T10:00:00Z"));
  afterAll(() => vi.useRealTimers());

  it("no renderiza nada si no hay animal destacado", () => {
    const { container } = conIntl(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("cuenta los días que lleva esperando desde su publicación", () => {
    conIntl(animalHace(200));
    expect(screen.getByText("Lleva 200 días esperando a una familia.")).toBeInTheDocument();
  });

  it("singulariza el día cuando solo lleva uno", () => {
    conIntl(animalHace(1));
    expect(screen.getByText("Lleva 1 día esperando a una familia.")).toBeInTheDocument();
  });

  it("enlaza a la ficha del animal", () => {
    conIntl(animalHace(30));
    expect(screen.getByRole("link", { name: /Conocer a Koda/ })).toHaveAttribute("href", "/animales/koda");
  });

  it("no promete urgencia: la etiqueta habla del tiempo de espera", () => {
    conIntl(animalHace(30));
    expect(screen.getByText("Lleva más tiempo esperando")).toBeInTheDocument();
    expect(screen.queryByText(/urgente/i)).not.toBeInTheDocument();
  });

  it("cae a un marcador de posición cuando la foto no es válida", () => {
    conIntl(animalHace(10, { foto: null }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Conocer a Koda/ })).toBeInTheDocument();
  });
});

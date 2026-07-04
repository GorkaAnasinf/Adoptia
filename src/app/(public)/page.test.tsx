import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import HomePage from "./page";

function renderHome() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <HomePage />
    </NextIntlClientProvider>,
  );
}

describe("Home", () => {
  it("muestra el titular de bienvenida desde messages/es.json", () => {
    renderHome();
    expect(
      screen.getByRole("heading", { level: 1, name: messages.home.title }),
    ).toBeInTheDocument();
  });

  it("muestra el CTA principal de ver animales", () => {
    renderHome();
    expect(
      screen.getByRole("link", { name: messages.home.cta }),
    ).toBeInTheDocument();
  });
});

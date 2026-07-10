import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../messages/es.json";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
}));

import NotFound from "./not-found";

describe("Página 404", () => {
  it("muestra mensaje amable y navegación de escape", async () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        {await NotFound()}
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("heading", { name: messages.errors.notFoundTitle }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.errors.backHome })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: messages.errors.seeAnimals })).toHaveAttribute(
      "href",
      "/animales",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const countMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: countMock,
    })),
  })),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => {
    return (key: string, values?: Record<string, unknown>) => {
      const raw = key
        .split(".")
        .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], messages);
      let text = String(raw);
      for (const [k, v] of Object.entries(values ?? {})) {
        text = text.replace(`{${k}}`, String(v));
      }
      return text;
    };
  }),
}));

import HomePage from "./page";

describe("Home", () => {
  beforeEach(() => {
    countMock.mockReset();
    countMock.mockResolvedValue({ count: 12, error: null });
  });

  it("muestra el titular de bienvenida desde messages/es.json", async () => {
    render(await HomePage());
    expect(
      screen.getByRole("heading", { level: 1, name: messages.home.title }),
    ).toBeInTheDocument();
  });

  it("muestra el CTA principal de ver animales", async () => {
    render(await HomePage());
    expect(
      screen.getByRole("link", { name: messages.home.cta }),
    ).toBeInTheDocument();
  });

  it("muestra el contador de animales leído de Supabase", async () => {
    render(await HomePage());
    expect(screen.getByTestId("animal-count")).toHaveTextContent("12");
  });

  it("oculta el contador si Supabase no está disponible", async () => {
    countMock.mockRejectedValue(new Error("sin conexión"));
    render(await HomePage());
    expect(screen.queryByTestId("animal-count")).not.toBeInTheDocument();
  });
});

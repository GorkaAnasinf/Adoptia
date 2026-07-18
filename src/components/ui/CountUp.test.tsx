import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CountUp } from "./CountUp";

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

/** IntersectionObserver controlable: guarda el callback para dispararlo a mano. */
function stubIO() {
  let callback: IOCallback = () => {};
  const observe = vi.fn();
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IOCallback) {
        callback = cb;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
    },
  );
  return { intersecta: () => callback([{ isIntersecting: true }]) };
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

describe("CountUp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sin IntersectionObserver muestra el valor final directamente", () => {
    stubReducedMotion(false);
    render(<CountUp value={140} />);
    expect(screen.getByText("140")).toBeInTheDocument();
  });

  it("con prefers-reduced-motion no anima: valor final desde el principio", () => {
    stubIO();
    stubReducedMotion(true);
    render(<CountUp value={140} />);
    expect(screen.getByText("140")).toBeInTheDocument();
  });

  it("con animación pendiente muestra 0 hasta intersectar (no adelanta el final)", () => {
    stubIO();
    stubReducedMotion(false);
    render(<CountUp value={140} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("140")).not.toBeInTheDocument();
  });

  it("al entrar en viewport anima y termina en el valor real", async () => {
    const io = stubIO();
    stubReducedMotion(false);
    render(<CountUp value={140} durationMs={30} />);
    io.intersecta();
    await waitFor(() => expect(screen.getByText("140")).toBeInTheDocument());
  });
});

import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./Reveal";

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

function stubIO() {
  let callback: IOCallback = () => {};
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IOCallback) {
        callback = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    },
  );
  return { intersecta: () => act(() => callback([{ isIntersecting: true }])) };
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

describe("Reveal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("el contenido está en el DOM desde el primer render (SEO y lectores)", () => {
    stubIO();
    stubReducedMotion(false);
    render(
      <Reveal>
        <p>contenido-revelable</p>
      </Reveal>,
    );
    expect(screen.getByText("contenido-revelable")).toBeInTheDocument();
  });

  it("antes de intersectar está oculto solo visualmente y al intersectar se revela", () => {
    const io = stubIO();
    stubReducedMotion(false);
    const { container } = render(
      <Reveal>
        <p>contenido-revelable</p>
      </Reveal>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("motion-safe:opacity-0");
    io.intersecta();
    expect(wrapper.className).not.toContain("motion-safe:opacity-0");
  });

  it("con prefers-reduced-motion se muestra sin animación desde el principio", () => {
    stubIO();
    stubReducedMotion(true);
    const { container } = render(
      <Reveal>
        <p>contenido-revelable</p>
      </Reveal>,
    );
    expect((container.firstElementChild as HTMLElement).className).not.toContain(
      "motion-safe:opacity-0",
    );
  });
});

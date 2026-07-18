import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Parallax } from "./Parallax";

function stubMedia({ reduce, desktop }: { reduce: boolean; desktop: boolean }) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("reduced-motion") ? reduce : desktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
}

function scrollA(y: number) {
  act(() => {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("Parallax", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("en desktop desplaza el fondo a una fracción del scroll", () => {
    stubMedia({ reduce: false, desktop: true });
    const { container } = render(
      <Parallax factor={0.5}>
        <p>fondo</p>
      </Parallax>,
    );
    scrollA(100);
    expect((container.firstElementChild as HTMLElement).style.transform).toBe(
      "translateY(50px)",
    );
  });

  it("con prefers-reduced-motion no toca el transform", () => {
    stubMedia({ reduce: true, desktop: true });
    const { container } = render(
      <Parallax factor={0.5}>
        <p>fondo</p>
      </Parallax>,
    );
    scrollA(100);
    expect((container.firstElementChild as HTMLElement).style.transform).toBe("");
  });
});

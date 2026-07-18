import { render } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { HeaderScrollEffect } from "./HeaderScrollEffect";

function scrollA(y: number) {
  act(() => {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("HeaderScrollEffect", () => {
  it("marca el header con data-scrolled al bajar y lo limpia arriba del todo", () => {
    render(
      <header data-app-header>
        <HeaderScrollEffect />
      </header>,
    );
    const header = document.querySelector("header[data-app-header]") as HTMLElement;
    expect(header.hasAttribute("data-scrolled")).toBe(false);

    scrollA(80);
    expect(header.hasAttribute("data-scrolled")).toBe(true);

    scrollA(0);
    expect(header.hasAttribute("data-scrolled")).toBe(false);
  });
});

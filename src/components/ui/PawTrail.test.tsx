import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PawTrail } from "./PawTrail";

describe("PawTrail", () => {
  it("es puramente decorativo: aria-hidden y sin texto accesible", () => {
    const { container } = render(<PawTrail />);
    const raiz = container.firstElementChild as HTMLElement;
    expect(raiz.getAttribute("aria-hidden")).toBe("true");
    expect(raiz.textContent?.trim()).toBe("");
  });
});

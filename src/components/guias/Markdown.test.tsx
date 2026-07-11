import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { Markdown, parseBloques } from "./Markdown";

const CUERPO = `Párrafo inicial con **negrita** y un [enlace interno](/animales).

## Sección uno

- item a
- item b

> Esto es un aviso importante.

- [ ] tarea uno
- [x] tarea dos

1. primero
2. segundo
`;

describe("parseBloques", () => {
  it("reconoce todos los tipos de bloque", () => {
    const tipos = parseBloques(CUERPO).map((b) => b.tipo);
    expect(tipos).toEqual(["p", "h2", "ul", "aviso", "checklist", "ol"]);
  });
});

describe("Markdown", () => {
  it("renderiza encabezados con ancla, avisos y checklists", () => {
    render(<Markdown cuerpo={CUERPO} />);
    const h2 = screen.getByRole("heading", { level: 2, name: "Sección uno" });
    expect(h2).toHaveAttribute("id", "seccion-uno");
    expect(screen.getByRole("note")).toHaveTextContent("aviso importante");
    expect(screen.getByText("tarea uno")).toBeInTheDocument();
    expect(screen.getByText("negrita").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "enlace interno" })).toHaveAttribute(
      "href",
      "/animales",
    );
  });
});

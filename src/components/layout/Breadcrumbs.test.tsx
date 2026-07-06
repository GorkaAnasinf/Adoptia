import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  const items = [
    { label: "Panel", href: "/panel" },
    { label: "Alta de protectora", href: "/panel/alta" },
    { label: "Ubicación" },
  ];

  it("renderiza todas las migas", () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(screen.getByText("Alta de protectora")).toBeInTheDocument();
    expect(screen.getByText("Ubicación")).toBeInTheDocument();
  });

  it("las intermedias son enlaces y la última no (aria-current)", () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole("link", { name: "Panel" })).toHaveAttribute("href", "/panel");
    expect(screen.queryByRole("link", { name: "Ubicación" })).not.toBeInTheDocument();
    expect(screen.getByText("Ubicación")).toHaveAttribute("aria-current", "page");
  });

  it("expone una navegación accesible", () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});

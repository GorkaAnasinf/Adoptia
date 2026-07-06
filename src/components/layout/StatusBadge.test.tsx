import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { StatusBadge } from "./StatusBadge";

function renderBadge(status: "verified" | "pending" | "suspended") {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <StatusBadge status={status} />
    </NextIntlClientProvider>,
  );
}

describe("StatusBadge", () => {
  it("verificada muestra la etiqueta correcta", () => {
    renderBadge("verified");
    expect(screen.getByText(messages.shell.statusVerified)).toBeInTheDocument();
  });

  it("en revisión muestra la etiqueta correcta", () => {
    renderBadge("pending");
    expect(screen.getByText(messages.shell.statusPending)).toBeInTheDocument();
  });

  it("suspendida muestra la etiqueta correcta", () => {
    renderBadge("suspended");
    expect(screen.getByText(messages.shell.statusSuspended)).toBeInTheDocument();
  });

  it("no renderiza nada si no hay estado", () => {
    const { container } = render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <StatusBadge status={null} />
      </NextIntlClientProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

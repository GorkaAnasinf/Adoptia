import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { TriToggle } from "./TriToggle";

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("TriToggle", () => {
  it("emite true / false / null al pulsar cada opción", async () => {
    const onChange = vi.fn();
    conIntl(<TriToggle label="Bien con niños" value={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: messages.animales.triYes }));
    await userEvent.click(screen.getByRole("button", { name: messages.animales.triNo }));
    await userEvent.click(screen.getByRole("button", { name: messages.animales.triUnknown }));

    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, false);
    expect(onChange).toHaveBeenNthCalledWith(3, null);
  });

  it("marca aria-pressed en la opción activa", () => {
    conIntl(<TriToggle label="Bien con perros" value={false} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: messages.animales.triNo })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

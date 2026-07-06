import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { OpeningHoursEditor } from "./OpeningHoursEditor";
import type { OpeningHours } from "@/lib/schemas/shelter";

function Harness({ inicial = {} as OpeningHours }) {
  const [value, setValue] = useState<OpeningHours>(inicial);
  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      <OpeningHoursEditor value={value} onChange={setValue} />
      <output data-testid="serializado">{JSON.stringify(value)}</output>
    </NextIntlClientProvider>
  );
}

function leerValor() {
  return JSON.parse(screen.getByTestId("serializado").textContent ?? "{}");
}

describe("OpeningHoursEditor", () => {
  it("muestra los siete días de la semana", () => {
    render(<Harness />);
    for (const dia of ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]) {
      expect(screen.getByText(dia)).toBeInTheDocument();
    }
  });

  it("añade una franja a un día", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const lunes = screen.getByRole("group", { name: "Lunes" });
    await user.click(within(lunes).getByRole("button", { name: /añadir franja/i }));
    expect(leerValor().lun).toHaveLength(1);
  });

  it("edita las horas y las serializa", async () => {
    const user = userEvent.setup();
    render(<Harness inicial={{ lun: [{ open: "10:00", close: "14:00" }] }} />);
    const lunes = screen.getByRole("group", { name: "Lunes" });
    const [apertura, cierre] = within(lunes).getAllByLabelText(/apertura|cierre/i) as HTMLInputElement[];
    expect(apertura.value).toBe("10:00");
    expect(cierre.value).toBe("14:00");
    await user.clear(cierre);
    await user.type(cierre, "13:30");
    expect(leerValor().lun[0].close).toBe("13:30");
  });

  it("muestra error si el cierre es anterior a la apertura", () => {
    render(<Harness inicial={{ lun: [{ open: "20:00", close: "10:00" }] }} />);
    expect(screen.getByText(/el cierre debe ser posterior/i)).toBeInTheDocument();
  });

  it("elimina una franja", async () => {
    const user = userEvent.setup();
    render(<Harness inicial={{ lun: [{ open: "10:00", close: "14:00" }] }} />);
    const lunes = screen.getByRole("group", { name: "Lunes" });
    await user.click(within(lunes).getByRole("button", { name: /eliminar franja/i }));
    expect(leerValor().lun ?? []).toHaveLength(0);
  });
});

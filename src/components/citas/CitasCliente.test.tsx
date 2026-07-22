import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { CitasCliente, type CitaVista } from "./CitasCliente";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const prox: CitaVista = {
  id: "c1",
  status: "confirmed",
  starts_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  cancel_reason: null,
  adopterName: "Sergio Montes",
  animal: { name: "Luna", slug: "luna", cover: null },
};
const pas: CitaVista = {
  id: "c2",
  status: "no_show",
  starts_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  cancel_reason: null,
  adopterName: "Familia García",
  animal: { name: "Oreo", slug: "oreo", cover: null },
};

function conIntl(ui: React.ReactElement) {
  return render(<NextIntlClientProvider locale="es" messages={messages}>{ui}</NextIntlClientProvider>);
}

describe("CitasCliente", () => {
  it("pestaña Próximas muestra la cita activa con acciones", () => {
    conIntl(<CitasCliente proximas={[prox]} pasadas={[pas]} />);
    expect(screen.getByText("Cita para conocer a Luna")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.citas.marcarRealizada })).toBeInTheDocument();
    expect(screen.queryByText("Cita para conocer a Oreo")).not.toBeInTheDocument();
  });

  it("al cambiar a Pasadas muestra el historial sin acciones", () => {
    conIntl(<CitasCliente proximas={[prox]} pasadas={[pas]} />);
    fireEvent.click(screen.getByRole("tab", { name: messages.citas.pasadas }));
    expect(screen.getByText("Cita para conocer a Oreo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: messages.citas.marcarRealizada })).not.toBeInTheDocument();
  });
});

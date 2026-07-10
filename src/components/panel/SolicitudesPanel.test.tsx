import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { SolicitudesPanel, type SolicitudRow } from "./SolicitudesPanel";

const { fetchMock, refreshMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const solicitudes: SolicitudRow[] = [
  {
    id: "req1",
    status: "pending",
    created_at: "2026-07-01T10:00:00.000Z",
    message: "Quiero mucho a Pipa",
    shelter_notes: null,
    questionnaire: {
      vivienda: "piso",
      regimen: "propiedad",
      convivientes: 2,
      ninos_edades: [],
      otros_animales: "",
      experiencia: "primera vez",
      horas_solo: 3,
      todos_de_acuerdo: true,
    },
    adopterName: "Marta",
    animal: { id: "a1", name: "Pipa", slug: "pipa-abc", status: "available" },
  },
  {
    id: "req2",
    status: "approved",
    created_at: "2026-07-02T10:00:00.000Z",
    message: null,
    shelter_notes: "Ya contactada",
    questionnaire: null,
    adopterName: "Juan",
    animal: { id: "a1", name: "Pipa", slug: "pipa-abc", status: "reserved" },
  },
];

function renderPanel(rows: SolicitudRow[] = solicitudes) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <SolicitudesPanel solicitudes={rows} />
    </NextIntlClientProvider>,
  );
}

describe("SolicitudesPanel", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: "req1", status: "approved" } }),
    });
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("agrupa las solicitudes por animal en la lista", () => {
    renderPanel();
    const lista = screen.getByRole("list", { name: /solicitudes/i });
    expect(within(lista).getAllByText("Pipa").length).toBeGreaterThan(0);
    expect(within(lista).getByText("Marta")).toBeInTheDocument();
    expect(within(lista).getByText("Juan")).toBeInTheDocument();
  });

  it("sin selección muestra el mensaje de elegir una solicitud", () => {
    renderPanel();
    expect(screen.getByText(/selecciona una solicitud/i)).toBeInTheDocument();
  });

  it("al seleccionar una solicitud muestra el cuestionario y el mensaje", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText("Marta"));
    expect(screen.getByText("Quiero mucho a Pipa")).toBeInTheDocument();
    expect(screen.getByText(/primera vez/)).toBeInTheDocument();
  });

  it("aprobar/rechazar están habilitados solo si está pendiente", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText("Marta"));
    expect(screen.getByRole("button", { name: /aprobar/i })).toBeEnabled();

    await user.click(screen.getByText("Juan"));
    expect(screen.queryByRole("button", { name: /aprobar/i })).not.toBeInTheDocument();
  });

  it("aprobar llama al PATCH con accion approve", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText("Marta"));
    await user.click(screen.getByRole("button", { name: /aprobar/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/solicitudes/req1", expect.any(Object)));
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({ accion: "approve" });
  });

  it("rechazar exige motivo antes de confirmar", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText("Marta"));
    await user.click(screen.getByRole("button", { name: /^rechazar$/i }));
    await user.click(screen.getByRole("button", { name: /confirmar rechazo/i }));
    // sin motivo, no debe llamar a fetch
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText(/explica el motivo/i), "No cumple requisitos");
    await user.click(screen.getByRole("button", { name: /confirmar rechazo/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({ accion: "reject", motivo: "No cumple requisitos" });
  });

  it("guardar notas internas envía accion note", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByText("Marta"));
    await user.type(screen.getByPlaceholderText(/notas privadas/i), "Familia genial");
    await user.click(screen.getByRole("button", { name: /guardar notas/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({ accion: "note", nota: "Familia genial" });
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";

const { onChangePin } = vi.hoisted(() => ({ onChangePin: { fn: null as unknown } }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

// El picker real monta Leaflet: lo sustituimos por un botón que emite un pin.
vi.mock("@/components/shelters/MapPinPicker", () => ({
  MapPinPicker: ({ onChange }: { onChange: (c: { lat: number; lng: number }) => void }) => {
    onChangePin.fn = onChange;
    return (
      <button type="button" onClick={() => onChange({ lat: 43.2673, lng: -2.9401 })}>
        pin-falso
      </button>
    );
  },
}));

import { NuevoAvistamientoForm } from "./NuevoAvistamientoForm";

function renderForm() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <NuevoAvistamientoForm avisoId="p1" />
    </NextIntlClientProvider>,
  );
}

async function abrir(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: messages.perdidos.avistamiento }));
}

describe("NuevoAvistamientoForm", () => {
  beforeEach(() => {
    onChangePin.fn = null;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { id: "s1" } }), { status: 201 })));
  });

  it("no envía sin pin en el mapa", async () => {
    const user = userEvent.setup();
    renderForm();
    await abrir(user);
    await user.click(screen.getByRole("button", { name: messages.perdidos.avistamientoEnviar }));
    expect(await screen.findByText(messages.perdidos.avistamientoFaltaPin)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("avisa de que la ubicación se redondea antes de enviarla", async () => {
    const user = userEvent.setup();
    renderForm();
    await abrir(user);
    expect(screen.getByText(messages.perdidos.avistamientoPinHelp)).toBeInTheDocument();
  });

  it("envía el avistamiento con pin y fecha, y confirma", async () => {
    const user = userEvent.setup();
    renderForm();
    await abrir(user);
    await user.click(screen.getByRole("button", { name: "pin-falso" }));
    await user.type(
      screen.getByLabelText(messages.perdidos.avistamientoNota),
      "Iba hacia el río",
    );
    await user.click(screen.getByRole("button", { name: messages.perdidos.avistamientoEnviar }));

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/perdidos/p1/avistamientos");
    const cuerpo = JSON.parse((init as RequestInit).body as string);
    expect(cuerpo.lat).toBeCloseTo(43.2673);
    expect(cuerpo.lng).toBeCloseTo(-2.9401);
    expect(cuerpo.nota).toBe("Iba hacia el río");
    expect(Date.parse(cuerpo.seen_at)).toBeLessThanOrEqual(Date.now() + 1000);

    expect(await screen.findByText(messages.perdidos.avistamientoOk)).toBeInTheDocument();
  });

  it("no envía con una fecha futura", async () => {
    const user = userEvent.setup();
    renderForm();
    await abrir(user);
    await user.click(screen.getByRole("button", { name: "pin-falso" }));
    const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
    // `datetime-local` no admite user.type carácter a carácter en jsdom.
    const campo = screen.getByLabelText(messages.perdidos.avistamientoCuando) as HTMLInputElement;
    fireEvent.change(campo, { target: { value: manana } });
    expect(campo.value).toBe(manana);
    await user.click(screen.getByRole("button", { name: messages.perdidos.avistamientoEnviar }));
    expect(await screen.findByText(messages.perdidos.avistamientoFechaFutura)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("traduce el 429 del servidor a un aviso comprensible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: { code: "rate_limited" } }), { status: 429 })),
    );
    const user = userEvent.setup();
    renderForm();
    await abrir(user);
    await user.click(screen.getByRole("button", { name: "pin-falso" }));
    await user.click(screen.getByRole("button", { name: messages.perdidos.avistamientoEnviar }));
    expect(await screen.findByText(messages.perdidos.avistamientoLimite)).toBeInTheDocument();
  });
});

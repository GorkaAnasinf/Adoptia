import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import type { FosterHome } from "./AcogidaForm";
import { MisAcogidasCliente } from "./MisAcogidasCliente";
import type { PropuestaRecibida } from "./PropuestasRecibidas";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/components/shelters/MapPinPicker", () => ({
  MapPinPicker: () => <div data-testid="pin" />,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

const REGISTRO: FosterHome = {
  user_id: "u1",
  city: "Bilbao",
  radius_km: 25,
  condiciones: { especies: ["dog"], vivienda: "casa", jardin: true },
  active: true,
};

const PROPUESTA: PropuestaRecibida = {
  id: "p1",
  duracion: "2 semanas",
  mensaje: "Camada de cachorros",
  status: "enviada",
  created_at: "2026-07-15T10:00:00Z",
  shelters: { name: "Protectora Bilbao", slug: "protectora-bilbao" },
  animals: { name: "Trufa" },
};

function renderCliente(over: {
  existente?: FosterHome | null;
  propuestas?: PropuestaRecibida[];
} = {}) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <MisAcogidasCliente
        userId="u1"
        existente={over.existente ?? null}
        propuestas={over.propuestas ?? []}
      />
    </NextIntlClientProvider>,
  );
}

describe("MisAcogidasCliente", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sin registro arranca en 'Mi registro' con el formulario de alta", () => {
    renderCliente();
    expect(screen.getByRole("tab", { name: messages.acogida.tabRegistro })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: messages.acogida.registrar })).toBeInTheDocument();
  });

  it("sin registro, la pestaña de propuestas invita a registrarse", async () => {
    const user = userEvent.setup();
    renderCliente();
    await user.click(screen.getByRole("tab", { name: messages.acogida.tabPropuestas }));
    expect(screen.getByText(messages.acogida.propuestasSinRegistro)).toBeInTheDocument();
  });

  it("con registro arranca en 'Propuestas' con la lista y el badge de nuevas", () => {
    renderCliente({ existente: REGISTRO, propuestas: [PROPUESTA] });
    expect(screen.getByRole("tab", { name: /Propuestas recibidas/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText(/Protectora Bilbao/)).toBeInTheDocument();
    expect(screen.getByText(/Trufa/)).toBeInTheDocument();
    // 1 propuesta en estado "enviada" → badge "1 nueva".
    expect(screen.getByText("1 nueva")).toBeInTheDocument();
    // El formulario (pausar/baja) no está montado hasta cambiar de pestaña.
    expect(screen.queryByRole("button", { name: messages.acogida.pausar })).not.toBeInTheDocument();
  });

  it("cada propuesta ofrece contactar con el refugio en su perfil", () => {
    renderCliente({ existente: REGISTRO, propuestas: [PROPUESTA] });
    expect(
      screen.getByRole("link", { name: messages.acogida.contactarRefugio }),
    ).toHaveAttribute("href", "/protectoras/protectora-bilbao");
  });

  it("con registro, la pestaña 'Mi registro' muestra pausar y baja", async () => {
    const user = userEvent.setup();
    renderCliente({ existente: REGISTRO, propuestas: [PROPUESTA] });
    await user.click(screen.getByRole("tab", { name: messages.acogida.tabRegistro }));
    expect(screen.getByText(messages.acogida.estadoActivo)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.acogida.pausar })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.acogida.baja })).toBeInTheDocument();
  });
});

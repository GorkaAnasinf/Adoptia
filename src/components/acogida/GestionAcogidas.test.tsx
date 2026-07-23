import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { GestionAcogidas } from "./GestionAcogidas";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
  })),
}));

const ANE = {
  user_id: "u9",
  full_name: "Ane Acogedora",
  city: "Bilbao",
  distance_km: 4.2,
  radius_km: 25,
  condiciones: {
    especies: ["dog", "cat"],
    vivienda: "casa",
    jardin: true,
    otros_animales: "Un gato tranquilo",
    notas: "Mejor findes",
  },
  created_at: "2026-07-10T10:00:00Z",
};

const JON = {
  user_id: "u8",
  full_name: "Jon Piso",
  city: "Getxo",
  distance_km: 18.0,
  radius_km: 30,
  condiciones: { especies: ["cat"], vivienda: "piso", jardin: false, notas: "Solo gatos" },
  created_at: "2026-07-12T10:00:00Z",
};

const PROPUESTA = {
  id: "p1",
  foster_user_id: "u9",
  duracion: "2 semanas",
  mensaje: "Camada de cachorros",
  status: "enviada",
  created_at: "2026-07-15T10:00:00Z",
  relevo_pedido_at: null,
  relevo_motivo: null,
  relevo_fecha_limite: null,
  animals: { name: "Trufa" },
};

function renderGestion(props?: {
  acogedores?: unknown[];
  animales?: unknown[];
  propuestas?: unknown[];
}) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <GestionAcogidas
        acogedores={(props?.acogedores ?? [ANE, JON]) as never}
        animales={(props?.animales ?? [{ id: "a1", name: "Trufa" }]) as never}
        propuestas={(props?.propuestas ?? []) as never}
      />
    </NextIntlClientProvider>,
  );
}

describe("GestionAcogidas", () => {
  it("muestra los acogedores recibidos con distancia, vivienda y preferencias", () => {
    renderGestion();
    expect(screen.getByText("Ane Acogedora")).toBeInTheDocument();
    expect(screen.getByText(/a 4.2 km/)).toBeInTheDocument();
    expect(screen.getByText(messages.acogida.viviendaCasa)).toBeInTheDocument();
    // La preferencia de especies aparece como texto en la card
    expect(screen.getAllByText(/Perros/).length).toBeGreaterThan(0);
  });

  it("expande el perfil completo del acogedor al pulsar el botón", async () => {
    const user = userEvent.setup();
    renderGestion({ acogedores: [ANE] });
    // Los detalles ampliados no están visibles de inicio
    expect(screen.queryByText(/Un gato tranquilo/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: messages.acogida.verPerfil }));
    expect(screen.getByText(/Un gato tranquilo/)).toBeInTheDocument();
  });

  it("filtra por distancia máxima con el deslizador", async () => {
    const { fireEvent } = await import("@testing-library/react");
    renderGestion();
    expect(screen.getByText("Jon Piso")).toBeInTheDocument();
    const slider = screen.getByRole("slider", { name: messages.acogida.filtroDistancia });
    // Baja el máximo a 10 km: Jon (18 km) desaparece, Ane (4.2 km) permanece
    fireEvent.change(slider, { target: { value: "10" } });
    expect(screen.queryByText("Jon Piso")).not.toBeInTheDocument();
    expect(screen.getByText("Ane Acogedora")).toBeInTheDocument();
  });

  it("filtra por tipo de animal con los chips", async () => {
    const user = userEvent.setup();
    renderGestion();
    // Activa solo "Perros": Jon (solo gatos) desaparece
    await user.click(screen.getByRole("button", { name: messages.acogida.especieDog }));
    expect(screen.queryByText("Jon Piso")).not.toBeInTheDocument();
    expect(screen.getByText("Ane Acogedora")).toBeInTheDocument();
  });

  it("con propuesta activa muestra el estado en vez del botón de proponer", () => {
    renderGestion({ acogedores: [ANE], propuestas: [PROPUESTA] });
    expect(
      screen.queryByRole("button", { name: messages.acogida.contactar }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(messages.acogida.cardEnRevision)).toBeInTheDocument();
  });

  it("la pestaña de enviadas muestra card con acogedor, animal, duración, mensaje y acciones", async () => {
    const user = userEvent.setup();
    renderGestion({ acogedores: [ANE], propuestas: [PROPUESTA] });
    await user.click(screen.getByRole("tab", { name: messages.acogida.tabEnviadas }));
    const region = screen.getByRole("tabpanel");
    expect(within(region).getByText("Ane Acogedora")).toBeInTheDocument();
    expect(within(region).getByText(/Trufa/)).toBeInTheDocument();
    expect(within(region).getByText(/2 semanas/)).toBeInTheDocument();
    // La cita del mensaje enviado se muestra en la card
    expect(within(region).getByText(/Camada de cachorros/)).toBeInTheDocument();
    expect(within(region).getByText(messages.acogida.estadoPropuestaEnviada)).toBeInTheDocument();
    expect(
      within(region).getByRole("button", { name: messages.acogida.marcarAceptada }),
    ).toBeInTheDocument();
  });

  it("sin acogedores muestra el estado vacío", () => {
    renderGestion({ acogedores: [] });
    expect(screen.getByText(messages.acogida.panelEmpty)).toBeInTheDocument();
  });
});

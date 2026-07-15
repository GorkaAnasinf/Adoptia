import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/es.json";

const { maybeSingleMock, getUserMock, rpcMock } = vi.hoisted(() => ({
  maybeSingleMock: vi.fn(),
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/components/map/MiniMapa", () => ({
  MiniMapa: () => <div data-testid="mini-mapa" />,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: maybeSingleMock })) })),
    })),
  })),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
  getFormatter: vi.fn(async () => {
    const { createFormatter } = await import("next-intl");
    return createFormatter({ locale: "es" });
  }),
}));

import AvisoPage from "./page";

const AVISO = {
  id: "p1",
  user_id: "autor1",
  type: "lost",
  species: "dog",
  name: "Rocky",
  description: "Se perdió en el parque",
  photo_url: null,
  city: "Bilbao",
  status: "open",
  resolution_story: null,
  location: null,
  created_at: "2026-07-10T10:00:00Z",
  contact_phone: null,
  allow_contact: true,
};

const AVISTAMIENTO = {
  id: "s1",
  seen_at: "2026-07-12T18:30:00Z",
  note: "Bebiendo en la fuente",
  photo_url: null,
  lat: 43.264,
  lng: -2.934,
  created_at: "2026-07-12T18:40:00Z",
};

async function renderPagina() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await AvisoPage({ params: Promise.resolve({ id: "p1" }) })}
    </NextIntlClientProvider>,
  );
}

describe("Detalle de aviso de perdidos", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: AVISO, error: null });
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "autor1" } } });
    rpcMock.mockReset().mockResolvedValue({ data: [], error: null });
  });

  it("el autor de un aviso abierto puede resolverlo", async () => {
    await renderPagina();
    expect(screen.getByRole("heading", { name: "Rocky" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.perdidos.resolver })).toBeInTheDocument();
  });

  it("un visitante no ve el botón de resolver", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await renderPagina();
    expect(
      screen.queryByRole("button", { name: messages.perdidos.resolver }),
    ).not.toBeInTheDocument();
  });

  it("un aviso resuelto muestra el badge y la historia", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { ...AVISO, status: "resolved", resolution_story: "¡Apareció en el garaje!" },
      error: null,
    });
    await renderPagina();
    expect(screen.getByText(messages.perdidos.resueltoBadge)).toBeInTheDocument();
    expect(screen.getByText(/garaje/)).toBeInTheDocument();
  });

  // FEATURE-022
  it("un visitante con cuenta puede escribir al autor y reportar un avistamiento", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "vecino1" } } });
    await renderPagina();
    expect(screen.getByRole("button", { name: messages.perdidos.contactar })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.perdidos.avistamiento }),
    ).toBeInTheDocument();
  });

  it("sin sesión, ayudar lleva a login y de vuelta a la ficha", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await renderPagina();
    expect(screen.queryByRole("button", { name: messages.perdidos.contactar })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.perdidos.entrarParaAyudar })).toHaveAttribute(
      "href",
      "/login?redirect=%2Fperdidos-encontrados%2Fp1",
    );
  });

  it("el autor no se escribe a sí mismo: ve su aviso sin botón de contacto", async () => {
    await renderPagina(); // sesión = autor1
    expect(screen.queryByRole("button", { name: messages.perdidos.contactar })).not.toBeInTheDocument();
  });

  it("muestra el teléfono del autor solo si lo publicó, con el aviso de estafa", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "vecino1" } } });
    await renderPagina();
    expect(screen.queryByText(/600 111 222/)).not.toBeInTheDocument();

    maybeSingleMock.mockResolvedValue({
      data: { ...AVISO, contact_phone: "+34 600 111 222" },
      error: null,
    });
    const { getByText } = await renderPagina();
    expect(getByText(/600 111 222/)).toBeInTheDocument();
    expect(getByText(messages.perdidos.telefonoAvisoEstafa)).toBeInTheDocument();
  });

  it("si el autor cerró el contacto, no se ofrece escribirle (pero sí avistar)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "vecino1" } } });
    maybeSingleMock.mockResolvedValue({ data: { ...AVISO, allow_contact: false }, error: null });
    await renderPagina();
    expect(screen.queryByRole("button", { name: messages.perdidos.contactar })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.perdidos.avistamiento })).toBeInTheDocument();
  });

  it("un aviso resuelto no ofrece ayudar, pero conserva los avistamientos", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "vecino1" } } });
    maybeSingleMock.mockResolvedValue({ data: { ...AVISO, status: "resolved" }, error: null });
    rpcMock.mockResolvedValue({ data: [AVISTAMIENTO], error: null });
    await renderPagina();
    expect(screen.queryByRole("button", { name: messages.perdidos.avistamiento })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: messages.perdidos.contactar })).not.toBeInTheDocument();
    expect(screen.getByText(/Bebiendo en la fuente/)).toBeInTheDocument();
  });

  it("lista los avistamientos y deja al autor borrarlos", async () => {
    rpcMock.mockResolvedValue({ data: [AVISTAMIENTO], error: null });
    await renderPagina(); // sesión = autor del aviso
    expect(screen.getByText(/Bebiendo en la fuente/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.perdidos.avistamientoBorrar })).toBeInTheDocument();
  });

  it("un aviso abierto sin avistamientos lo dice en vez de mostrar una lista vacía", async () => {
    await renderPagina();
    expect(screen.getByText(messages.perdidos.avistamientosVacio)).toBeInTheDocument();
  });

  it("un aviso inexistente ofrece volver al mapa", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    await renderPagina();
    expect(screen.getByText(messages.perdidos.noEncontrado)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.perdidos.volverMapa })).toHaveAttribute(
      "href",
      "/perdidos-encontrados",
    );
  });
});

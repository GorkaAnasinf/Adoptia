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
  breed: null,
  sex: null,
  size: null,
  color: null,
  has_collar: null,
  collar_description: null,
  has_microchip: null,
  occurred_on: "2026-07-10",
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

  // FEATURE-023
  it("muestra las señas que se conocen y omite las que no", async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        ...AVISO,
        breed: "Podenco",
        color: "Canela",
        sex: "female",
        size: null, // no lo sé
        has_collar: true,
        collar_description: "Rojo con placa",
        has_microchip: null, // no lo sé
      },
      error: null,
    });
    await renderPagina();
    expect(screen.getByText("Podenco")).toBeInTheDocument();
    expect(screen.getByText("Canela")).toBeInTheDocument();
    expect(screen.getByText(messages.animales.sexFemale)).toBeInTheDocument();
    expect(screen.getByText(/Rojo con placa/)).toBeInTheDocument();
    // Lo desconocido no ocupa sitio: ni etiqueta ni «no lo sé».
    expect(screen.queryByText(messages.perdidos.datoTamano)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.perdidos.datoMicrochip)).not.toBeInTheDocument();
  });

  it("un aviso sin ninguna seña no muestra el bloque vacío", async () => {
    await renderPagina();
    expect(screen.queryByText(messages.perdidos.datosTitulo)).not.toBeInTheDocument();
  });

  it("distingue cuándo ocurrió de cuándo se publicó", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { ...AVISO, occurred_on: "2026-07-07", created_at: "2026-07-10T10:00:00Z" },
      error: null,
    });
    await renderPagina();
    expect(screen.getByText(/7 de julio/)).toBeInTheDocument(); // ocurrió
    expect(screen.getByText(/10 de julio/)).toBeInTheDocument(); // se publicó
  });

  it("no muestra la fecha de publicación si coincide con la del suceso", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { ...AVISO, occurred_on: "2026-07-10", created_at: "2026-07-10T10:00:00Z" },
      error: null,
    });
    await renderPagina();
    expect(screen.getAllByText(/10 de julio/)).toHaveLength(1);
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

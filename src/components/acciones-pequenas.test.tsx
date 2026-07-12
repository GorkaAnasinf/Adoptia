import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/es.json";

const { refreshMock, updateEqMock, deleteEqMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  updateEqMock: vi.fn(),
  deleteEqMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: updateEqMock })),
      delete: vi.fn(() => ({ eq: deleteEqMock })),
    })),
  })),
}));

import { AlertaAcciones } from "./alertas/AlertaAcciones";
import { QuitarFavoritoButton } from "./animals/QuitarFavoritoButton";
import { ContactarAcogedorButton } from "./acogida/ContactarAcogedorButton";
import { ImagenSocialButton } from "./stats/ImagenSocialButton";
import { ResolverAvisoButton } from "./perdidos/ResolverAvisoButton";

const fetchMock = vi.fn();

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset().mockResolvedValue({ ok: true });
  updateEqMock.mockReset().mockResolvedValue({ error: null });
  deleteEqMock.mockReset().mockResolvedValue({ error: null });
  refreshMock.mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe("AlertaAcciones", () => {
  it("pausa la alerta", async () => {
    const user = userEvent.setup();
    conIntl(<AlertaAcciones alertaId="al1" activa />);
    await user.click(screen.getByRole("button", { name: messages.account.alertaPausar }));
    await waitFor(() => expect(updateEqMock).toHaveBeenCalledWith("id", "al1"));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("elimina la alerta", async () => {
    const user = userEvent.setup();
    conIntl(<AlertaAcciones alertaId="al1" activa />);
    await user.click(screen.getByRole("button", { name: messages.account.alertaBorrar }));
    await waitFor(() => expect(deleteEqMock).toHaveBeenCalledWith("id", "al1"));
  });

  it("una alerta pausada ofrece activar", () => {
    conIntl(<AlertaAcciones alertaId="al1" activa={false} />);
    expect(screen.getByRole("button", { name: messages.account.alertaActivar })).toBeInTheDocument();
  });
});

describe("QuitarFavoritoButton", () => {
  it("borra el favorito y refresca", async () => {
    const user = userEvent.setup();
    conIntl(<QuitarFavoritoButton animalId="a1" />);
    await user.click(screen.getByRole("button", { name: messages.account.quitarFavorito }));
    await waitFor(() => expect(deleteEqMock).toHaveBeenCalledWith("animal_id", "a1"));
    expect(refreshMock).toHaveBeenCalled();
  });
});

describe("ContactarAcogedorButton", () => {
  it("propone la acogida por POST y confirma", async () => {
    const user = userEvent.setup();
    conIntl(<ContactarAcogedorButton fosterUserId="u9" />);
    await user.click(screen.getByRole("button", { name: messages.acogida.contactar }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ foster_user_id: "u9" });
    expect(await screen.findByText(messages.acogida.contactado)).toBeInTheDocument();
  });

  it("muestra error si la API falla", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    conIntl(<ContactarAcogedorButton fosterUserId="u9" />);
    await user.click(screen.getByRole("button", { name: messages.acogida.contactar }));
    expect(await screen.findByText(messages.acogida.errorContactar)).toBeInTheDocument();
  });
});

describe("ImagenSocialButton", () => {
  it("abre la preview con descargas en ambos formatos", async () => {
    const user = userEvent.setup();
    conIntl(<ImagenSocialButton slug="luna-demo" />);
    await user.click(screen.getByRole("button", { name: messages.stats.generarImagen }));
    expect(
      screen.getByRole("link", { name: messages.stats.descargarCuadrada }),
    ).toHaveAttribute("href", "/api/og/social/luna-demo");
    expect(screen.getByRole("link", { name: messages.stats.descargarStory })).toHaveAttribute(
      "href",
      "/api/og/social/luna-demo?f=story",
    );
    await user.click(screen.getByRole("button", { name: messages.stats.cerrarImagen }));
    expect(screen.getByRole("button", { name: messages.stats.generarImagen })).toBeInTheDocument();
  });
});

describe("ResolverAvisoButton", () => {
  it("resuelve el aviso con historia opcional", async () => {
    const user = userEvent.setup();
    conIntl(<ResolverAvisoButton avisoId="p1" />);
    await user.click(screen.getByRole("button", { name: messages.perdidos.resolver }));
    await user.type(
      screen.getByLabelText(messages.perdidos.resolverHistoria),
      "¡Apareció en el garaje!",
    );
    await user.click(screen.getByRole("button", { name: messages.perdidos.resolverConfirmar }));
    await waitFor(() => expect(updateEqMock).toHaveBeenCalledWith("id", "p1"));
    expect(refreshMock).toHaveBeenCalled();
  });
});

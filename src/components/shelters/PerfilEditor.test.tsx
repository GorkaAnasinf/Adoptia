import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { PerfilEditor } from "./PerfilEditor";

const { updateMock, eqMock } = vi.hoisted(() => {
  const eqMock = vi.fn(async () => ({ error: null }));
  const updateMock = vi.fn<(row: Record<string, unknown>) => { eq: typeof eqMock }>(() => ({
    eq: eqMock,
  }));
  return { updateMock, eqMock };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: () => ({ update: updateMock }) }),
}));
// LogoUploader hace su propia llamada a Storage; lo aislamos.
vi.mock("./LogoUploader", () => ({ LogoUploader: () => <div data-testid="logo" /> }));

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

function editor() {
  return (
    <PerfilEditor
      shelterId="s1"
      base={{ name: "Refugio Uno", city: "Bilbao", province: "Bizkaia", website: null, status: "verified" }}
      initial={{
        logoUrl: "",
        description: "Hola",
        donationLink: "",
        openingHours: {},
        socialLinks: {},
        acceptsVolunteers: false,
        acceptsFostering: false,
      }}
      animals={[]}
    />
  );
}

describe("PerfilEditor", () => {
  beforeEach(() => {
    updateMock.mockClear();
    eqMock.mockClear();
  });

  it("la vista previa muestra el perfil público real", async () => {
    conIntl(editor());
    await userEvent.click(screen.getByRole("button", { name: messages.perfil.preview }));
    // El nombre de la protectora aparece como encabezado del perfil público
    expect(screen.getByRole("heading", { name: "Refugio Uno" })).toBeInTheDocument();
    expect(screen.getByText(messages.shelterPublic.aboutTitle)).toBeInTheDocument();
  });

  it("guardar llama a update con los campos del perfil", async () => {
    conIntl(editor());
    await userEvent.click(screen.getByRole("button", { name: messages.perfil.save }));
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock.mock.calls[0][0]).toMatchObject({ description: "Hola" });
    expect(eqMock).toHaveBeenCalledWith("id", "s1");
  });

  it("rechaza una red social con URL inválida", async () => {
    conIntl(editor());
    await userEvent.type(screen.getByLabelText(messages.perfil.instagram), "no-es-url");
    await userEvent.click(screen.getByRole("button", { name: messages.perfil.save }));
    expect(screen.getByText(messages.perfil.errorGeneric)).toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });
});

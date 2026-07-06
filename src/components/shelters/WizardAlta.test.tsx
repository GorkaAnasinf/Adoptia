import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { WizardAlta } from "./WizardAlta";

const { upsertMock, pushMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: upsertMock,
        })),
      })),
    })),
  })),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock, refresh: vi.fn() }) }));

// Stubs de componentes pesados
vi.mock("./MapPinPicker", () => ({
  MapPinPicker: ({ onChange }: { onChange: (c: { lat: number; lng: number }) => void }) => (
    <button type="button" onClick={() => onChange({ lat: 43.263, lng: -2.935 })}>
      colocar-pin
    </button>
  ),
}));
vi.mock("./LogoUploader", () => ({
  LogoUploader: ({ onUploaded }: { onUploaded: (u: string) => void }) => (
    <button type="button" onClick={() => onUploaded("https://cdn/logo.png")}>
      subir-logo
    </button>
  ),
}));

function renderWizard() {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <WizardAlta ownerId="owner-1" shelterId="s1" initial={{}} />
    </NextIntlClientProvider>,
  );
}

async function rellenarPaso1(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nombre de la protectora/i), "Refugio Esperanza");
  await user.type(screen.getByLabelText(/^cif/i), "B98000003");
  await user.type(screen.getByLabelText(/email de la entidad/i), "hola@refugio.org");
  await user.type(screen.getByLabelText(/teléfono/i), "600123456");
}

describe("WizardAlta", () => {
  beforeEach(() => {
    upsertMock.mockReset().mockResolvedValue({ data: { id: "s1" }, error: null });
    pushMock.mockReset();
  });

  it("no avanza del paso 1 con datos inválidos", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText(/el cif no es válido/i)).toBeInTheDocument();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("guarda el borrador y avanza al paso 2 con datos válidos", async () => {
    const user = userEvent.setup();
    renderWizard();
    await rellenarPaso1(user);
    await user.click(screen.getByRole("button", { name: /siguiente/i }));
    await waitFor(() => expect(upsertMock).toHaveBeenCalled());
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
  });

  it("completa el wizard y envía a revisión (submitted_at)", async () => {
    const user = userEvent.setup();
    renderWizard();
    // Paso 1
    await rellenarPaso1(user);
    await user.click(screen.getByRole("button", { name: /siguiente/i }));
    // Paso 2
    await user.type(await screen.findByLabelText(/dirección/i), "Calle Mayor 1");
    await user.type(screen.getByLabelText(/ciudad/i), "Bilbao");
    await user.type(screen.getByLabelText(/provincia/i), "Bizkaia");
    await user.type(screen.getByLabelText(/código postal/i), "48001");
    await user.click(screen.getByRole("button", { name: /colocar-pin/i }));
    await user.click(screen.getByRole("button", { name: /siguiente/i }));
    // Paso 3
    await user.click(await screen.findByRole("button", { name: /enviar a revisión/i }));

    await waitFor(() => expect(screen.getByText(/alta enviada/i)).toBeInTheDocument());
    const enviados = upsertMock.mock.results.length;
    expect(enviados).toBeGreaterThan(0);
  });
});

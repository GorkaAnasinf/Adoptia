import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { SolicitudWizard } from "./SolicitudWizard";

const { pushMock, fetchMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

function renderWizard() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <SolicitudWizard
        animalId="11111111-1111-4111-8111-111111111111"
        animalSlug="pipa-abc123"
        animalName="Pipa"
      />
    </NextIntlClientProvider>,
  );
}

async function irAPaso2(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText(/piso/i));
  await user.click(screen.getByLabelText(/^propiedad/i));
  await user.click(screen.getByRole("button", { name: /siguiente/i }));
}

describe("SolicitudWizard", () => {
  beforeEach(() => {
    pushMock.mockReset();
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: "req1", status: "pending" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("no avanza del paso 1 sin elegir régimen/vivienda", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByLabelText(/piso/i)).toBeInTheDocument();
  });

  it("alquiler sin indicar si el casero permite animales no avanza", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByLabelText(/piso/i));
    await user.click(screen.getByLabelText(/^alquiler/i));
    await user.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText(/indica si el casero permite/i)).toBeInTheDocument();
  });

  it("avanza al paso 2 con vivienda válida y conserva los datos al retroceder", async () => {
    const user = userEvent.setup();
    renderWizard();
    await irAPaso2(user);
    expect(screen.getByLabelText(/personas que conviven/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /atrás/i }));
    const piso = screen.getByLabelText(/piso/i) as HTMLInputElement;
    expect(piso.checked).toBe(true);
  });

  it("completa los 4 pasos y envía la solicitud con éxito", async () => {
    const user = userEvent.setup();
    renderWizard();

    await irAPaso2(user);
    await user.type(screen.getByLabelText(/personas que conviven/i), "2");
    await user.click(screen.getByRole("button", { name: /siguiente/i }));

    await user.type(screen.getByLabelText(/horas que el animal/i), "3");
    await user.click(screen.getByLabelText(/de acuerdo/i));
    await user.click(screen.getByRole("button", { name: /siguiente/i }));

    await user.type(screen.getByLabelText(/cuéntale a la protectora/i), "Quiero mucho a los animales");
    await user.click(screen.getByLabelText(/acepto que mis datos/i));
    await user.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/solicitudes", expect.any(Object)));
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.animal_id).toBe("11111111-1111-4111-8111-111111111111");
    expect(body.questionnaire.vivienda).toBe("piso");
    expect(body.questionnaire.regimen).toBe("propiedad");

    expect(await screen.findByText(/solicitud enviada/i)).toBeInTheDocument();
  });

  it("muestra aviso de duplicada si la API responde 409", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: { code: "duplicate_request", message: "Ya la enviaste" } }),
    });
    const user = userEvent.setup();
    renderWizard();

    await irAPaso2(user);
    await user.type(screen.getByLabelText(/personas que conviven/i), "1");
    await user.click(screen.getByRole("button", { name: /siguiente/i }));

    await user.type(screen.getByLabelText(/horas que el animal/i), "2");
    await user.click(screen.getByLabelText(/de acuerdo/i));
    await user.click(screen.getByRole("button", { name: /siguiente/i }));

    await user.click(screen.getByLabelText(/acepto que mis datos/i));
    await user.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    expect(await screen.findByText(/ya has enviado una solicitud/i)).toBeInTheDocument();
    const enlaceEstado = screen.getByRole("link", { name: /ver el estado de tu solicitud/i });
    expect(enlaceEstado).toHaveAttribute("href", "/animales/pipa-abc123");
  });
});

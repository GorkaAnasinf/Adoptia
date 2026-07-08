import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalForm } from "./AnimalForm";

const { pushMock, upsertMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  upsertMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      upsert: (row: unknown) => {
        upsertMock(row);
        return { select: () => ({ single: async () => ({ data: { id: "a1" }, error: null }) }) };
      },
      delete: () => ({ eq: () => ({ eq: async () => ({}) }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: { id: "x" } }) }) }),
    }),
  }),
}));

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("AnimalForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    upsertMock.mockClear();
  });

  it("bloquea publicar sin los mínimos y muestra el error", async () => {
    conIntl(<AnimalForm shelterId="s1" animalId={null} initial={{ name: "Luna" }} />);

    await userEvent.click(screen.getByRole("button", { name: messages.animales.publish }));

    expect(screen.getByText(messages.animales.publishErrors)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("guarda borrador con solo el nombre (upsert)", async () => {
    conIntl(<AnimalForm shelterId="s1" animalId={null} initial={{ name: "Luna" }} />);

    await userEvent.click(screen.getByRole("button", { name: messages.animales.saveDraft }));

    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock.mock.calls[0][0]).toMatchObject({ shelter_id: "s1", name: "Luna" });
  });

  it("una protectora no verificada no puede publicar", async () => {
    conIntl(
      <AnimalForm
        shelterId="s1"
        animalId={null}
        initial={{ name: "Luna", species: "dog", sex: "female", size: "medium", description: "ok" }}
        shelterVerified={false}
      />,
    );
    expect(screen.getByRole("button", { name: messages.animales.publish })).toBeDisabled();
  });

  it("rechaza un enlace de YouTube inválido al guardar", async () => {
    conIntl(
      <AnimalForm shelterId="s1" animalId={null} initial={{ name: "Luna" }} initialYoutube="basura" />,
    );

    await userEvent.click(screen.getByRole("button", { name: messages.animales.saveDraft }));

    expect(screen.getByText(messages.animales.youtubeInvalid)).toBeInTheDocument();
    expect(upsertMock).not.toHaveBeenCalled();
  });
});

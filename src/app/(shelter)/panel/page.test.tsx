import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";
import PanelPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => (key: string) => {
    const obj = (messages as unknown as Record<string, Record<string, string>>)[ns];
    return obj?.[key] ?? `${ns}.${key}`;
  }),
}));

const shelterData = { status: "pending", verification_note: null };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: shelterData })) })),
      })),
    })),
  })),
}));

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("PanelPage — banner de revisión", () => {
  it("en estado pending ofrece un enlace para editar el alta", async () => {
    conIntl(await PanelPage());
    const editar = screen.getByRole("link", {
      name: messages.onboarding.bannerPendingEdit,
    });
    expect(editar).toHaveAttribute("href", "/panel/alta");
  });
});

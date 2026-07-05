import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { GoogleButton } from "./GoogleButton";

const oauthMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithOAuth: oauthMock },
  })),
}));

describe("GoogleButton", () => {
  beforeEach(() => oauthMock.mockReset());

  it("inicia el flujo OAuth de Google con callback propio", async () => {
    oauthMock.mockResolvedValue({ error: null });
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <GoogleButton />
      </NextIntlClientProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: messages.auth.continueWithGoogle }),
    );
    await waitFor(() => {
      expect(oauthMock).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: expect.stringContaining("/auth/callback") },
      });
    });
  });
});

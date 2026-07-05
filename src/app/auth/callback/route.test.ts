import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: exchangeMock },
  })),
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  beforeEach(() => exchangeMock.mockReset());

  it("intercambia el código por sesión y redirige a la home", async () => {
    exchangeMock.mockResolvedValue({ error: null });
    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc123"),
    );
    expect(exchangeMock).toHaveBeenCalledWith("abc123");
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });

  it("respeta el parámetro next para redirigir tras el login", async () => {
    exchangeMock.mockResolvedValue({ error: null });
    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc&next=/panel"),
    );
    expect(new URL(res.headers.get("location")!).pathname).toBe("/panel");
  });

  it("redirige a login con error si no hay código o el intercambio falla", async () => {
    exchangeMock.mockResolvedValue({ error: { message: "bad code" } });
    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=malo"),
    );
    const destino = new URL(res.headers.get("location")!);
    expect(destino.pathname).toBe("/login");
    expect(destino.searchParams.get("error")).toBe("oauth");

    const sinCodigo = await GET(new Request("http://localhost:3000/auth/callback"));
    expect(new URL(sinCodigo.headers.get("location")!).pathname).toBe("/login");
  });

  it("no permite next externo (open redirect)", async () => {
    exchangeMock.mockResolvedValue({ error: null });
    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc&next=https://evil.com"),
    );
    expect(new URL(res.headers.get("location")!).origin).toBe("http://localhost:3000");
  });
});

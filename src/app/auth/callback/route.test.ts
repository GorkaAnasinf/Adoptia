import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeMock = vi.fn();
const verifyOtpMock = vi.fn();
const getUserMock = vi.fn();

// Rol devuelto por profiles para el usuario de la sesión
let perfilRole: string | null = "adopter";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: exchangeMock,
      verifyOtp: verifyOtpMock,
      getUser: getUserMock,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: perfilRole ? { role: perfilRole } : null })),
        })),
      })),
    })),
  })),
}));

import { GET } from "./route";

const req = (qs: string) => new Request(`http://localhost:3000/auth/callback${qs}`);

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeMock.mockReset().mockResolvedValue({ error: null });
    verifyOtpMock.mockReset().mockResolvedValue({ error: null });
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    perfilRole = "adopter";
  });

  it("protectora sin next aterriza en su panel", async () => {
    perfilRole = "shelter";
    const res = await GET(req("?code=abc123"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/panel");
  });

  it("admin sin next aterriza en su área", async () => {
    perfilRole = "admin";
    const res = await GET(req("?code=abc123"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin");
  });

  it("un next interno gana sobre el destino por rol", async () => {
    perfilRole = "shelter";
    const res = await GET(req("?code=abc&next=/correo-verificado"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/correo-verificado");
  });

  it("usuario sin fila en profiles → home (sin crash)", async () => {
    perfilRole = null;
    const res = await GET(req("?code=abc123"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });

  it("intercambia el código PKCE y, con sesión, redirige a la home", async () => {
    const res = await GET(req("?code=abc123"));
    expect(exchangeMock).toHaveBeenCalledWith("abc123");
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });

  it("verifica el token_hash del email (verifyOtp) cuando no hay code", async () => {
    const res = await GET(req("?token_hash=hhh&type=email&next=/correo-verificado"));
    expect(verifyOtpMock).toHaveBeenCalledWith({ type: "email", token_hash: "hhh" });
    expect(new URL(res.headers.get("location")!).pathname).toBe("/correo-verificado");
  });

  it("respeta el parámetro next interno", async () => {
    const res = await GET(req("?code=abc&next=/panel"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/panel");
  });

  it("si ya hay sesión (cookies puestas por GoTrue) redirige a next aunque falle el intercambio", async () => {
    exchangeMock.mockResolvedValue({ error: { message: "no verifier" } });
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await GET(req("?code=abc&next=/correo-verificado"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/correo-verificado");
  });

  it("sin sesión resultante redirige a login con error", async () => {
    exchangeMock.mockResolvedValue({ error: { message: "bad" } });
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await GET(req("?code=malo"));
    const destino = new URL(res.headers.get("location")!);
    expect(destino.pathname).toBe("/login");
    expect(destino.searchParams.get("error")).toBe("oauth");
  });

  it("no permite next externo (open redirect)", async () => {
    const res = await GET(req("?code=abc&next=https://evil.com"));
    expect(new URL(res.headers.get("location")!).origin).toBe("http://localhost:3000");
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });
});

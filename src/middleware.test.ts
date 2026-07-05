import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: profileSingleMock,
        })),
      })),
    })),
  })),
}));

import { middleware } from "./middleware";

function makeRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("middleware de protección de rutas", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-anon-de-test");
    getUserMock.mockReset();
    profileSingleMock.mockReset();
  });

  it("redirige a /login al pedir el panel sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const res = await middleware(makeRequest("/panel"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirige a la home si un adoptante intenta entrar al panel de protectora", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-adoptante" } },
      error: null,
    });
    profileSingleMock.mockResolvedValue({
      data: { role: "adopter" },
      error: null,
    });
    const res = await middleware(makeRequest("/panel"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });

  it("deja pasar a una protectora con sesión al panel", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-protectora" } },
      error: null,
    });
    profileSingleMock.mockResolvedValue({
      data: { role: "shelter" },
      error: null,
    });
    const res = await middleware(makeRequest("/panel"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("un adoptante tampoco puede entrar en /admin", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-adoptante" } },
      error: null,
    });
    profileSingleMock.mockResolvedValue({
      data: { role: "adopter" },
      error: null,
    });
    const res = await middleware(makeRequest("/admin"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });

  it("deja pasar a cualquiera a rutas públicas", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const res = await middleware(makeRequest("/"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirige a /login al pedir mi cuenta sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const res = await middleware(makeRequest("/mi-cuenta"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });
});

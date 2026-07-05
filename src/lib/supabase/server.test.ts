import { afterEach, describe, expect, it, vi } from "vitest";
import { cookieMethods, createClient } from "./server";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

describe("createClient (server)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lanza un error claro si faltan las variables de entorno de Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    await expect(createClient()).rejects.toThrow(/\.env\.local/);
  });

  it("crea un cliente de servidor con las cookies de la petición", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-anon-de-test");
    const client = await createClient();
    expect(client.auth).toBeDefined();
    expect(client.from).toBeTypeOf("function");
  });
});

describe("cookieMethods", () => {
  type Adapter = {
    getAll(): { name: string; value: string }[];
    setAll(c: { name: string; value: string; options: object }[]): void;
  };

  function fakeStore(overrides: Partial<Record<"getAll" | "set", unknown>> = {}) {
    return {
      getAll: vi.fn(() => [{ name: "sb", value: "x" }]),
      set: vi.fn(),
      ...overrides,
    } as unknown as Parameters<typeof cookieMethods>[0];
  }

  function adapter(store: Parameters<typeof cookieMethods>[0]) {
    return cookieMethods(store) as unknown as Adapter;
  }

  it("lee todas las cookies de la petición", () => {
    const store = fakeStore();
    expect(adapter(store).getAll()).toEqual([{ name: "sb", value: "x" }]);
  });

  it("escribe las cookies de sesión en la respuesta", () => {
    const store = fakeStore();
    adapter(store).setAll([{ name: "sb", value: "y", options: {} }]);
    expect(store.set).toHaveBeenCalledWith("sb", "y", {});
  });

  it("no explota si el store es de solo lectura (Server Component)", () => {
    const store = fakeStore({
      set: vi.fn(() => {
        throw new Error("read-only");
      }),
    });
    expect(() =>
      adapter(store).setAll([{ name: "sb", value: "y", options: {} }]),
    ).not.toThrow();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "./server";

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

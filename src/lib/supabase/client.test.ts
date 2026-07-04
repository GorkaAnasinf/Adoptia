import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "./client";

describe("createClient (browser)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lanza un error claro si faltan las variables de entorno de Supabase", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => createClient()).toThrow(/\.env\.local/);
  });

  it("crea un cliente cuando las variables están presentes", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-anon-de-test");
    const client = createClient();
    expect(client.auth).toBeDefined();
    expect(client.from).toBeTypeOf("function");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn(() => ({ ok: true })) }));
vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

import { createAdminClient } from "./admin";

describe("createAdminClient", () => {
  beforeEach(() => {
    createClientMock.mockClear();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
  });

  it("crea el cliente con la service key", () => {
    createAdminClient();
    expect(createClientMock).toHaveBeenCalledWith(
      "http://localhost:54321",
      "service-key",
      expect.objectContaining({ auth: expect.any(Object) }),
    );
  });

  it("lanza si faltan las variables", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => createAdminClient()).toThrow(/service_role/);
  });
});

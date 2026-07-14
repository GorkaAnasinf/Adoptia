import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserRole } from "./user-role";

function fakeSupabase(opts: {
  user: { id: string } | null;
  role?: string | null;
}): SupabaseClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: opts.role === undefined ? null : { role: opts.role },
            error: null,
          }),
        })),
      })),
    })),
  } as unknown as SupabaseClient;
}

describe("getUserRole", () => {
  it("devuelve null si no hay sesión", async () => {
    expect(await getUserRole(fakeSupabase({ user: null }))).toBeNull();
  });

  it("devuelve el rol de protectora", async () => {
    expect(await getUserRole(fakeSupabase({ user: { id: "u1" }, role: "shelter" }))).toBe("shelter");
  });

  it("devuelve el rol de adoptante", async () => {
    expect(await getUserRole(fakeSupabase({ user: { id: "u1" }, role: "adopter" }))).toBe("adopter");
  });

  it("devuelve null ante un rol desconocido o ausente", async () => {
    expect(await getUserRole(fakeSupabase({ user: { id: "u1" }, role: "otro" }))).toBeNull();
    expect(await getUserRole(fakeSupabase({ user: { id: "u1" }, role: null }))).toBeNull();
  });
});

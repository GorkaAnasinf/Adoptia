import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: {
    request: null as Record<string, unknown> | null,
    huecos: [] as { starts_at: string; ends_at: string; slot_minutes: number }[],
    insertError: null as { code: string; message: string } | null,
    lastInsert: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    rpc: vi.fn(async () => ({ data: state.huecos, error: null })),
    from: (table: string) => {
      if (table === "adoption_requests") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: state.request }) }),
          }),
        };
      }
      if (table === "appointments") {
        return {
          insert: (payload: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                state.lastInsert = payload;
                if (state.insertError) return { data: null, error: state.insertError };
                return { data: { id: "cita1", ...payload }, error: null };
              },
            }),
          }),
        };
      }
      throw new Error(`tabla no mockeada: ${table}`);
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn(() => ({})) }));
vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST } from "./route";

const INICIO = "2026-08-01T10:00:00.000Z";
const FIN = "2026-08-01T10:30:00.000Z";

function req(body: unknown) {
  return new Request("http://localhost/api/citas", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/citas", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({
      data: { user: { id: "adopter1", email: "marta@test.com" } },
    });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockResolvedValue({ email: "marta@test.com", fullName: "Marta" });
    state.request = {
      id: "req1",
      status: "approved",
      adopter_id: "adopter1",
      animals: {
        id: "animal1",
        name: "Pipa",
        shelter_id: "shelter1",
        shelters: { name: "Protectora Bilbao", email: "prote@test.com", owner_id: "owner1" },
      },
    };
    state.huecos = [{ starts_at: INICIO, ends_at: FIN, slot_minutes: 30 }];
    state.insertError = null;
    state.lastInsert = null;
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(req({ request_id: crypto.randomUUID(), starts_at: INICIO }));
    expect(res.status).toBe(401);
  });

  it("422 con body inválido", async () => {
    const res = await POST(req({ request_id: "no-uuid", starts_at: "ayer" }));
    expect(res.status).toBe(422);
  });

  it("404 si la solicitud no existe", async () => {
    state.request = null;
    const res = await POST(req({ request_id: crypto.randomUUID(), starts_at: INICIO }));
    expect(res.status).toBe(404);
  });

  it("403 si la solicitud es de otro adoptante", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "otro" } } });
    const res = await POST(req({ request_id: crypto.randomUUID(), starts_at: INICIO }));
    expect(res.status).toBe(403);
  });

  it("409 si la solicitud no está aprobada", async () => {
    state.request = { ...(state.request as Record<string, unknown>), status: "pending" };
    const res = await POST(req({ request_id: crypto.randomUUID(), starts_at: INICIO }));
    expect(res.status).toBe(409);
  });

  it("409 si el hueco no está entre los libres", async () => {
    const res = await POST(
      req({ request_id: crypto.randomUUID(), starts_at: "2026-08-01T23:00:00.000Z" }),
    );
    expect(res.status).toBe(409);
    expect(state.lastInsert).toBeNull();
  });

  it("201: crea la cita con el fin del hueco y avisa a ambas partes", async () => {
    const res = await POST(req({ request_id: crypto.randomUUID(), starts_at: INICIO }));
    expect(res.status).toBe(201);
    expect(state.lastInsert).toMatchObject({
      shelter_id: "shelter1",
      adopter_id: "adopter1",
      ends_at: FIN,
    });
    expect(enviarEmailMock).toHaveBeenCalledTimes(2);
    const destinos = enviarEmailMock.mock.calls.map((c) => c[0].to).sort();
    expect(destinos).toEqual(["marta@test.com", "prote@test.com"]);
  });

  it("409 si dos reservas chocan (exclusion constraint 23P01)", async () => {
    state.insertError = { code: "23P01", message: "conflicting key value" };
    const res = await POST(req({ request_id: crypto.randomUUID(), starts_at: INICIO }));
    expect(res.status).toBe(409);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: {
    citas: [] as Record<string, unknown>[],
    marcadas: [] as string[],
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            gte: () => ({
              lte: async () => ({ data: state.citas, error: null }),
            }),
          }),
        }),
      }),
      update: () => ({
        eq: (_col: string, id: string) => {
          state.marcadas.push(id);
          return Promise.resolve({ error: null });
        },
      }),
    }),
  })),
}));

vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { GET } from "./route";

function req(secret = "s3cr3t") {
  return new Request("http://localhost/api/cron/recordatorios", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

const CITA = {
  id: "cita1",
  adopter_id: "adopter1",
  starts_at: "2026-08-01T10:00:00.000Z",
  adoption_requests: { animals: { name: "Pipa" } },
  shelters: { name: "Protectora Bilbao", email: "prote@test.com" },
};

describe("GET /api/cron/recordatorios", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockResolvedValue({ email: "marta@test.com", fullName: "Marta" });
    state.citas = [CITA];
    state.marcadas = [];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("401 sin el secreto del cron", async () => {
    const res = await GET(req("malo"));
    expect(res.status).toBe(401);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("envía recordatorio a adoptante y protectora y marca la cita", async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(enviarEmailMock).toHaveBeenCalledTimes(2);
    const destinos = enviarEmailMock.mock.calls.map((c) => c[0].to).sort();
    expect(destinos).toEqual(["marta@test.com", "prote@test.com"]);
    expect(enviarEmailMock.mock.calls[0][0].subject).toContain("Recordatorio");
    expect(state.marcadas).toEqual(["cita1"]);
  });

  it("sin citas en ventana no envía nada", async () => {
    state.citas = [];
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("responde el número de recordatorios enviados", async () => {
    const res = await GET(req());
    const body = await res.json();
    expect(body.data.enviados).toBe(1);
  });
});

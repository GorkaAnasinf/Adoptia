import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { enviarEmailMock, obtenerContactoMock, state } = vi.hoisted(() => ({
  enviarEmailMock: vi.fn(),
  obtenerContactoMock: vi.fn(),
  state: {
    eventos: [] as Record<string, unknown>[],
    matches: [] as Record<string, unknown>[],
    marcas: {
      reminded: [] as string[], // user_id de asistentes marcados
      reminderSent: [] as string[], // event_id con resumen a protectora
      zoneNotified: [] as string[], // event_id marcados como avisados por zona
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => ({
      // events: select(...).eq().gte().lte()
      select: () => ({
        eq: () => ({ gte: () => ({ lte: async () => ({ data: state.eventos, error: null }) }) }),
      }),
      // updates
      update: (vals: Record<string, unknown>) => ({
        eq: (_c: string, val: string) => ({
          // segundo eq → marca de asistente (event_attendees)
          eq: (_c2: string, userId: string) => {
            state.marcas.reminded.push(userId);
            return Promise.resolve({ error: null });
          },
          // await directo del primer eq → resumen a protectora (events)
          then: (res: (v: { error: null }) => unknown) => {
            if (table === "events" && "reminder_sent_at" in vals) state.marcas.reminderSent.push(val);
            return Promise.resolve({ error: null }).then(res);
          },
        }),
        in: (_c: string, arr: string[]) => {
          if ("zone_notified_at" in vals) state.marcas.zoneNotified.push(...arr);
          return Promise.resolve({ error: null });
        },
      }),
    }),
    rpc: async () => ({ data: state.matches, error: null }),
  })),
}));

vi.mock("@/lib/adopter-contact", () => ({ obtenerContactoAdoptante: obtenerContactoMock }));
vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { GET } from "./route";

function req(secret = "s3cr3t") {
  return new Request("http://localhost/api/cron/jornadas", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe("GET /api/cron/jornadas", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    obtenerContactoMock.mockReset().mockResolvedValue({ email: "ana@test.com", fullName: "Ana" });
    state.eventos = [];
    state.matches = [];
    state.marcas = { reminded: [], reminderSent: [], zoneNotified: [] };
  });

  afterEach(() => vi.unstubAllEnvs());

  it("401 sin el secreto del cron", async () => {
    const res = await GET(req("malo"));
    expect(res.status).toBe(401);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("recuerda a los asistentes sin avisar y envía resumen a la protectora", async () => {
    state.eventos = [
      {
        id: "ev1",
        title: "Jornada en el Retiro",
        address: "Retiro",
        city: "Madrid",
        starts_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        reminder_sent_at: null,
        shelters: { name: "Huellas Madrid", email: "prote@test.com" },
        event_attendees: [
          { user_id: "u1", reminded_at: null },
          { user_id: "u2", reminded_at: "2026-07-25T00:00:00Z" }, // ya avisado
        ],
      },
    ];

    const res = await GET(req());
    const body = await res.json();
    expect(res.status).toBe(200);
    // 1 recordatorio (u1) + 1 resumen a la protectora
    expect(body.data.recordatorios).toBe(1);
    expect(body.data.avisosProtectora).toBe(1);
    expect(state.marcas.reminded).toEqual(["u1"]);
    expect(state.marcas.reminderSent).toEqual(["ev1"]);
    const destinos = enviarEmailMock.mock.calls.map((c) => c[0].to);
    expect(destinos).toContain("ana@test.com"); // asistente u1
    expect(destinos).toContain("prote@test.com"); // protectora
  });

  it("no reenvía el resumen a la protectora si ya se envió", async () => {
    state.eventos = [
      {
        id: "ev1",
        title: "J",
        address: null,
        city: "Madrid",
        starts_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        reminder_sent_at: "2026-07-25T00:00:00Z",
        shelters: { name: "P", email: "prote@test.com" },
        event_attendees: [],
      },
    ];
    const res = await GET(req());
    const body = await res.json();
    expect(body.data.avisosProtectora).toBe(0);
    expect(state.marcas.reminderSent).toEqual([]);
  });

  it("avisa por zona agrupando las jornadas por usuario y marca los eventos", async () => {
    const starts = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    state.matches = [
      { event_id: "ev1", event_title: "Retiro", event_city: "Madrid", starts_at: starts, user_id: "u9", search_name: "Madrid", unsubscribe_token: "tok" },
      { event_id: "ev2", event_title: "Alameda", event_city: "Sevilla", starts_at: starts, user_id: "u9", search_name: "Sur", unsubscribe_token: "tok" },
    ];
    const res = await GET(req());
    const body = await res.json();
    expect(body.data.avisosZona).toBe(1); // un solo email al usuario
    expect(state.marcas.zoneNotified.sort()).toEqual(["ev1", "ev2"]);
    const zonaCall = enviarEmailMock.mock.calls.find((c) => c[0].to === "ana@test.com");
    expect(zonaCall?.[0].subject).toContain("cerca de ti");
  });
});

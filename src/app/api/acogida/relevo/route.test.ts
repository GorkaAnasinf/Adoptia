import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, rpcMock, enviarEmailMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  state: {
    propuesta: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.propuesta }) }),
      }),
    }),
  })),
}));

vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST, __resetRateLimitForTests } from "./route";

const PROPOSAL_ID = "33333333-3333-4333-8333-333333333333";

function req(body: unknown) {
  return new Request("http://localhost/api/acogida/relevo", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const RELEVO = {
  proposal_id: PROPOSAL_ID,
  motivo: "Obras en casa por inundación",
  fecha_limite: "2026-08-01",
};

describe("POST /api/acogida/relevo", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "foster1" } } });
    rpcMock.mockReset().mockResolvedValue({ error: null });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    state.propuesta = {
      id: PROPOSAL_ID,
      duracion: "2 semanas",
      shelters: { name: "Protectora Valladolid", email: "prote@test.com" },
      animals: { name: "Relevo" },
    };
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(RELEVO))).status).toBe(401);
  });

  it("422 sin motivo o sin fecha", async () => {
    expect((await POST(req({ proposal_id: PROPOSAL_ID, motivo: "x" }))).status).toBe(422);
    expect(
      (await POST(req({ proposal_id: PROPOSAL_ID, fecha_limite: "2026-08-01" }))).status,
    ).toBe(422);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("404 si la propuesta no es suya o no está aceptada (RPC rechaza)", async () => {
    rpcMock.mockResolvedValue({ error: { message: "propuesta_no_disponible" } });
    const res = await POST(req(RELEVO));
    expect(res.status).toBe(404);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("pide el relevo vía RPC y avisa a la protectora con motivo, fecha y animal", async () => {
    const res = await POST(req(RELEVO));
    expect(res.status).toBe(200);

    expect(rpcMock).toHaveBeenCalledWith("pedir_relevo", {
      p_proposal_id: PROPOSAL_ID,
      p_motivo: RELEVO.motivo,
      p_fecha_limite: RELEVO.fecha_limite,
    });

    expect(enviarEmailMock).toHaveBeenCalledOnce();
    const email = enviarEmailMock.mock.calls[0][0];
    expect(email.to).toBe("prote@test.com"); // a la protectora
    expect(email.html).toContain("Relevo");
    expect(email.html).toContain(RELEVO.motivo);
    expect(email.html).toContain("2026-08-01");
  });

  it("si el email falla, el relevo queda pedido igualmente (best-effort)", async () => {
    enviarEmailMock.mockRejectedValue(new Error("smtp down"));
    const res = await POST(req(RELEVO));
    expect(res.status).toBe(200);
  });

  it("cancelar: llama al RPC de cancelación y no envía email", async () => {
    const res = await POST(req({ proposal_id: PROPOSAL_ID, cancelar: true }));
    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("cancelar_relevo", { p_proposal_id: PROPOSAL_ID });
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("429 tras superar el rate limit", async () => {
    for (let i = 0; i < 5; i++) await POST(req(RELEVO));
    expect((await POST(req(RELEVO))).status).toBe(429);
  });
});

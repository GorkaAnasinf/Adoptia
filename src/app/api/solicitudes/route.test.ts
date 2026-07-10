import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, enviarEmailMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enviarEmailMock: vi.fn(),
  state: {
    animal: { id: "11111111-1111-4111-8111-111111111111", status: "available", name: "Pipa", shelter_id: "s1" } as
      | { id: string; status: string; name: string; shelter_id: string }
      | null,
    shelter: { name: "Refugio Esperanza", email: "gestor@refugio.org" } as
      | { name: string; email: string }
      | null,
    insertError: null as { code: string; message: string } | null,
    inserted: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === "animals") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: state.animal }),
            }),
          }),
        };
      }
      if (table === "shelters") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: state.shelter }),
            }),
          }),
        };
      }
      if (table === "adoption_requests") {
        return {
          insert: (payload: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                state.inserted = payload;
                if (state.insertError) return { data: null, error: state.insertError };
                return { data: { id: "req1", status: "pending" }, error: null };
              },
            }),
          }),
        };
      }
      throw new Error(`tabla no mockeada: ${table}`);
    },
  })),
}));

vi.mock("@/lib/email/mailer", () => ({ enviarEmail: enviarEmailMock }));

import { POST } from "./route";

const cuestionarioValido = {
  vivienda: "piso",
  regimen: "propiedad",
  convivientes: 2,
  ninos_edades: [],
  otros_animales: "",
  experiencia: "primera vez",
  horas_solo: 3,
  todos_de_acuerdo: true,
  message: "estoy lista",
  aceptaRgpd: true,
};

function req(body: unknown) {
  return new Request("http://localhost/api/solicitudes", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/solicitudes", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "adopter1" } } });
    enviarEmailMock.mockReset().mockResolvedValue(undefined);
    state.animal = { id: "11111111-1111-4111-8111-111111111111", status: "available", name: "Pipa", shelter_id: "s1" };
    state.shelter = { name: "Refugio Esperanza", email: "gestor@refugio.org" };
    state.insertError = null;
    state.inserted = null;
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(req({ animal_id: "11111111-1111-4111-8111-111111111111", questionnaire: cuestionarioValido }));
    expect(res.status).toBe(401);
  });

  it("201 feliz: crea la solicitud y avisa a la protectora por email", async () => {
    const res = await POST(req({ animal_id: "11111111-1111-4111-8111-111111111111", questionnaire: cuestionarioValido }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.data).toEqual({ id: "req1", status: "pending" });
    expect(state.inserted).toMatchObject({ animal_id: "11111111-1111-4111-8111-111111111111", adopter_id: "adopter1" });
    expect(enviarEmailMock).toHaveBeenCalledOnce();
    expect(enviarEmailMock.mock.calls[0][0].to).toBe("gestor@refugio.org");
  });

  it("si el envío del email falla, la solicitud igualmente se crea (201)", async () => {
    enviarEmailMock.mockRejectedValueOnce(new Error("Faltan variables SMTP"));
    const res = await POST(req({ animal_id: "11111111-1111-4111-8111-111111111111", questionnaire: cuestionarioValido }));
    expect(res.status).toBe(201);
    expect(state.inserted).not.toBeNull();
  });

  it("422 si el cuestionario es inválido", async () => {
    const res = await POST(
      req({ animal_id: "11111111-1111-4111-8111-111111111111", questionnaire: { ...cuestionarioValido, horas_solo: 30 } }),
    );
    expect(res.status).toBe(422);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("403 si el animal no está disponible", async () => {
    state.animal = { id: "11111111-1111-4111-8111-111111111111", status: "reserved", name: "Pipa", shelter_id: "s1" };
    const res = await POST(req({ animal_id: "11111111-1111-4111-8111-111111111111", questionnaire: cuestionarioValido }));
    expect(res.status).toBe(403);
  });

  it("404 si el animal no existe", async () => {
    state.animal = null;
    const res = await POST(req({ animal_id: "11111111-1111-4111-8111-111111111111", questionnaire: cuestionarioValido }));
    expect(res.status).toBe(404);
  });

  it("409 si ya existe la solicitud (unique animal+adoptante)", async () => {
    state.insertError = { code: "23505", message: "duplicate key" };
    const res = await POST(req({ animal_id: "11111111-1111-4111-8111-111111111111", questionnaire: cuestionarioValido }));
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error.code).toBe("duplicate_request");
  });

  it("honeypot relleno: responde 201 falso sin crear ni enviar email", async () => {
    const res = await POST(
      req({ animal_id: "11111111-1111-4111-8111-111111111111", questionnaire: cuestionarioValido, website: "spam" }),
    );
    expect(res.status).toBe(201);
    expect(state.inserted).toBeNull();
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });
});

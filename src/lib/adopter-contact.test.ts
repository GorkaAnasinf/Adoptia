import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { obtenerContactoAdoptante } from "./adopter-contact";

function adminFake(opts: { email?: string | null; fullName?: string | null }) {
  return {
    auth: {
      admin: {
        getUserById: vi.fn(async () => ({
          data: opts.email === undefined ? null : { user: { email: opts.email } },
        })),
      },
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: opts.fullName === undefined ? null : { full_name: opts.fullName },
          })),
        })),
      })),
    })),
  } as never;
}

describe("obtenerContactoAdoptante", () => {
  it("combina email de auth y nombre de profiles", async () => {
    const contacto = await obtenerContactoAdoptante(
      adminFake({ email: "ana@test.com", fullName: "Ana" }),
      "adopter1",
    );
    expect(contacto).toEqual({ email: "ana@test.com", fullName: "Ana" });
  });

  it("devuelve nulls si el usuario o el perfil no existen", async () => {
    const contacto = await obtenerContactoAdoptante(adminFake({}), "no-existe");
    expect(contacto).toEqual({ email: null, fullName: null });
  });

  it("tolera perfil sin nombre", async () => {
    const contacto = await obtenerContactoAdoptante(
      adminFake({ email: "luis@test.com", fullName: null }),
      "adopter2",
    );
    expect(contacto).toEqual({ email: "luis@test.com", fullName: null });
  });
});

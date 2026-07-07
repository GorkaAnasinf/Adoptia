import { describe, expect, it } from "vitest";
import { decideOnboardingGate } from "./onboarding";

describe("decideOnboardingGate", () => {
  it("protectora sin ficha creada → al wizard", () => {
    expect(
      decideOnboardingGate({ submittedAt: null, hasShelter: false, pathname: "/panel" }),
    ).toBe("/panel/alta");
  });

  it("protectora con borrador a medias (submitted_at null) → al wizard", () => {
    expect(
      decideOnboardingGate({ submittedAt: null, hasShelter: true, pathname: "/panel" }),
    ).toBe("/panel/alta");
  });

  it("no crea bucle de redirección si ya está en el wizard", () => {
    expect(
      decideOnboardingGate({ submittedAt: null, hasShelter: true, pathname: "/panel/alta" }),
    ).toBeNull();
  });

  it("protectora que ya envió su alta puede entrar al panel", () => {
    expect(
      decideOnboardingGate({
        submittedAt: "2026-07-06T10:00:00Z",
        hasShelter: true,
        pathname: "/panel",
      }),
    ).toBeNull();
  });

  it("protectora verificada que abre el wizard → al panel (alta de un solo uso)", () => {
    expect(
      decideOnboardingGate({
        submittedAt: "2026-07-06T10:00:00Z",
        hasShelter: true,
        status: "verified",
        pathname: "/panel/alta",
      }),
    ).toBe("/panel");
  });

  it("protectora en revisión (pending) puede reabrir el wizard para editar", () => {
    expect(
      decideOnboardingGate({
        submittedAt: "2026-07-06T10:00:00Z",
        hasShelter: true,
        status: "pending",
        pathname: "/panel/alta",
      }),
    ).toBeNull();
  });

  it("protectora en revisión también puede estar en el panel", () => {
    expect(
      decideOnboardingGate({
        submittedAt: "2026-07-06T10:00:00Z",
        hasShelter: true,
        status: "pending",
        pathname: "/panel",
      }),
    ).toBeNull();
  });

  it("suspendida: el alta sigue siendo de un solo uso (fuera de alcance de edición)", () => {
    expect(
      decideOnboardingGate({
        submittedAt: "2026-07-06T10:00:00Z",
        hasShelter: true,
        status: "suspended",
        pathname: "/panel/alta",
      }),
    ).toBe("/panel");
  });
});

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

  it("protectora ya enviada que abre el wizard → al panel (alta de un solo uso)", () => {
    expect(
      decideOnboardingGate({
        submittedAt: "2026-07-06T10:00:00Z",
        hasShelter: true,
        pathname: "/panel/alta",
      }),
    ).toBe("/panel");
  });
});

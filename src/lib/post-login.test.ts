import { describe, expect, it } from "vitest";
import { destinoPostLogin } from "./post-login";

describe("destinoPostLogin", () => {
  it("respeta un redirect interno válido para cualquier rol", () => {
    expect(destinoPostLogin({ role: "shelter", redirect: "/mi-cuenta/favoritos" })).toBe(
      "/mi-cuenta/favoritos",
    );
    expect(destinoPostLogin({ role: "adopter", redirect: "/panel" })).toBe("/panel");
  });

  it("ignora redirects externos (open redirect) y decide por rol", () => {
    expect(destinoPostLogin({ role: "shelter", redirect: "https://evil.com" })).toBe("/panel");
    expect(destinoPostLogin({ role: "adopter", redirect: "//evil.com" })).toBe("/");
  });

  it("manda a la protectora a su panel", () => {
    expect(destinoPostLogin({ role: "shelter", redirect: null })).toBe("/panel");
  });

  it("manda al admin a su área", () => {
    expect(destinoPostLogin({ role: "admin", redirect: null })).toBe("/admin");
  });

  it("manda al adoptante a la home", () => {
    expect(destinoPostLogin({ role: "adopter", redirect: null })).toBe("/");
  });

  it("rol null o desconocido → home (sin crash)", () => {
    expect(destinoPostLogin({ role: null, redirect: null })).toBe("/");
    expect(destinoPostLogin({ role: "otro", redirect: null })).toBe("/");
    expect(destinoPostLogin({ role: undefined, redirect: null })).toBe("/");
  });
});

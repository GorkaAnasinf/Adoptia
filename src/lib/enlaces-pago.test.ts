import { describe, expect, it } from "vitest";
import { esEnlacePagoValido } from "./enlaces-pago";

describe("esEnlacePagoValido", () => {
  it.each([
    "https://buy.stripe.com/abc123",
    "https://checkout.stripe.com/c/pay/xyz",
    "https://www.teaming.net/protectora-x",
    "https://teaming.net/protectora-x",
    "https://www.paypal.com/donate/?hosted_button_id=X",
    "https://paypal.me/protectora",
  ])("acepta %s", (url) => {
    expect(esEnlacePagoValido(url)).toBe(true);
  });

  it.each([
    "https://mi-web-sospechosa.com/dona",
    "http://buy.stripe.com/abc", // sin https
    "https://stripe.com.malicioso.io/x", // dominio disfrazado
    "https://buy.stripe.com/", // sin ruta
    "javascript:alert(1)",
    "",
  ])("rechaza %s", (url) => {
    expect(esEnlacePagoValido(url)).toBe(false);
  });
});

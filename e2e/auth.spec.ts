import { expect, test } from "@playwright/test";
import messages from "../messages/es.json";
import { cerrarSesion, esperarSesion, iniciarSesion, registrarse } from "./sesion";

/**
 * E2E de auth contra el stack local (`npx supabase start`).
 * Con confirmaciones desactivadas en local, el registro crea sesión inmediata.
 */
const email = `e2e-${Date.now()}@test.com`;
const password = "Secreta-123-E2E";

test.describe.serial("registro, logout y login", () => {
  test("una persona se registra como adoptante y queda logueada", async ({ page }) => {
    await registrarse(page, { email, password, nombre: "E2E Adoptante" });
    await esperarSesion(page);
  });

  test("cierra sesión y vuelve a entrar con sus credenciales", async ({ page }) => {
    await iniciarSesion(page, email, password);
    await cerrarSesion(page);
  });

  test("login con contraseña mala muestra error genérico", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(messages.auth.email).fill(email);
    await page.getByLabel(messages.auth.password, { exact: true }).fill("incorrecta-999");
    await page.getByRole("button", { name: messages.auth.submitLogin }).click();
    // Filtrado por texto: Next añade su propio route-announcer con role=alert
    await expect(
      page.getByRole("alert").filter({ hasText: messages.auth.genericError }),
    ).toBeVisible();
  });
});

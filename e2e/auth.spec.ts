import { expect, test } from "@playwright/test";
import messages from "../messages/es.json";

/**
 * E2E de auth contra el stack local (`npx supabase start`).
 * Con confirmaciones desactivadas en local, el registro crea sesión inmediata.
 */
const email = `e2e-${Date.now()}@test.com`;
const password = "Secreta-123-E2E";

test.describe.serial("registro, logout y login", () => {
  test("una persona se registra como adoptante y queda logueada", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel(messages.auth.fullName).fill("E2E Adoptante");
    await page.getByLabel(messages.auth.email).fill(email);
    await page.getByLabel(messages.auth.password, { exact: true }).fill(password);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: messages.auth.submitRegister }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("button", { name: messages.auth.logout }),
    ).toBeVisible();
  });

  test("cierra sesión y vuelve a entrar con sus credenciales", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(messages.auth.email).fill(email);
    await page.getByLabel(messages.auth.password, { exact: true }).fill(password);
    await page.getByRole("button", { name: messages.auth.submitLogin }).click();
    await expect(page).toHaveURL("/");
    const salir = page.getByRole("button", { name: messages.auth.logout });
    await expect(salir).toBeVisible();

    await salir.click();
    await expect(
      page.getByRole("link", { name: messages.nav.login }),
    ).toBeVisible();
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

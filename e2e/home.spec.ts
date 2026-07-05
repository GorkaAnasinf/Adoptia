import { expect, test } from "@playwright/test";
import messages from "../messages/es.json";

test("la home carga con el titular del design system", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: messages.home.title }),
  ).toBeVisible();
});

test("el panel sin sesión redirige a login", async ({ page }) => {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/login/);
});

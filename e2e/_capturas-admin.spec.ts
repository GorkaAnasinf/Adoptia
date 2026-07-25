import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import messages from "../messages/es.json";

/**
 * Capturas de las pantallas de administración para el manual (IMPROVEMENT-035).
 * Requiere un usuario con rol admin (en local se promueve a un demo). Se salta
 * salvo con CAPTURAS=1:
 *   CAPTURAS=1 npx playwright test e2e/_capturas-admin.spec.ts --project=chromium --workers=1
 */

const DIR = join(process.cwd(), "docs", "manual", "img");
mkdirSync(DIR, { recursive: true });
const PASS = "AdoptiaDemo1!";

test.use({ viewport: { width: 1366, height: 900 } });
test.describe.configure({ timeout: 240_000 });

test.beforeEach(() => {
  test.skip(!process.env.CAPTURAS, "Capturas del manual: ejecutar con CAPTURAS=1");
});

async function asentar(page: import("@playwright/test").Page, ms = 900) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

test("administracion", async ({ page }) => {
  // Login propio (el helper compartido asume el menú de usuario del shell,
  // que la administración no expone igual): basta con salir de /login.
  await page.goto("/login");
  await page.getByLabel(messages.auth.email).fill("adoptante.luis@demo.adoptia.es");
  await page.getByLabel(messages.auth.password, { exact: true }).fill(PASS);
  await page.getByRole("button", { name: messages.auth.submitLogin }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });

  const rutas: [string, string][] = [
    ["/admin/protectoras", "admin-protectoras.png"],
    ["/admin/reportes", "admin-reportes.png"],
    ["/admin/auditoria", "admin-auditoria.png"],
  ];
  for (const [ruta, archivo] of rutas) {
    await page.goto(ruta);
    await asentar(page);
    await page.screenshot({ path: join(DIR, archivo) });
  }
});

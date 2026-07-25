import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Capturas para el manual de usuario (IMPROVEMENT-035). No es un test de
 * verdad: navega a las pantallas públicas y guarda un PNG de cada una en
 * `assets/manual/`. Se ejecuta a mano:
 *   npx playwright test e2e/_capturas.spec.ts --project=chromium --workers=1
 */

const DIR = join(process.cwd(), "docs", "manual", "img");
mkdirSync(DIR, { recursive: true });

test.use({ viewport: { width: 1366, height: 900 } });

// No es una suite de verdad: solo genera las capturas del manual. Se salta en
// las corridas normales (y en CI). Para regenerarlas:
//   CAPTURAS=1 npx playwright test e2e/_capturas.spec.ts --project=chromium --workers=1
test.beforeEach(() => {
  test.skip(!process.env.CAPTURAS, "Capturas del manual: ejecutar con CAPTURAS=1");
});

async function asentar(page: import("@playwright/test").Page, ms = 900) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

test("home", async ({ page }) => {
  await page.goto("/");
  await asentar(page);
  await page.screenshot({ path: join(DIR, "home.png") });
});

test("listado de animales", async ({ page }) => {
  await page.goto("/animales");
  await asentar(page);
  await page.screenshot({ path: join(DIR, "animales-listado.png") });
});

test("ficha de animal", async ({ page }) => {
  await page.goto("/animales/luna-demo0001");
  await asentar(page);
  await page.screenshot({ path: join(DIR, "ficha-animal.png") });
});

test("directorio de protectoras", async ({ page }) => {
  await page.goto("/protectoras");
  await asentar(page);
  await page.screenshot({ path: join(DIR, "protectoras.png") });
});

test("perfil de protectora", async ({ page }) => {
  await page.goto("/protectoras/huellas-madrid");
  await asentar(page);
  await page.screenshot({ path: join(DIR, "protectora-perfil.png") });
});

test("mapa de protectoras", async ({ page }) => {
  await page.goto("/mapa");
  await asentar(page, 2500); // los tiles de Leaflet tardan
  await page.screenshot({ path: join(DIR, "mapa.png") });
});

test("guias indice", async ({ page }) => {
  await page.goto("/guias");
  await asentar(page);
  await page.screenshot({ path: join(DIR, "guias.png") });
});

test("guia articulo", async ({ page }) => {
  await page.goto("/guias");
  await asentar(page);
  await page.locator("main a[href^='/guias/']").first().click();
  await page.waitForURL(/\/guias\/.+/);
  await asentar(page);
  await page.screenshot({ path: join(DIR, "guia-articulo.png") });
});

test("casas de acogida", async ({ page }) => {
  await page.goto("/acogida");
  await asentar(page);
  await page.screenshot({ path: join(DIR, "acogida.png") });
});

test("necesidades", async ({ page }) => {
  await page.goto("/necesidades");
  await asentar(page);
  await page.screenshot({ path: join(DIR, "necesidades.png") });
});

test("perdidos y encontrados", async ({ page }) => {
  await page.goto("/perdidos-encontrados");
  await asentar(page, 2000); // tiene mapa
  await page.screenshot({ path: join(DIR, "perdidos.png") });
});

test("jornadas listado", async ({ page }) => {
  await page.goto("/jornadas");
  await asentar(page, 2000); // tiene mapa
  await page.screenshot({ path: join(DIR, "jornadas-listado.png") });
});

test("jornada ficha", async ({ page }) => {
  await page.goto("/jornadas/55555555-5555-4555-8555-555555555501");
  await asentar(page, 2000); // mini-mapa
  await page.screenshot({ path: join(DIR, "jornadas-ficha.png") });
});

test("home movil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await asentar(page);
  await page.screenshot({ path: join(DIR, "home-movil.png") });
});

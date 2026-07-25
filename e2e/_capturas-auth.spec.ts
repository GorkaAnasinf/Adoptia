import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { iniciarSesion } from "./sesion";

/**
 * Capturas de pantallas autenticadas para el manual (IMPROVEMENT-035).
 * Usa los usuarios demo del seed (contraseña AdoptiaDemo1!). Ejecutar a mano:
 *   npx playwright test e2e/_capturas-auth.spec.ts --project=chromium --workers=1
 */

const DIR = join(process.cwd(), "docs", "manual", "img");
mkdirSync(DIR, { recursive: true });
const PASS = "AdoptiaDemo1!";

test.use({ viewport: { width: 1366, height: 900 } });
test.describe.configure({ timeout: 240_000 });

// Solo genera las capturas del manual; se salta en las corridas normales y CI.
//   CAPTURAS=1 npx playwright test e2e/_capturas-auth.spec.ts --project=chromium --workers=1
test.beforeEach(() => {
  test.skip(!process.env.CAPTURAS, "Capturas del manual: ejecutar con CAPTURAS=1");
});

async function asentar(page: import("@playwright/test").Page, ms = 900) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

test("panel de la protectora", async ({ page }) => {
  await iniciarSesion(page, "protectora.madrid@demo.adoptia.es", PASS, /\/panel/);
  const rutas: [string, string][] = [
    ["/panel", "panel-dashboard.png"],
    ["/panel/animales", "panel-animales.png"],
    ["/panel/solicitudes", "panel-solicitudes.png"],
    ["/panel/agenda", "panel-agenda.png"],
    ["/panel/estadisticas", "panel-estadisticas.png"],
    ["/panel/necesidades", "panel-necesidades.png"],
    ["/panel/acogida", "panel-acogida.png"],
  ];
  for (const [ruta, archivo] of rutas) {
    await page.goto(ruta);
    await asentar(page);
    await page.screenshot({ path: join(DIR, archivo) });
  }
});

test("panel jornadas", async ({ page }) => {
  await iniciarSesion(page, "protectora.madrid@demo.adoptia.es", PASS, /\/panel/);
  const rutas: [string, string][] = [
    ["/panel/jornadas", "panel-jornadas.png"],
    ["/panel/jornadas/nueva", "panel-jornada-nueva.png"],
  ];
  for (const [ruta, archivo] of rutas) {
    await page.goto(ruta);
    await asentar(page);
    await page.screenshot({ path: join(DIR, archivo) });
  }
});

test("area del adoptante", async ({ page }) => {
  await iniciarSesion(page, "adoptante.ana@demo.adoptia.es", PASS, "/");
  const rutas: [string, string][] = [
    ["/mi-cuenta", "cuenta-dashboard.png"],
    ["/mi-cuenta/favoritos", "cuenta-favoritos.png"],
    ["/mi-cuenta/solicitudes", "cuenta-solicitudes.png"],
    ["/mi-cuenta/citas", "cuenta-citas.png"],
    ["/mi-cuenta/alertas", "cuenta-alertas.png"],
  ];
  for (const [ruta, archivo] of rutas) {
    await page.goto(ruta);
    await asentar(page);
    await page.screenshot({ path: join(DIR, archivo) });
  }
});

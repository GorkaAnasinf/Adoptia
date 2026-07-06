import { expect, test } from "@playwright/test";
import messages from "../messages/es.json";

/**
 * E2E del onboarding de protectora contra el stack local.
 * El geocoding se intercepta (determinista, sin llamar a Nominatim).
 * La verificación por admin y la visibilidad pública se cubren en los tests
 * de integración (endpoint verificar + RLS); el perfil público llega en
 * FEATURE-004/005, así que aquí llegamos hasta el estado "en revisión".
 */
const t = messages.onboarding;

/** Genera un CIF español válido (tipo B, control numérico) único por ejecución. */
function cifValido(): string {
  const cuerpo = String(Math.floor(1_000_000 + Math.random() * 8_999_999));
  let par = 0;
  let impar = 0;
  for (let i = 0; i < 7; i++) {
    const n = Number(cuerpo[i]);
    if ((i + 1) % 2 === 0) par += n;
    else {
      const d = n * 2;
      impar += Math.floor(d / 10) + (d % 10);
    }
  }
  const control = (10 - ((par + impar) % 10)) % 10;
  return `B${cuerpo}${control}`;
}

test("una protectora se registra, completa el wizard y queda en revisión", async ({ page }) => {
  const sello = Date.now();
  const email = `e2e-shelter-${sello}@test.com`;
  const password = "Secreta-123-E2E";

  // Geocode determinista
  await page.route("**/api/protectoras/geocode", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { lat: 43.263, lng: -2.935, source: "nominatim" } }),
    }),
  );

  // --- Registro como protectora ---
  await page.goto("/registro");
  await page.getByRole("radio", { name: messages.auth.typeShelter }).click();
  await page.getByLabel(messages.auth.fullName).fill("E2E Protectora");
  await page.getByLabel(messages.auth.email).fill(email);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: messages.auth.submitRegister }).click();

  // El gate de onboarding confina al wizard
  await expect(page).toHaveURL(/\/panel\/alta/);
  await expect(page.getByRole("heading", { name: t.title })).toBeVisible();

  // --- Paso 1: entidad ---
  await page.getByLabel(t.name).fill(`Refugio E2E ${sello}`);
  await page.getByLabel(t.cif, { exact: true }).fill(cifValido());
  await page.getByLabel(t.entityEmail).fill(`entidad-${sello}@test.com`);
  await page.getByLabel(t.phone).fill("600123456");
  await page.getByRole("button", { name: t.next }).click();

  // --- Paso 2: ubicación ---
  await expect(page.getByLabel(t.address)).toBeVisible();
  await page.getByLabel(t.address).fill("Calle Mayor 1");
  await page.getByLabel(t.city).fill("Bilbao");
  await page.getByLabel(t.province).fill("Bizkaia");
  await page.getByLabel(t.postalCode).fill("48001");
  await page.getByRole("button", { name: t.locate }).click();
  await page.getByRole("button", { name: t.next }).click();

  // --- Paso 3: perfil ---
  await expect(page.getByText(t.hoursTitle)).toBeVisible();
  await page.getByLabel(t.description).fill("Somos un refugio de prueba E2E.");
  await page.getByRole("button", { name: t.finish }).click();

  // --- Enviada a revisión ---
  await expect(page.getByRole("heading", { name: t.reviewTitle })).toBeVisible();

  // El panel muestra el banner "en revisión"
  await page.goto("/panel");
  await expect(page.getByText(t.bannerPending)).toBeVisible();
});

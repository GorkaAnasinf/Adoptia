import { expect, test } from "@playwright/test";
import messages from "../messages/es.json";

/**
 * E2E de FEATURE-003 contra el stack local: una protectora da de alta un
 * animal con 3 fotos + portada y lo publica. Requiere `npx supabase start`
 * y el dev server (playwright.config levanta la app).
 */
const to = messages.onboarding;
const ta = messages.animales;

// PNG 1x1 válido: browser-image-compression necesita una imagen real.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

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

test("una protectora da de alta un animal con 3 fotos + portada y lo publica", async ({
  page,
}) => {
  const sello = Date.now();

  await page.route("**/api/protectoras/geocode", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { lat: 43.263, lng: -2.935, source: "nominatim" } }),
    }),
  );

  // --- Registro + onboarding mínimo (para pasar el gate del panel) ---
  await page.goto("/registro");
  await page.getByRole("radio", { name: messages.auth.typeShelter }).click();
  await page.getByLabel(messages.auth.fullName).fill("E2E Animales");
  await page.getByLabel(messages.auth.email).fill(`e2e-animales-${sello}@test.com`);
  await page.getByLabel(messages.auth.password, { exact: true }).fill("Secreta-123-E2E");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: messages.auth.submitRegister }).click();

  await expect(page).toHaveURL(/\/panel\/alta/);
  await page.getByLabel(to.name).fill(`Refugio E2E ${sello}`);
  await page.getByLabel(to.cif, { exact: true }).fill(cifValido());
  await page.getByLabel(to.entityEmail).fill(`entidad-${sello}@test.com`);
  await page.getByLabel(to.phone).fill("600123456");
  await page.getByRole("button", { name: to.next }).click();

  await page.getByLabel(to.address).fill("Calle Mayor 1");
  await page.getByLabel(to.city).fill("Bilbao");
  await page.getByLabel(to.province).fill("Bizkaia");
  await page.getByLabel(to.postalCode).fill("48001");
  await page.getByRole("button", { name: to.locate }).click();
  await page.getByRole("button", { name: to.next }).click();

  await page.getByLabel(to.description).fill("Refugio E2E.");
  await page.getByRole("button", { name: to.finish }).click();
  await expect(page.getByRole("heading", { name: to.reviewTitle })).toBeVisible();

  // --- Nueva ficha ---
  await page.goto("/panel/animales/nueva");
  await page.getByLabel(ta.fName).fill("Luna E2E");
  await page.getByLabel(ta.fSpecies).selectOption("dog");
  await page.getByLabel(ta.fSex).selectOption("female");
  await page.getByLabel(ta.fSize).selectOption("medium");
  await page.getByLabel(ta.fDescription).fill("Perra cariñosa de prueba E2E.");

  // Guardar borrador para que exista la fila y se habilite el uploader.
  await page.getByRole("button", { name: ta.saveDraft }).click();

  // Subir 3 fotos por el input oculto.
  await page.locator('input[type="file"]').setInputFiles([
    { name: "foto1.png", mimeType: "image/png", buffer: PNG_1x1 },
    { name: "foto2.png", mimeType: "image/png", buffer: PNG_1x1 },
    { name: "foto3.png", mimeType: "image/png", buffer: PNG_1x1 },
  ]);

  // Aparecen 3 miniaturas y la primera es portada.
  await expect(page.getByRole("listitem").filter({ has: page.locator("img") })).toHaveCount(3);
  await expect(page.getByText(ta.cover)).toBeVisible();

  // Marcar la segunda como portada.
  await page.getByRole("button", { name: ta.makeCover }).first().click();

  // --- Publicar ---
  await page.getByRole("button", { name: ta.publish }).click();
  await expect(page).toHaveURL(/\/panel\/animales$/);
  await expect(page.getByText("Luna E2E")).toBeVisible();
  await expect(page.getByText(ta.published)).toBeVisible();
});

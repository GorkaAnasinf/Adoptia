import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import messages from "../messages/es.json";
import { MOTIVO_SALTO, SERVICE_KEY, TEST_URL, e2eDisponible } from "./entorno";
import { asegurarUsuario, sembrarPorSlug } from "./fixtures";
import { cerrarSesion, iniciarSesion } from "./sesion";

/**
 * E2E de FEATURE-007: flujo completo "Me interesa" → cuestionario → bandeja
 * de la protectora → aprobar. Siembra la protectora + animal disponible con
 * service_role (como area-publica.spec.ts); el adoptante y la protectora
 * inician sesión por la UI real. Se salta sin `npx supabase start` +
 * variables SUPABASE_TEST_*.
 */
const URL = TEST_URL;

test.skip(!e2eDisponible, MOTIVO_SALTO);

const t = messages.solicitud;
const tp = messages.solicitudesPanel;

const sello = Date.now();
const ANIMAL = { name: `Pipa E2E ${sello}`, slug: `pipa-e2e-${sello}` };
const SHELTER_EMAIL = `e2e-solic-protectora-${sello}@test.com`;
const SHELTER_PASS = "Secreta-123-E2E";
const ADOPTER_EMAIL = `e2e-solic-adoptante-${sello}@test.com`;
const ADOPTER_PASS = "Secreta-123-E2E";

test.beforeAll(async () => {
  const admin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ownerId = await asegurarUsuario(admin, SHELTER_EMAIL, SHELTER_PASS, { role: "shelter" });

  const shelter = (await sembrarPorSlug(admin, "shelters", {
    owner_id: ownerId,
    name: `Protectora E2E Solicitudes ${sello}`,
    slug: `protectora-e2e-solic-${sello}`,
    status: "verified",
    submitted_at: new Date().toISOString(),
    city: "Bilbao",
    province: "Bizkaia",
    location: "POINT(-2.94 43.26)",
  })) as { id: string };

  await sembrarPorSlug(admin, "animals", {
    shelter_id: shelter.id,
    name: ANIMAL.name,
    slug: ANIMAL.slug,
    species: "dog",
    sex: "female",
    size: "medium",
    description: "Pipa espera una familia (E2E FEATURE-007).",
    status: "available",
    published_at: new Date().toISOString(),
  });
});

test("me interesa → cuestionario → bandeja de la protectora → aprobar", async ({ page }) => {
  // --- Adoptante: se registra y rellena el cuestionario ---
  await page.goto("/registro");
  await page.getByLabel(messages.auth.fullName).fill("Marta E2E");
  await page.getByLabel(messages.auth.email).fill(ADOPTER_EMAIL);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(ADOPTER_PASS);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: messages.auth.submitRegister }).click();
  await expect(page).toHaveURL("/");

  await page.goto(`/animales/${ANIMAL.slug}`);
  await page.getByRole("button", { name: messages.ficha.interesa }).first().click();
  await expect(page).toHaveURL(new RegExp(`/mi-cuenta/solicitudes/nueva/${ANIMAL.slug}`));

  // Paso 1: vivienda. El radio es `sr-only` dentro de una tarjeta-label, así
  // que `check()` sobre el input se queda esperando a que sea "visible" para
  // siempre: se pulsa la tarjeta, que es lo que hace una persona (BUG-008).
  await page.locator("label").filter({ hasText: t.viviendaPiso }).click();
  // El régimen pasó de radios a un `select`: «Propiedad» es una opción, no una
  // etiqueta que marcar (BUG-008).
  await page.getByLabel(t.regimen).selectOption("propiedad");
  await page.getByRole("button", { name: t.next }).click();

  // Paso 2: hogar
  await page.getByLabel(t.convivientes).fill("2");
  await page.getByRole("button", { name: t.next }).click();

  // Paso 3: experiencia
  await page.getByLabel(t.horasSolo).fill("3");
  await page.getByLabel(t.todosDeAcuerdo).check();
  await page.getByRole("button", { name: t.next }).click();

  // Paso 4: motivación + envío
  await page.getByLabel(t.message).fill("Quiero mucho a Pipa y tengo experiencia con perros.");
  await page.getByLabel("Acepto que mis datos").check();
  await page.getByRole("button", { name: t.submit }).click();

  await expect(page.getByRole("heading", { name: t.successTitle })).toBeVisible();

  // --- Protectora: revisa la bandeja y aprueba ---
  await cerrarSesion(page);
  // A la protectora `destinoPostLogin` la lleva al panel, no a la home.
  await iniciarSesion(page, SHELTER_EMAIL, SHELTER_PASS, /\/panel/);

  await page.goto("/panel/solicitudes");
  await expect(page.getByText("Marta E2E")).toBeVisible();
  await page.getByText("Marta E2E").click();
  await expect(page.getByText("Quiero mucho a Pipa y tengo experiencia con perros.")).toBeVisible();

  await page.getByRole("button", { name: tp.approve }).click();
  await expect(page.getByText(tp.statusApproved)).toBeVisible();
});

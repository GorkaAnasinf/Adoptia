import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { MOTIVO_SALTO, SERVICE_KEY, TEST_URL, e2eDisponible } from "./entorno";
import { asegurarUsuario, sembrarPorSlug } from "./fixtures";

/**
 * E2E de FEATURE-006: permitir ubicación → protectora en la lista →
 * clic en el marcador del mapa → popup → ficha pública.
 * Siembra datos con service_role contra el stack local; se salta sin
 * variables SUPABASE_TEST_* (igual que el resto de E2E del área pública).
 *
 * Flujo de escritorio (lista lateral): en el proyecto "mobile" la lista
 * vive en el bottom sheet y duplica el texto en el DOM, así que este
 * spec se centra en el layout de escritorio.
 */
const URL = TEST_URL;

const BILBAO = { lat: 43.263, lng: -2.935 };
const PROTECTORA = { name: "Protectora E2E Mapa", slug: "protectora-e2e-mapa" };

test.skip(!e2eDisponible, MOTIVO_SALTO);

test.beforeAll(async () => {
  const admin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ownerId = await asegurarUsuario(admin, "e2e-mapa@test.com", "password-de-test-123");

  const shelter = await sembrarPorSlug(admin, "shelters", {
    owner_id: ownerId,
    name: PROTECTORA.name,
    slug: PROTECTORA.slug,
    status: "verified",
    city: "Bilbao",
    province: "Bizkaia",
    location: `POINT(${BILBAO.lng} ${BILBAO.lat})`,
  });

  await sembrarPorSlug(admin, "animals", {
    shelter_id: (shelter as { id: string }).id,
    name: "Perro E2E Mapa",
    slug: "perro-e2e-mapa",
    species: "dog",
    sex: "male",
    size: "medium",
    status: "available",
    published_at: new Date().toISOString(),
  });
});

test.beforeEach(async ({ context }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Flujo de escritorio: lista lateral visible");
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: BILBAO.lat, longitude: BILBAO.lng });
});

test("permitir ubicación → lista → marcador → popup → ficha", async ({ page }) => {
  await page.goto("/mapa");

  await page.getByRole("button", { name: "Usar mi ubicación" }).click();

  const aside = page.locator("aside");
  await expect(aside.getByText(PROTECTORA.name)).toBeVisible();

  // Esperar a que el mapa esté montado antes de tocar la lista: la lista la
  // pinta el servidor, pero el mapa entra por `dynamic import` y el botón no
  // responde hasta que React hidrata. Sin esto el clic se pierde y el popup no
  // abre nunca (BUG-008).
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon, .marker-cluster").first()).toBeVisible();

  // Seleccionar desde la lista abre el popup de su marcador (MapaShell pasa el
  // `selectedId` al mapa, que hace `openPopup`). Antes el test buscaba el
  // marcador por su `alt`, pero los marcadores viven en un
  // `markerClusterGroup`: agrupados con los del seed, no existen en el DOM y el
  // clic esperaba para siempre. El clustering llegó después que este test y lo
  // dejó roto (BUG-008). Además, pinchar en la lista es lo que hace la gente.
  await aside.getByRole("button", { name: new RegExp(PROTECTORA.name) }).click();

  const popup = page.locator(".leaflet-popup");
  await expect(popup.getByText(PROTECTORA.name)).toBeVisible();
  await popup.getByRole("link", { name: "Ver protectora" }).click();

  await expect(page).toHaveURL(new RegExp(`/protectoras/${PROTECTORA.slug}`));
  await expect(page.getByRole("heading", { level: 1, name: PROTECTORA.name })).toBeVisible();
});

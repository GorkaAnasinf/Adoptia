import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { MOTIVO_SALTO, SERVICE_KEY, TEST_URL, e2eDisponible } from "./entorno";

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

  let ownerId: string | undefined;
  const { data: creado, error } = await admin.auth.admin.createUser({
    email: "e2e-mapa@test.com",
    password: "password-de-test-123",
    email_confirm: true,
  });
  if (!error) ownerId = creado.user.id;
  else {
    const { data: lista } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    ownerId = lista.users.find((u) => u.email === "e2e-mapa@test.com")?.id;
  }
  if (!ownerId) throw new Error("No se pudo crear el usuario del seed");

  const { data: shelter, error: es } = await admin
    .from("shelters")
    .upsert(
      {
        owner_id: ownerId,
        name: PROTECTORA.name,
        slug: PROTECTORA.slug,
        status: "verified",
        city: "Bilbao",
        province: "Bizkaia",
        location: `POINT(${BILBAO.lng} ${BILBAO.lat})`,
      },
      { onConflict: "slug" },
    )
    .select()
    .single();
  if (es) throw es;

  const { error: ea } = await admin.from("animals").upsert(
    {
      shelter_id: shelter.id,
      name: "Perro E2E Mapa",
      slug: "perro-e2e-mapa",
      species: "dog",
      sex: "male",
      size: "medium",
      status: "available",
      published_at: new Date().toISOString(),
    },
    { onConflict: "slug" },
  );
  if (ea) throw ea;
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

  // Clic en el marcador de esta protectora (alt = nombre, evita ambigüedad
  // con otros marcadores/clusters que pueda haber en el mapa).
  await page.getByAltText(PROTECTORA.name).click();

  const popup = page.locator(".leaflet-popup");
  await expect(popup.getByText(PROTECTORA.name)).toBeVisible();
  await popup.getByRole("link", { name: "Ver protectora" }).click();

  await expect(page).toHaveURL(new RegExp(`/protectoras/${PROTECTORA.slug}`));
  await expect(page.getByRole("heading", { level: 1, name: PROTECTORA.name })).toBeVisible();
});

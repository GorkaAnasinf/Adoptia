import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * E2E de FEATURE-006: clustering con volumen real (200+ protectoras).
 * Verifica que el mapa no se rompe ni se cuelga con muchos marcadores y que
 * el clustering agrupa los puntos cercanos en vez de pintar 200+ pines sueltos.
 * Se salta sin variables SUPABASE_TEST_* (igual que el resto de E2E).
 */
const URL = process.env.SUPABASE_TEST_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? "";

const TOTAL_PROTECTORAS = 220;
// Todas muy cerca entre sí (Madrid ± ~0.05º) para forzar un cluster grande.
const MADRID = { lat: 40.4165, lng: -3.7026 };

test.skip(!URL || !SERVICE_KEY, "Requiere npx supabase start + variables SUPABASE_TEST_*");

test.beforeAll(async () => {
  const admin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let ownerId: string | undefined;
  const { data: creado, error } = await admin.auth.admin.createUser({
    email: "e2e-mapa-clustering@test.com",
    password: "password-de-test-123",
    email_confirm: true,
  });
  if (!error) ownerId = creado.user.id;
  else {
    const { data: lista } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    ownerId = lista.users.find((u) => u.email === "e2e-mapa-clustering@test.com")?.id;
  }
  if (!ownerId) throw new Error("No se pudo crear el usuario del seed");

  const filas = Array.from({ length: TOTAL_PROTECTORAS }, (_, i) => ({
    owner_id: ownerId,
    name: `Protectora Cluster ${i}`,
    slug: `protectora-cluster-e2e-${i}`,
    status: "verified",
    city: "Madrid",
    location: `POINT(${MADRID.lng + (i % 20) * 0.002} ${MADRID.lat + Math.floor(i / 20) * 0.002})`,
  }));

  const { error: es } = await admin.from("shelters").upsert(filas, { onConflict: "slug" });
  if (es) throw es;
});

test("el mapa agrupa 200+ protectoras en clusters sin romperse", async ({ page }) => {
  await page.goto("/mapa");

  // El cluster (icono con el recuento) debe aparecer; con 220 puntos muy
  // próximos no deberíamos ver 220 marcadores sueltos.
  const cluster = page.locator(".marker-cluster").first();
  await expect(cluster).toBeVisible({ timeout: 20_000 });

  const marcadoresSueltos = await page.locator(".leaflet-marker-icon").count();
  expect(marcadoresSueltos).toBeLessThan(TOTAL_PROTECTORAS);

  // Clic en el cluster: debe hacer zoom/spiderfy sin lanzar errores de consola.
  const erroresConsola: string[] = [];
  page.on("pageerror", (err) => erroresConsola.push(String(err)));
  await cluster.click();
  await page.waitForTimeout(500);
  expect(erroresConsola).toEqual([]);
});

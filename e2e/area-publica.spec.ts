import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import messages from "../messages/es.json";
import { MOTIVO_SALTO, SERVICE_KEY, TEST_URL, e2eDisponible } from "./entorno";
import { asegurarUsuario, sembrarPorSlug } from "./fixtures";

/**
 * E2E de FEATURE-005: home → filtrar → ficha → volver conservando filtros.
 * Siembra datos con service_role contra el stack local; se salta sin
 * variables SUPABASE_TEST_* (igual que los tests de RLS).
 */
const URL = TEST_URL;

const PERRO = { name: "Bombón E2E", slug: "bombon-e2e-publica" };
const GATO = { name: "Michi E2E", slug: "michi-e2e-publica" };

test.skip(!e2eDisponible, MOTIVO_SALTO);

test.beforeAll(async () => {
  const admin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ownerId = await asegurarUsuario(admin, "e2e-publica@test.com", "password-de-test-123");

  const shelter = (await sembrarPorSlug(admin, "shelters", {
    owner_id: ownerId,
    name: "Protectora E2E Pública",
    slug: "protectora-e2e-publica",
    status: "verified",
    city: "Bilbao",
    province: "Bizkaia",
    location: "POINT(-2.94 43.26)",
  })) as { id: string };

  const publicado = new Date().toISOString();
  for (const animal of [
    {
      shelter_id: shelter.id,
      name: PERRO.name,
      slug: PERRO.slug,
      species: "dog",
      sex: "male",
      size: "medium",
      description: "Perro del E2E del área pública.",
      status: "available",
      published_at: publicado,
    },
    {
      shelter_id: shelter.id,
      name: GATO.name,
      slug: GATO.slug,
      species: "cat",
      sex: "female",
      size: "small",
      description: "Gata del E2E del área pública.",
      status: "available",
      published_at: publicado,
    },
  ]) {
    await sembrarPorSlug(admin, "animals", animal);
  }
});

test("home → filtrar por especie → ficha → volver conservando filtros", async ({ page }) => {
  // Home: buscador rápido
  await page.goto("/");
  await page.getByRole("link", { name: messages.home.quickDogs }).click();

  // Listado filtrado por perros, reflejado en la URL
  await expect(page).toHaveURL(/\/animales\?especie=dog/);
  await expect(page.getByText(PERRO.name)).toBeVisible();
  await expect(page.getByText(GATO.name)).not.toBeVisible();

  // Ficha del animal
  await page.getByRole("link", { name: new RegExp(PERRO.name) }).click();
  await expect(page).toHaveURL(new RegExp(`/animales/${PERRO.slug}`));
  await expect(page.getByRole("heading", { level: 1, name: PERRO.name })).toBeVisible();
  await expect(page.getByText("Protectora E2E Pública")).toBeVisible();

  // Volver conserva el filtro en la URL y en el listado
  await page.goBack();
  await expect(page).toHaveURL(/especie=dog/);
  await expect(page.getByText(PERRO.name)).toBeVisible();
  await expect(page.getByText(GATO.name)).not.toBeVisible();
});

test("la ficha de un animal inexistente ofrece una página amable con sugerencias", async ({
  page,
}) => {
  await page.goto("/animales/no-existe-xyz");
  await expect(page.getByText(messages.ficha.notFoundTitle)).toBeVisible();
  await expect(page.getByRole("link", { name: messages.ficha.verTodos })).toBeVisible();
});

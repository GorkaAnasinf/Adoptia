import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import messages from "../messages/es.json";

/**
 * E2E de FEATURE-012: un aviso abierto aparece en la sección de perdidos y
 * encontrados y su autor lo resuelve con historia. El aviso se siembra con
 * service_role (la publicación por UI está cubierta por tests de componente).
 * Se salta sin `npx supabase start` + variables SUPABASE_TEST_*.
 */
const URL = process.env.SUPABASE_TEST_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? "";

test.skip(!URL || !SERVICE_KEY, "Requiere npx supabase start + variables SUPABASE_TEST_*");

const t = messages.perdidos;
const sello = Date.now();
const AUTOR_EMAIL = `e2e-perdidos-${sello}@test.com`;
const PASS = "Secreta-123-E2E";
const NOMBRE = `Rocky E2E ${sello}`;
let avisoId = "";

test.beforeAll(async () => {
  const admin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: creado, error } = await admin.auth.admin.createUser({
    email: AUTOR_EMAIL,
    password: PASS,
    email_confirm: true,
    user_metadata: { role: "adopter", full_name: "Autora Perdidos E2E" },
  });
  if (error) throw error;

  const { data: aviso, error: ea } = await admin
    .from("lost_found_posts")
    .insert({
      user_id: creado.user.id,
      type: "lost",
      species: "dog",
      name: NOMBRE,
      description: "Se perdió en el parque (E2E FEATURE-012).",
      location: "POINT(-2.9346 43.2631)",
      city: "Bilbao",
    })
    .select()
    .single();
  if (ea) throw ea;
  avisoId = aviso.id;
});

test("el aviso aparece en el listado y su autor lo resuelve con historia", async ({ page }) => {
  // Visible públicamente (sin sesión)
  await page.goto("/perdidos-encontrados");
  await expect(page.getByRole("link", { name: NOMBRE })).toBeVisible();

  // El autor entra y resuelve desde el detalle
  await page.goto("/login");
  await page.getByLabel(messages.auth.email).fill(AUTOR_EMAIL);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(PASS);
  await page.getByRole("button", { name: messages.auth.submitLogin }).click();
  await expect(page).toHaveURL("/");

  await page.goto(`/perdidos-encontrados/${avisoId}`);
  await expect(page.getByRole("heading", { name: NOMBRE })).toBeVisible();

  await page.getByRole("button", { name: t.resolver }).click();
  await page.getByLabel(t.resolverHistoria).fill("¡Apareció sano y salvo en casa de un vecino!");
  await page.getByRole("button", { name: t.resolverConfirmar }).click();

  await expect(page.getByText(t.resueltoBadge)).toBeVisible();
  await expect(page.getByText(/sano y salvo/)).toBeVisible();

  // Resuelto: fuera del listado de abiertos
  await page.goto("/perdidos-encontrados");
  await expect(page.getByRole("link", { name: NOMBRE })).toHaveCount(0);
});

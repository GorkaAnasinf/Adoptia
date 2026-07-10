import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import messages from "../messages/es.json";

/**
 * E2E de FEATURE-007: flujo completo "Me interesa" → cuestionario → bandeja
 * de la protectora → aprobar. Siembra la protectora + animal disponible con
 * service_role (como area-publica.spec.ts); el adoptante y la protectora
 * inician sesión por la UI real. Se salta sin `npx supabase start` +
 * variables SUPABASE_TEST_*.
 */
const URL = process.env.SUPABASE_TEST_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? "";

test.skip(!URL || !SERVICE_KEY, "Requiere npx supabase start + variables SUPABASE_TEST_*");

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

  const { data: creado, error } = await admin.auth.admin.createUser({
    email: SHELTER_EMAIL,
    password: SHELTER_PASS,
    email_confirm: true,
    user_metadata: { role: "shelter" },
  });
  let ownerId = creado?.user?.id;
  if (error) {
    const { data: lista } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    ownerId = lista.users.find((u) => u.email === SHELTER_EMAIL)?.id;
  }
  if (!ownerId) throw new Error("No se pudo crear la protectora del seed");

  const { data: shelter, error: es } = await admin
    .from("shelters")
    .upsert(
      {
        owner_id: ownerId,
        name: `Protectora E2E Solicitudes ${sello}`,
        slug: `protectora-e2e-solic-${sello}`,
        status: "verified",
        submitted_at: new Date().toISOString(),
        city: "Bilbao",
        province: "Bizkaia",
        location: "POINT(-2.94 43.26)",
      },
      { onConflict: "slug" },
    )
    .select()
    .single();
  if (es) throw es;

  const { error: ea } = await admin.from("animals").upsert(
    {
      shelter_id: shelter.id,
      name: ANIMAL.name,
      slug: ANIMAL.slug,
      species: "dog",
      sex: "female",
      size: "medium",
      description: "Pipa espera una familia (E2E FEATURE-007).",
      status: "available",
      published_at: new Date().toISOString(),
    },
    { onConflict: "slug" },
  );
  if (ea) throw ea;
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

  // Paso 1: vivienda
  await page.getByLabel(t.viviendaPiso).check();
  await page.getByLabel(t.regimenPropiedad, { exact: true }).check();
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
  // El botón "Salir" vive dentro del menú de usuario (UserMenu): hay que
  // abrirlo primero (bug pre-existente en e2e/auth.spec.ts, ya reportado
  // aparte, que asume el botón visible sin abrir el menú).
  await page.getByRole("button", { name: messages.shell.userMenu }).click();
  await page.getByRole("menuitem", { name: messages.auth.logout }).click();
  await page.goto("/login");
  await page.getByLabel(messages.auth.email).fill(SHELTER_EMAIL);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(SHELTER_PASS);
  await page.getByRole("button", { name: messages.auth.submitLogin }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/panel/solicitudes");
  await expect(page.getByText("Marta E2E")).toBeVisible();
  await page.getByText("Marta E2E").click();
  await expect(page.getByText("Quiero mucho a Pipa y tengo experiencia con perros.")).toBeVisible();

  await page.getByRole("button", { name: tp.approve }).click();
  await expect(page.getByText(tp.statusApproved)).toBeVisible();
});

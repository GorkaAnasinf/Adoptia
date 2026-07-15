import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import messages from "../messages/es.json";
import { MOTIVO_SALTO, SERVICE_KEY, TEST_URL, e2eDisponible } from "./entorno";

/**
 * E2E de FEATURE-009: solicitud aprobada → el adoptante reserva un hueco →
 * la protectora ve la cita en su agenda y la marca como realizada.
 * Siembra protectora + animal + solicitud aprobada + franja diaria con
 * service_role. Se salta sin `npx supabase start` + variables SUPABASE_TEST_*.
 */
const URL = TEST_URL;

test.skip(!e2eDisponible, MOTIVO_SALTO);

const tc = messages.citas;

const sello = Date.now();
const ANIMAL = { name: `Golfo E2E ${sello}`, slug: `golfo-e2e-${sello}` };
const SHELTER_EMAIL = `e2e-citas-protectora-${sello}@test.com`;
const ADOPTER_EMAIL = `e2e-citas-adoptante-${sello}@test.com`;
const PASS = "Secreta-123-E2E";

async function crearUsuario(
  admin: SupabaseClient,
  email: string,
  role: "shelter" | "adopter",
  fullName: string,
) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASS,
    email_confirm: true,
    user_metadata: { role, full_name: fullName },
  });
  if (error) throw error;
  return data.user.id;
}

test.beforeAll(async () => {
  const admin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ownerId = await crearUsuario(admin, SHELTER_EMAIL, "shelter", "Gestora Citas E2E");
  const adopterId = await crearUsuario(admin, ADOPTER_EMAIL, "adopter", "Marta Citas E2E");

  const { data: shelter, error: es } = await admin
    .from("shelters")
    .insert({
      owner_id: ownerId,
      name: `Protectora E2E Citas ${sello}`,
      slug: `protectora-e2e-citas-${sello}`,
      status: "verified",
      submitted_at: new Date().toISOString(),
      city: "Bilbao",
      province: "Bizkaia",
      location: "POINT(-2.94 43.26)",
    })
    .select()
    .single();
  if (es) throw es;

  const { data: animal, error: ea } = await admin
    .from("animals")
    .insert({
      shelter_id: shelter.id,
      name: ANIMAL.name,
      slug: ANIMAL.slug,
      species: "dog",
      sex: "male",
      size: "medium",
      description: "Golfo espera su visita (E2E FEATURE-009).",
      status: "available",
      published_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (ea) throw ea;

  const { error: er } = await admin.from("adoption_requests").insert({
    animal_id: animal.id,
    adopter_id: adopterId,
    status: "approved",
    questionnaire: { vivienda: "piso" },
  });
  if (er) throw er;

  // Franja mañana (huecos garantizados dentro de la ventana del RPC)
  const manana = new Date(Date.now() + 24 * 3600 * 1000);
  const { error: ef } = await admin.from("availability_slots").insert({
    shelter_id: shelter.id,
    weekday: manana.getDay(),
    start_time: "10:00",
    end_time: "12:00",
    slot_minutes: 30,
  });
  if (ef) throw ef;
});

test("solicitud aprobada → reservar hueco → agenda de la protectora → realizada", async ({
  page,
}) => {
  // --- Adoptante: entra y reserva ---
  await page.goto("/login");
  await page.getByLabel(messages.auth.email).fill(ADOPTER_EMAIL);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(PASS);
  await page.getByRole("button", { name: messages.auth.submitLogin }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/mi-cuenta/solicitudes");
  await expect(page.getByText(ANIMAL.name)).toBeVisible();
  await page.getByRole("link", { name: tc.reservarVisita }).click();
  await expect(page.getByRole("heading", { name: tc.reservarTitle })).toBeVisible();

  // Elige el primer hueco del primer día y confirma
  await page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first().click();
  await page.getByRole("button", { name: tc.confirmar }).click();
  await expect(page.getByRole("heading", { name: tc.reservadaTitle })).toBeVisible();

  // La solicitud muestra ahora la cita
  await page.getByRole("link", { name: tc.verMisSolicitudes }).click();
  await expect(page.getByText(/Visita:/)).toBeVisible();

  // --- Protectora: ve la cita y la marca realizada ---
  await page.getByRole("button", { name: messages.shell.userMenu }).click();
  await page.getByRole("menuitem", { name: messages.auth.logout }).click();
  await page.goto("/login");
  await page.getByLabel(messages.auth.email).fill(SHELTER_EMAIL);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(PASS);
  await page.getByRole("button", { name: messages.auth.submitLogin }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/panel/citas");
  await expect(page.getByText(ANIMAL.name)).toBeVisible();
  await expect(page.getByText("Marta Citas E2E")).toBeVisible();

  await page.getByRole("button", { name: tc.marcarRealizada }).click();
  await expect(page.getByText(tc.estadoRealizada)).toBeVisible();
});

import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import messages from "../messages/es.json";
import { MOTIVO_SALTO, SERVICE_KEY, TEST_URL, e2eDisponible } from "./entorno";

/**
 * E2E de FEATURE-012: un aviso abierto aparece en la sección de perdidos y
 * encontrados y su autor lo resuelve con historia. El aviso se siembra con
 * service_role (la publicación por UI está cubierta por tests de componente).
 * Se salta sin `npx supabase start` + variables SUPABASE_TEST_*.
 */
const URL = TEST_URL;

test.skip(!e2eDisponible, MOTIVO_SALTO);

const t = messages.perdidos;
const sello = Date.now();
const AUTOR_EMAIL = `e2e-perdidos-${sello}@test.com`;
const PASS = "Secreta-123-E2E";
const NOMBRE = `Rocky E2E ${sello}`;
let avisoId = "";

// FEATURE-022: aviso aparte para el avistamiento — el de arriba acaba resuelto.
const VECINO_EMAIL = `e2e-vecino-${sello}@test.com`;
const NOMBRE_KIRA = `Kira E2E ${sello}`;
let avisoKiraId = "";

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

  // --- FEATURE-022 ---
  const { error: ev } = await admin.auth.admin.createUser({
    email: VECINO_EMAIL,
    password: PASS,
    email_confirm: true,
    user_metadata: { role: "adopter", full_name: "Vecino E2E" },
  });
  if (ev) throw ev;

  const { data: kira, error: ek } = await admin
    .from("lost_found_posts")
    .insert({
      user_id: creado.user.id,
      type: "lost",
      species: "dog",
      name: NOMBRE_KIRA,
      description: "Podenca canela (E2E FEATURE-022).",
      location: "POINT(-2.9346 43.2631)",
      city: "Bilbao",
    })
    .select()
    .single();
  if (ek) throw ek;
  avisoKiraId = kira.id;
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

test("un vecino reporta un avistamiento y el autor lo ve en su ficha", async ({ page, isMobile }) => {
  // El pin exige arrastrar el marcador de Leaflet. En el proyecto móvil (Pixel 7,
  // táctil) Leaflet escucha eventos touch y no hay forma fiable de sintetizar el
  // arrastre desde Playwright — limitación del arnés, no del producto. El flujo
  // en móvil queda cubierto por el E2E de FEATURE-012 y por los tests de
  // componente del formulario.
  test.skip(isMobile, "No se puede sintetizar el arrastre táctil del marcador de Leaflet");

  // Sin sesión no se puede ayudar: la ficha invita a entrar.
  await page.goto(`/perdidos-encontrados/${avisoKiraId}`);
  await expect(page.getByRole("link", { name: t.entrarParaAyudar })).toBeVisible();
  await expect(page.getByText(t.avistamientosVacio)).toBeVisible();

  // El vecino entra y reporta dónde lo vio.
  await page.goto("/login");
  await page.getByLabel(messages.auth.email).fill(VECINO_EMAIL);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(PASS);
  await page.getByRole("button", { name: messages.auth.submitLogin }).click();
  await expect(page).toHaveURL("/");

  await page.goto(`/perdidos-encontrados/${avisoKiraId}`);
  await page.getByRole("button", { name: t.avistamiento }).click();
  await page.getByLabel(t.avistamientoNota).fill("Bebiendo en la fuente del parque");

  // El pin se marca ARRASTRANDO el marcador: MapPinPicker solo emite en
  // `dragend`, un clic en el mapa no hace nada. Leaflet exige varios mousemove
  // para arrancar el arrastre, así que se mueve paso a paso.
  const marcador = page.locator(".leaflet-container").last().getByRole("button", { name: "Marker" });
  const caja = await marcador.boundingBox();
  if (!caja) throw new Error("No se encontró el marcador del picker");
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.mouse.down();
  await page.mouse.move(caja.x + caja.width / 2 + 40, caja.y + caja.height / 2 + 25, { steps: 10 });
  await page.mouse.up();

  await page.getByRole("button", { name: t.avistamientoEnviar }).click();
  await expect(page.getByText(t.avistamientoOk)).toBeVisible();

  // El autor lo encuentra en el timeline de su aviso. Hay que cerrar la sesión
  // del vecino primero: con sesión viva, /login no vuelve a autenticar.
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel(messages.auth.email).fill(AUTOR_EMAIL);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(PASS);
  await page.getByRole("button", { name: messages.auth.submitLogin }).click();
  await expect(page).toHaveURL("/");

  await page.goto(`/perdidos-encontrados/${avisoKiraId}`);
  await expect(page.getByText(/Bebiendo en la fuente/)).toBeVisible();
  await expect(page.getByRole("button", { name: t.avistamientoBorrar })).toBeVisible();
});

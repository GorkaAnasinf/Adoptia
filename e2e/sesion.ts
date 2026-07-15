import { expect, type Page } from "@playwright/test";
import messages from "../messages/es.json";

/**
 * Acciones de sesión compartidas por los E2E.
 *
 * Existen porque cada spec se las apañaba por su cuenta y, cuando FEATURE-021
 * movió «Salir» dentro del menú de usuario, unos specs se actualizaron y otros
 * se quedaron esperando un botón que ya no existía (BUG-008). Con un único
 * sitio, el próximo rediseño de la cabecera se arregla una vez.
 */

/** Espera a que la sesión esté iniciada: el avatar del menú de usuario. */
export async function esperarSesion(page: Page) {
  await expect(page.getByRole("button", { name: messages.shell.userMenu })).toBeVisible();
}

/** Espera a que NO haya sesión: el menú se sustituye por el enlace de entrar. */
export async function esperarSinSesion(page: Page) {
  await expect(page.getByRole("link", { name: messages.nav.login })).toBeVisible();
}

export async function iniciarSesion(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(messages.auth.email).fill(email);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(password);
  await page.getByRole("button", { name: messages.auth.submitLogin }).click();
  await expect(page).toHaveURL("/");
  await esperarSesion(page);
}

export async function registrarse(
  page: Page,
  { email, password, nombre }: { email: string; password: string; nombre: string },
) {
  await page.goto("/registro");
  await page.getByLabel(messages.auth.fullName).fill(nombre);
  await page.getByLabel(messages.auth.email).fill(email);
  await page.getByLabel(messages.auth.password, { exact: true }).fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: messages.auth.submitRegister }).click();
  await expect(page).toHaveURL("/");
  await esperarSesion(page);
}

/** Cierra sesión por la UI real: «Salir» vive dentro del menú de usuario. */
export async function cerrarSesion(page: Page) {
  await page.getByRole("button", { name: messages.shell.userMenu }).click();
  await page.getByRole("menuitem", { name: messages.auth.logout }).click();
  await esperarSinSesion(page);
}

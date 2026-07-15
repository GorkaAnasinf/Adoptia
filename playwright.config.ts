import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // 2 workers, no los 8 por defecto (BUG-008). Estos E2E comparten UN servidor
  // de desarrollo (turbopack compila cada ruta al entrar) y UNA base de datos:
  // no son paralelizables sin más. Medido en esta misma suite: con 8 workers
  // pasaban 8 de 28; con 2, dieciocho. Cuesta unos minutos más y a cambio los
  // resultados significan algo.
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  reporter: "list",
  // El dev server (turbopack) compila cada ruta en el primer acceso: damos
  // margen a las aserciones para no fallar por compilación en frío.
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // `npm run dev` OBLIGATORIO, no un build de producción (BUG-008): la CSP
    // (`src/lib/security-headers.ts`) solo permite el Supabase local en
    // `connect-src` cuando NODE_ENV !== "production". Con `npm run start` el
    // navegador no puede ni hablar con 127.0.0.1:54321 ("Refused to connect
    // because it violates the document's Content Security Policy") y todo
    // login/registro falla. No es una preferencia: es incompatible por diseño.
    command: "npm run dev",
    url: "http://localhost:3000",
    // OJO: en local reutiliza el servidor que ya esté escuchando en el 3000.
    // Si tienes un `npm run dev` abierto, los E2E correrán contra ÉL y no
    // contra este — pasó durante BUG-008 e invalidó una medición entera.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Sin captcha en los E2E (BUG-008). El botón de registro está
      // deshabilitado hasta que Turnstile entrega un token, y Turnstile se
      // descarga del CDN de Cloudflare: con varios workers registrando a la
      // vez, el widget tardaba, el botón no se habilitaba nunca y el clic
      // agotaba los 30 s. Turnstile es de Cloudflare, no código nuestro: los
      // E2E no tienen por qué depender de una red externa para probar NUESTROS
      // flujos. Vacío ⇒ `captchaHabilitado` es false y el widget no se pinta.
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
    },
  },
});

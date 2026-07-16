# Testing — Adoptia

## Enfoque: TDD obligatorio

Todo item de desarrollo sigue red → green → refactor. El plan de cada item (`## Tareas TDD`) lista los tests antes que la implementación. Bolt (codificador) no escribe producción sin test que falle primero; Scooby (QA) verifica cobertura y completitud.

## Herramientas

| Nivel | Herramienta | Alcance |
|-------|------------|---------|
| Unitario | **Vitest** | Esquemas Zod, utils, lógica de negocio, builders de queries |
| Componentes | **Testing Library (react)** + Vitest | Formularios, estados vacíos, interacción |
| Integración | Vitest + Supabase (proyecto de test o `supabase start`) | **Políticas RLS** — críticas, se prueban como código |
| E2E | **Playwright** | Flujos clave: registro, alta animal, me-interesa, cita |
| Rendimiento/A11y | Lighthouse CI | SEO ≥95, A11y ≥90 en páginas públicas |

## Cobertura mínima

- **70% global** (proyecto frontend-céntrico), 80% en `src/lib/` (lógica y esquemas).
- CI falla por debajo del umbral (`vitest --coverage` con thresholds en config).

## Qué se testea SIEMPRE

1. **RLS**: cada política nueva con test de acceso permitido Y denegado (con clave anon y usuarios de distintos roles).
2. **Esquemas Zod**: casos válidos, inválidos y límite.
3. **Handlers**: códigos de respuesta completos (2xx, 4xx de negocio, 422 validación).
4. **Estados vacíos y de error** de cada pantalla.
5. **Emails**: render de plantilla + disparo (Resend mockeado — nunca emails reales en tests).

## Convenciones

- Tests junto al código: `foo.test.ts` al lado de `foo.ts`; E2E en `e2e/`.
- Nombres en español describiendo comportamiento: `it('rechaza solicitud duplicada con 409')`.
- Datos de prueba con factories (`src/test/factories.ts`), no fixtures gigantes.
- Mock de servicios externos (Resend, Nominatim) por defecto; integración real solo en tests marcados.

## E2E: cómo correrlos sin volverse loco

Los E2E necesitan el stack local (`npx supabase start`) y las variables `SUPABASE_TEST_*`. Sin ellas se saltan **en local**; en CI **fallan** a propósito (`e2e/entorno.ts`), porque un test saltado se ve igual de verde que uno que pasa y por ahí se coló BUG-006 hasta producción.

```powershell
npx supabase start
# Las claves del stack local son las de demo del CLI, no son secretos:
$raw = npx supabase status -o env
# exporta SUPABASE_TEST_URL / _ANON_KEY / _SERVICE_ROLE_KEY desde ahí
npx playwright test
```

Tres trampas que cuestan horas si no se conocen (todas descubiertas en BUG-008):

1. **Mata cualquier `npm run dev` antes.** `reuseExistingServer` está activo en local: si hay algo escuchando en el 3000, Playwright corre contra ESO y no contra el servidor que levanta el config. Durante BUG-008 invalidó una medición entera y llevó a descartar la hipótesis correcta.
2. **Los fixtures no usan `upsert(..., { onConflict: "slug" })`.** No es idempotente aquí: el trigger de de-duplicación de slugs (IMPROVEMENT-001) reescribe el slug *antes* de que Postgres evalúe el conflicto, así que cada ejecución inserta una fila nueva. Usa `sembrarPorSlug` de `e2e/fixtures.ts` (o `upsertShelterFixture` en los tests de RLS).
3. **Nada de captcha en los E2E.** `playwright.config.ts` vacía `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: el botón de registro está deshabilitado hasta que Turnstile entrega un token, y Turnstile se descarga del CDN de Cloudflare. Con varios workers, el widget tardaba y los clics agotaban el timeout. Nuestros flujos no deben depender de una red externa.

## Comandos

```powershell
npm run test                  # suite completa
npm run test -- --coverage    # con cobertura (CI)
npm run test -- --watch       # desarrollo
npx playwright test           # E2E (ver arriba)
```

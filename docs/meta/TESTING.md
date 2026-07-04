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

## Comandos

```powershell
npm run test                  # suite completa
npm run test -- --coverage    # con cobertura (CI)
npm run test -- --watch       # desarrollo
npx playwright test           # E2E
```

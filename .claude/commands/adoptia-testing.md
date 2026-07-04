---
description: Patrones de testing de Adoptia — TDD con Vitest, Testing Library, tests de RLS, Playwright
---

# Skill: Testing Adoptia

Estrategia completa: `docs/meta/TESTING.md`. **TDD obligatorio**: test rojo → implementación → refactor.

## Herramientas y dónde va cada test

| Qué pruebas | Con qué | Dónde |
|-------------|---------|-------|
| Esquemas Zod, utils, lógica | Vitest | `foo.test.ts` junto a `foo.ts` |
| Componentes (forms, estados vacíos) | Testing Library + Vitest | junto al componente |
| Handlers de API | Vitest (Request/Response nativos) | junto al handler |
| **Políticas RLS** | Vitest + clientes Supabase con distintos usuarios | `src/test/rls/` |
| Flujos E2E | Playwright | `e2e/` |

## Patrón de test de RLS (el más importante del proyecto)

```ts
// src/test/rls/animals.test.ts — contra supabase local (supabase start) o proyecto de test
it("anon NO lee animales en borrador", async () => {
  const anon = createClient(URL, ANON_KEY);
  const { data } = await anon.from("animals").select().eq("id", borradorId);
  expect(data).toHaveLength(0); // RLS filtra, no da error
});

it("protectora A no edita animales de protectora B", async () => {
  const clientA = await signInAs("protectora-a@test.com");
  const { error, data } = await clientA.from("animals")
    .update({ name: "hack" }).eq("id", animalDeB).select();
  expect(data).toHaveLength(0); // update silenciosamente no afecta filas
});
```

Regla: cada política → mínimo un caso permitido y uno denegado. OJO: RLS no da error en select/update — devuelve vacío/0 filas; asértalo así.

## Patrón de test de handler

```ts
it("devuelve 409 si ya existe solicitud del usuario para ese animal", async () => {
  const res = await POST(makeRequest({ animal_id, questionnaire: valido() }, { as: adoptante }));
  expect(res.status).toBe(409);
  expect((await res.json()).error.code).toBe("duplicate_request");
});
```

Cubre SIEMPRE: 401 sin sesión, 403 rol/propiedad, 422 inválido, 409/4xx de negocio, camino feliz.

## Mocks

- **Resend**: mock global en `src/test/setup.ts` — jamás emails reales.
- **Nominatim**: mock con respuestas fijas (Bilbao, "no encontrado").
- **Geolocalización navegador**: mock de `navigator.geolocation` en tests de componentes.
- Factories en `src/test/factories.ts` (`makeShelter()`, `makeAnimal({ status: "reserved" })`).

## Cobertura y comandos

- Umbral: 70% global, 80% `src/lib/` (thresholds en `vitest.config.ts` — CI falla debajo).

```powershell
npm run test -- --coverage    # lo que corre CI
npm run test -- --watch       # TDD
npx playwright test           # E2E (levanta next dev automáticamente)
```

## Nombres

En español, describiendo comportamiento observable: `it('cierra las solicitudes pendientes al marcar el animal adoptado')` — no `it('works')`.

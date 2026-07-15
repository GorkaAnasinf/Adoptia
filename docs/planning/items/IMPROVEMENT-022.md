---
id: IMPROVEMENT-022
tipo: improvement
titulo: Ejecutar los E2E de Playwright en CI, aprovechando el stack que ya levanta el job de RLS
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-15
actualizado: 2026-07-15
---

# IMPROVEMENT-022 — Ejecutar los E2E de Playwright en CI

## Descripción

Los E2E de `e2e/` tampoco corren en CI: como los tests de RLS antes de BUG-007, se saltan solos si no hay stack (`test.skip(!URL || !SERVICE_KEY, …)`). Nadie comprueba automáticamente los flujos completos que cubren: publicar un aviso y resolverlo, reportar un avistamiento, el alta de protectora, etc.

Con **BUG-007** el job `rls` ya levanta un Supabase real en el runner, así que el coste marginal de añadirlos es pequeño.

## Contexto / impacto

Un E2E que se salta es indistinguible de uno que pasa — la misma trampa de BUG-007. Los E2E cubren justo lo que ningún test unitario ve: que las piezas encajen de verdad (sesión, RLS, RPC, UI). El E2E de FEATURE-022, al ejecutarlo por primera vez, destapó dos fallos reales del propio test que nadie habría visto de otro modo.

## Plan de desarrollo

### CI

- Job `e2e` hermano del `rls` (Playwright arranca su propio `next dev`, así que no cabe dentro de aquel): `playwright install --with-deps chromium` + stack local + variables + `npx playwright test`, con subida del informe si falla.
- El `next dev` necesita apuntar al stack local (en local eso sale de `.env.local`, que en CI no existe). SMTP se deja fuera **a propósito**: el envío de email es best-effort y ningún flujo debe depender de que salga el correo.

### Tests

- **Módulo compartido `e2e/entorno.ts`** con el mismo criterio anti-skip de BUG-007: con `CI=true` y sin variables, lanza. Sustituye el `test.skip(!URL || !SERVICE_KEY, …)` duplicado en 6 specs.

### Dependencias

- BUG-007 (`hecho`), IMPROVEMENT-023 (`hecho` — el job lee la versión de `.nvmrc`).

## Criterios de aceptación / Casuística a cubrir

- [x] Existe un job `e2e` con stack local, navegador y el entorno que necesita el dev server.
- [x] El skip deja de ser silencioso: `e2e/entorno.ts` aborta con `CI=true` y sin variables, en vez de saltarse los tests en verde.
- [x] Los 6 specs que duplicaban el patrón de skip usan el módulo compartido; no queda ningún `process.env.SUPABASE_TEST_*` suelto en `e2e/`.
- [x] En local, sin Docker, los E2E se siguen saltando como hasta ahora.
- [ ] ~~El job corre en cada push~~ → **movido a BUG-008**: la suite no está sana todavía (ver Cierre).

## Cierre (2026-07-15)

**Entregado**: el job `e2e` (escrito y funcional), el módulo `e2e/entorno.ts` con el guard anti-skip, la migración de los 6 specs y el rate limit del Auth local corregido.

**El hallazgo que cambió el item**: al ejecutar la suite entera por primera vez —que es justo lo que este item perseguía— salieron **14 fallos de 26**. No está rota la aplicación: están podridos los tests. `perdidos.spec.ts` pasaba en verde de forma aislada esa misma mañana y falla dentro de la suite completa; el problema es de convivencia. Diagnosticado y corregido de paso el rate limit del Auth local (`sign_in_sign_ups = 30` por 5 min: la suite en paralelo se lo comía en segundos), que se llevó los fallos de 22 a 14. El resto —datos que se pisan entre los proyectos `chromium` y `mobile`, redirecciones de login, timeouts del dev server— necesita trabajo spec a spec: **BUG-008**.

**Por qué el job queda tras `if: github.event_name == 'workflow_dispatch'`**: activarlo en cada push dejaría CI en rojo crónico, y un CI rojo crónico se acaba ignorando — peor que el silencio actual. Se puede lanzar a mano desde ya. Cuando BUG-008 deje la suite verde, **quitar ese `if` es el único cambio necesario**.

**Decisión consciente**: se prefirió trocear antes que arrastrar el item hasta sanear 7 specs con varias causas distintas. El valor de este item (hacer visible lo invisible) ya está entregado: hoy sabemos que la suite E2E no funciona, y ayer no.

---
id: IMPROVEMENT-022
tipo: improvement
titulo: Ejecutar los E2E de Playwright en CI, aprovechando el stack que ya levanta el job de RLS
estado: recibido
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

_Pendiente de planificar (Snoopy)._

Notas de partida:

1. Reusar el job `rls` (ya tiene stack y variables) o crear uno `e2e` hermano: `npx playwright install --with-deps chromium` + `npx playwright test`. Sopesar el tiempo: Playwright arranca `next dev`, así que no es gratis.
2. Aplicar el mismo criterio de BUG-007: **el skip no puede ser silencioso en CI** — si faltan las variables con `CI=true`, fallar.
3. El proyecto `mobile` (Pixel 7) tiene un caso saltado a propósito (arrastre táctil de Leaflet, ver FEATURE-022): que siga saltándose, pero que sea un skip declarado en el test, no un salto por entorno.
4. Decidir si van en cada push o solo en `main`/nocturno, según lo que tarden.

## Criterios de aceptación / Casuística a cubrir

- [ ] Pendiente de planificar.

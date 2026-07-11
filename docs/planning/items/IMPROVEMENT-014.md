---
id: IMPROVEMENT-014
tipo: improvement
titulo: Tests RLS ocasionalmente flaky por concurrencia entre ficheros
estado: recibido
prioridad: baja
hito: null
duplicado_de: null
creado: 2026-07-11
actualizado: 2026-07-11
---

# IMPROVEMENT-014 — Tests RLS ocasionalmente flaky por concurrencia

## Descripción

Los ficheros de `src/test/rls/` corren en paralelo contra la misma BD local. Cada
suite usa fixtures con prefijos propios, pero algunas aserciones son sensibles a
datos creados por otras suites en paralelo. Detectado durante el QA de
FEATURE-016: `animal-search.test.ts > expone total_count para paginar` falló una
vez (0 filas en vez de 1) y pasó en el rerun y en aislamiento.

## Contexto / impacto

Un flaky ocasional erosiona la confianza en la suite y provoca reruns en CI.
No es un bug de producto: es aislamiento de test-infra.

## Propuesta

- Revisar las aserciones de `animal-search` y `shelters-nearby` para que filtren
  siempre por sus propios fixtures (slug/prefijo) en vez de asumir el conjunto.
- Alternativa contundente: ejecutar los ficheros RLS en serie (p. ej.
  `fileParallelism: false` en un proyecto de vitest separado para `src/test/rls`).

## Criterios de aceptación

- [ ] 5 ejecuciones consecutivas de la suite completa sin ningún fallo RLS.

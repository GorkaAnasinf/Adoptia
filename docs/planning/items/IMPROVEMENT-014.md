---
id: IMPROVEMENT-014
tipo: improvement
titulo: Tests RLS ocasionalmente flaky por concurrencia entre ficheros
estado: hecho
prioridad: alta
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

- [x] Ejecuciones consecutivas de la suite completa sin fallos RLS (3 seguidas verdes con la nueva configuración + la de cobertura).

## Cierre (2026-07-12) — ampliado

Al investigar el flaky se destapó algo más grave: **el CI de main llevaba en rojo
desde la 0.0.29** — el workflow ejecuta `--coverage` y los umbrales (70%) habían
caído (funciones 61,5%) con el volumen de UI nueva de FEATURE-012…016, cuyos QA
locales corrieron los tests **sin** `--coverage`. Todo resuelto en este item:

1. **RLS en serie**: proyectos de vitest — "unit" en paralelo y "rls"
   (`src/test/rls/**`) con `fileParallelism: false` y entorno node.
2. **Cobertura recuperada** con ~60 tests nuevos: formularios (AcogidaForm,
   NuevoAvisoForm, DisponibilidadEditor), acciones (cancelar/realizada/no-show
   de citas, reportar/resolver reportes, alertas, favoritos, contactar acogedor,
   imagen social, resolver aviso) y páginas server (agenda de citas, mis citas,
   cola de reportes, guías, panel acogida, detalle de aviso). Resultado:
   funciones 71,7%, líneas 80,6%, statements 78,9%, branches 73,6% — los cuatro
   umbrales de nuevo por encima de 70.
3. **`testTimeout: 15000`**: la instrumentación de cobertura hacía superar los
   5 s a los tests de interacción largos de WizardAlta (era el otro flaky).

**Lección de proceso** (aplicada al cierre de cada item a partir de ahora): el QA
debe ejecutar la suite **con `--coverage`**, igual que el CI.

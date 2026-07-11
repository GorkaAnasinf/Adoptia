---
id: IMPROVEMENT-012
tipo: improvement
titulo: Recuperar el umbral de cobertura de funciones (deuda de tests)
estado: hecho
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-10
actualizado: 2026-07-11
---

# IMPROVEMENT-012 — Recuperar el umbral de cobertura de funciones

## Descripción

La suite fallaba el umbral global de cobertura de **funciones** (70%) desde antes de
FEATURE-005 (63.65% en `develop`; CI rojo en los últimos merges). El 2026-07-10 se aplicó
un apaño consciente para recuperar el CI verde: exclusión de los componentes Leaflet
(no ejecutables en jsdom, mismo criterio que shadcn) y **umbral de funciones bajado
temporalmente a 66** en `vitest.config.ts` (real actual: 68.2%). Este item consiste en
**devolver el umbral a 70** cubriendo los huecos reales.

## Contexto / impacto

Con el umbral bajado, una regresión de cobertura entre 66 y 70 pasaría desapercibida.
Focos principales sin tests: `ShelterMediaUploader` (~14%), `AnimalMediaUploader`, y varias
páginas de paneles `(shelter)`/`(admin)`/`(adopter)` a 0%.

Pendiente asociado de FEATURE-005: **medir LCP móvil (<2.5 s) del listado en producción**
(criterio no verificable en local; hacerlo tras el deploy con Lighthouse/Vercel Analytics).

Pendiente asociado de FEATURE-008 (2026-07-10): Lighthouse móvil local sobre build de
producción dio home SEO 100/A11y 100/Perf 84, listado SEO 100/A11y 98/Perf 87 y ficha
SEO 100/A11y 100/**Perf 73** (LCP 5,1 s). La imagen de portada ya lleva `priority`; el LCP
local está inflado por la primera optimización de `next/image` contra Unsplash en frío.
**Repetir la medición de la ficha en producción** y, si sigue <80, optimizar (preconnect,
`sizes` más ajustados o reducir TBT de 360 ms).

## Cierre (2026-07-11)

**Cobertura**: umbral de funciones devuelto a **70** en `vitest.config.ts` (real: 70,61%).
Tests nuevos: `ShelterMediaUploader` (subida, error de Storage, rollback sin media huérfana,
borrado, filtro de no-imágenes), `adopter-contact` y `RetirarSolicitudButton`.

**Lighthouse móvil en producción** (adoptia-eight.vercel.app, 2026-07-11):
home SEO 100 / A11y 100 / Perf 96 (LCP 2,6 s); listado SEO 100 / A11y 100 / Perf 94
(LCP 2,9 s). El objetivo de LCP <2,5 s queda rozado con el listado aún sin datos reales;
la **ficha no es medible en producción** hasta que haya animales publicados de protectoras
verificadas. Re-medir ficha y LCP del listado cuando haya contenido real (nota en BACKLOG).

---
id: IMPROVEMENT-012
tipo: improvement
titulo: Recuperar el umbral de cobertura de funciones (deuda de tests)
estado: recibido
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-10
actualizado: 2026-07-10
---

# IMPROVEMENT-012 — Recuperar el umbral de cobertura de funciones

## Descripción

La suite falla el umbral global de cobertura de **funciones** (70%) desde antes de
FEATURE-005: en `develop` está en 63.65% (la rama de FEATURE-005 la sube a ~65.5%, pero
sigue por debajo). Hay que recuperar el verde de `npm run test -- --coverage` cubriendo los
huecos grandes o ajustando conscientemente la configuración.

## Contexto / impacto

CI ejecuta la cobertura con umbrales; mientras falle, cualquier rama hereda un check rojo
que enmascara regresiones reales. Focos principales sin tests: `MapPinPicker`/`MapPinPickerInner`
(Leaflet, 0%), `ShelterMediaUploader` (~14%), `AnimalMediaUploader`, y varias páginas de
paneles `(shelter)`/`(admin)`/`(adopter)` a 0%.

Pendiente asociado de FEATURE-005: **medir LCP móvil (<2.5 s) del listado en producción**
(criterio no verificable en local; hacerlo tras el deploy con Lighthouse/Vercel Analytics).

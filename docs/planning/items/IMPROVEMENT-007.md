---
id: IMPROVEMENT-007
tipo: improvement
titulo: Pulido del wizard de alta — autocompletado de direcciones y layout
estado: hecho
prioridad: media
hito: "0.2"
duplicado_de: null
creado: 2026-07-08
actualizado: 2026-07-08
---

# IMPROVEMENT-007 — Pulido del wizard de alta

## Descripción

Mejoras de UX en el asistente de alta de protectora (`/panel/alta`), a partir
de feedback con pantallazo:

- La barra de acciones (Atrás/Siguiente + "Guardado automático") era `fixed` y
  se solapaba con el mapa y con el pie de la app (términos/privacidad).
- El botón "Localizar en el mapa" ocupaba mucho y **no funcionaba** (Nominatim
  con la dirección completa y `limit=1` no encontraba calles reales).
- Los números del stepper no navegaban a su paso.

## Solución

- **Autocompletado de direcciones** con Photon (OSM) vía route handler propio
  con caché: al elegir una sugerencia se rellenan dirección, ciudad, provincia
  y CP y se coloca el pin. El pin sigue arrastrable. Sustituye al botón manual.
- Barra de acciones `sticky` dentro del flujo (deja de tapar mapa y footer).
- Stepper con números clicables (navega a pasos ya visitados).
- Pulido visual del paso de ubicación.

## Criterios de aceptación

- [x] La barra de acciones no tapa el mapa ni el pie de la app (sticky en el flujo).
- [x] Escribir una calle real ofrece sugerencias y al elegir rellena los campos + pin (Photon/OSM).
- [x] Pulsar un número del stepper lleva a ese paso (si ya se visitó).
- [x] El wizard sigue guardando borrador, enviando a revisión y en modo edición (tests intactos).

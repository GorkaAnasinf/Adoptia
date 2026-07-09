---
id: IMPROVEMENT-010
tipo: improvement
titulo: Wizard de alta — autorrelleno de provincia y nombres OSM
estado: hecho
prioridad: media
hito: "0.2"
duplicado_de: null
creado: 2026-07-09
actualizado: 2026-07-09
---

# IMPROVEMENT-010 — Autorrelleno de provincia y nombres OSM

Cuarta iteración sobre el paso de ubicación, con feedback de uso:

## Bugs

- **Provincia se rellenaba con la comarca** (p. ej. "Iruñerria" en vez de
  "Navarra"): Photon devuelve la comarca en `county`. Al elegir una dirección se
  pisaba la provincia elegida con ese valor, que además no está en la lista, así
  que el `datalist` se quedaba "sin provincias".
- **Nombres bilingües de OSM** ("Valle de Egüés / Eguesibar") entraban tal cual
  y luego no se encontraban al buscarlos.

## Solución

- Al elegir ciudad/dirección **no se pisa** la provincia (ni la ciudad) que el
  usuario ya eligió; la provincia sugerida solo se acepta si coincide con una de
  las 52 (`matchProvincia`).
- Los nombres bilingües se normalizan a la primera forma antes de la sugerencia.
- "Localizar en el mapa" y la ayuda de arrastrar el pin van en la misma fila.

## Criterios de aceptación

- [x] Elegir una dirección no cambia la provincia elegida por una comarca.
- [x] El combo de provincia sigue mostrando la lista tras autocompletar.
- [x] Los municipios bilingües se muestran limpios.
- [x] "Localizar en el mapa" y la ayuda del pin comparten fila.

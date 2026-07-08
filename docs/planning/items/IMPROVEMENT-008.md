---
id: IMPROVEMENT-008
tipo: improvement
titulo: Paso de ubicación del wizard — combos, orden top-down y fixes
estado: hecho
prioridad: media
hito: "0.2"
duplicado_de: null
creado: 2026-07-08
actualizado: 2026-07-08
---

# IMPROVEMENT-008 — Paso de ubicación del wizard

Segunda iteración sobre el paso de ubicación (tras IMPROVEMENT-007), con
feedback de uso:

## Bugs

- **El pin no persiste**: `location` se guarda pero no se recupera al recargar
  (Supabase devuelve la geografía como EWKB hex y el mapeo no lo decodificaba),
  así que el mapa volvía al centro de España.
- **El mapa se pinta por encima** de su tarjeta y de la barra Atrás/Siguiente
  (los z-index internos de Leaflet escapaban del contenedor).
- **El stepper no navega**: en modo edición no dejaba saltar a pasos ya válidos.

## Mejoras

- **Orden top-down**: Provincia → Ciudad → Código postal → Dirección, para
  acotar la búsqueda progresivamente.
- **Provincia y Ciudad como combos escribibles** (provincia = lista fija de las
  50; ciudad = sugerencias de municipios de OSM filtradas por provincia).
- **"Localizar en el mapa"** de vuelta: geocodifica los campos y coloca el pin.
- La dirección sugiere con el contexto de provincia/ciudad para acertar más.

## Criterios de aceptación

- [x] El pin guardado se muestra al reabrir el alta (decodifica EWKB de PostGIS).
- [x] El mapa no se solapa con la tarjeta ni con la barra de acciones (`isolate`).
- [x] Se puede navegar por el stepper (en edición, a cualquier paso).
- [x] Provincia y ciudad se eligen con combo escribible; orden top-down.
- [x] "Localizar en el mapa" coloca el pin a partir de los campos.

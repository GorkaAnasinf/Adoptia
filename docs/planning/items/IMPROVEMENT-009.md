---
id: IMPROVEMENT-009
tipo: improvement
titulo: Wizard de alta — fix autocompletado y pulido de ubicación/perfil
estado: hecho
prioridad: media
hito: "0.2"
duplicado_de: null
creado: 2026-07-09
actualizado: 2026-07-09
---

# IMPROVEMENT-009 — Pulido de ubicación y perfil del wizard

Tercera iteración sobre el wizard de alta, con feedback de uso:

## Bug

- **Ciudad y dirección no cargaban sugerencias**: Photon no soporta `lang=es`
  (solo default/de/en/fr) y devolvía un error sin `features`. Se elimina el
  parámetro y el autocompletado vuelve a funcionar (la provincia ya iba, es
  lista fija).

## Mejoras

- **Paso de ubicación**: los campos se disponen en una rejilla de dos columnas
  (provincia/ciudad, código postal/dirección) en lugar de una sola columna.
- **Paso de perfil**: el editor de horarios pasa de siete tarjetas grandes a
  una tabla compacta (una fila por día, con "Cerrado" y chips de franja),
  reduciendo mucho el alto. Las casillas de voluntariado/acogida se muestran en
  dos columnas con estilo de tarjeta seleccionable.

## Criterios de aceptación

- [x] Ciudad y dirección ofrecen sugerencias reales al escribir.
- [x] Los campos de ubicación se ven de dos en dos.
- [x] El editor de horarios ocupa mucho menos espacio y sigue siendo usable.

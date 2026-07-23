---
id: FEATURE-060
tipo: feature
titulo: Badge «Urgente» en fichas y listado de animales
estado: recibido
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-23
actualizado: 2026-07-23
---

# FEATURE-060 — Badge «Urgente» en fichas y listado

## Descripción

Permitir que la protectora marque un animal como **urgente** (perrera con fecha
límite, caso médico, refugio saturado…) y que ese estado se muestre como un chip
«Urgente» en la tarjeta del listado y en la ficha, además de poder priorizarlo en
el orden de resultados.

Requiere **campo nuevo en BD**: p. ej. `animals.urgent boolean` (o una prioridad
más rica). Implica migración, exponerlo en `animals_search` (filtro/orden), en el
formulario de alta/edición de animal y en `AnimalCard`.

## Contexto / impacto

Detectado como candidato al revisar el mockup de IMPROVEMENT-019. Da a las
protectoras una herramienta para dar visibilidad a los casos que de verdad
corren, y al adoptante una señal clara. Debe usarse con moderación para no
saturar de «urgentes» el listado (posible límite o caducidad del flag).

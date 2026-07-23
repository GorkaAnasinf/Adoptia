---
id: FEATURE-060
tipo: feature
titulo: Badge «Urgente» en fichas y listado de animales
estado: hecho
prioridad: media
hito: "0.5"
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

## Plan de desarrollo (decisión del usuario 2026-07-23)

Orden: **los urgentes salen primero solo en el orden por defecto (recientes)**;
en orden por distancia manda la distancia.

### Modelo de datos

- Migración `feature060_urgent`: `animals.urgent boolean not null default false`.
  Suelta y recrea `animals_search` para devolver `urgent`, aceptar `p_urgent`
  (filtro) y ordenar `urgent desc` **antes** de `published_at` solo cuando el
  orden es 'recent'.

### Frontend

- Schema `animal.ts`: `urgent` en `animalDraftSchema` + `animalToRow`.
- `AnimalForm`: toggle «Marcar como urgente» (+ ayuda de uso responsable).
- `AnimalCard`: badge «Urgente» (tiene prioridad sobre «Nuevo»).
- `animal-search.ts`: `urgente` en el modelo (parse `urgente=si`, conteo, args
  `p_urgent`, URL) + toggle «Solo urgentes» en `AnimalSearchFilters`.
- Página de edición: cargar/guardar `urgent`.
- i18n `busqueda.urgente`, `busqueda.filtroUrgentes`, `animales.fUrgent` + ayuda.

### Sin caducidad automática

MVP: flag manual que la protectora activa/desactiva. La caducidad/límite del plan
queda como posible mejora futura (no en este item).

### Tests

- `animal-search.test.ts` (urgente parse/count/args/url), `animal.test.ts`
  (`animalToRow.urgent`). RPC de orden verificado por RLS/integración local.

## Criterios de aceptación

- La protectora marca urgente en la ficha; sale badge y filtro «Solo urgentes».
- En orden recientes los urgentes van primero. Suite y lint verdes; textos en es.json.

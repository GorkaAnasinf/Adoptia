---
id: IMPROVEMENT-031
tipo: improvement
titulo: Filtro «Apto para piso» en la búsqueda de animales
estado: hecho
prioridad: baja
hito: "0.5"
duplicado_de: null
creado: 2026-07-23
actualizado: 2026-07-23
---

# IMPROVEMENT-031 — Filtro «Apto para piso» en la búsqueda

## Descripción

Exponer el campo existente `animals.apartment_suitable` como filtro en la
búsqueda pública: añadir `p_apartment_suitable` al RPC `animals_search` y un
toggle «Apto para piso» en la UI de filtros del listado, junto a los ya
existentes (bueno con niños/perros/gatos).

## Contexto / impacto

El dato ya está en BD (columna `apartment_suitable`) pero no se puede filtrar por
él. Es una de las decisiones de compra más frecuentes de quien vive en piso.
Cambio pequeño y de alto valor: mockup en IMPROVEMENT-019. Sigue el mismo patrón
que los filtros booleanos actuales del RPC, así que el riesgo es bajo.

## Plan de desarrollo (hecho 2026-07-23)

### Modelo de datos

- Sin columna nueva. Migración `20260723140000_improvement031_apartment_suitable.sql`:
  se **suelta y recrea** `animals_search` (la firma cambia) añadiendo el parámetro
  `p_apartment_suitable boolean default null` y el filtro
  `(p_apartment_suitable is null or a.apartment_suitable = p_apartment_suitable)`.
  Security invoker, EXECUTE a PUBLIC (como estaba). Resto idéntico.

### Frontend

- `src/lib/animal-search.ts`: campo `piso` en `AnimalSearch`, `parseAnimalSearch`
  (flag `piso=si`), `contarFiltrosActivos`, `AnimalsSearchRpcArgs.p_apartment_suitable`,
  `searchToRpcArgs` y `buildQueryString`.
- `AnimalSearchFilters.tsx`: checkbox «Apto para piso» junto a los de compatibilidad.
- i18n `busqueda.compatPiso` = «Apto para piso».

### Tests

- `animal-search.test.ts`: parse, conteo, mapeo a `p_apartment_suitable` y URL.
- Ajustados dos literales de `AnimalSearch` en tests existentes (campo nuevo).

## Criterios de aceptación

- El filtro «Apto para piso» aparece en el listado y filtra por
  `apartment_suitable`; entra en el conteo de filtros y en la URL compartible.
- Suite y lint verdes; textos en `es.json`.

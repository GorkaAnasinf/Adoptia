---
id: IMPROVEMENT-031
tipo: improvement
titulo: Filtro «Apto para piso» en la búsqueda de animales
estado: recibido
prioridad: baja
hito: null
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

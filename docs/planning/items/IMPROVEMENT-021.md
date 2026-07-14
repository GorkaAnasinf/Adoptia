---
id: IMPROVEMENT-021
tipo: improvement
titulo: Búsqueda por texto/raza en el listado de animales
estado: recibido
prioridad: baja
hito: null
duplicado_de: null
creado: 2026-07-14
actualizado: 2026-07-14
---

# IMPROVEMENT-021 — Búsqueda por texto/raza en el listado de animales

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

El buscador de la cabecera pública (añadido en FEATURE-021) muestra el
placeholder «Buscar raza…», pero hoy es solo un **enlace** a `/animales`: el
RPC `animals_search` filtra por especie, tamaño, sexo, edad y ubicación, pero
**no admite búsqueda por texto libre** (nombre, raza…). Se quiere que el
buscador acepte texto y filtre de verdad.

## Contexto / impacto

- Detectado al implementar FEATURE-021 fase 2: el mockup pedía un buscador de
  texto, pero no existe el parámetro en el backend, así que se dejó como
  enlace para no improvisar arquitectura.
- **A quién afecta:** adoptantes que buscan una raza o nombre concreto.
- Requiere: nuevo parámetro de texto en `animals_search` (RPC/PostGIS), decidir
  si se busca por `name`, `breed` y/o `description` (posible `ilike`/full-text
  o `pg_trgm`), y convertir el enlace del buscador en un input real que navegue
  con el query param. Ojo al coste (free tier) e índices.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_Pendiente de Snoopy._

## Criterios de aceptación / Casuística a cubrir

- [ ] El buscador acepta texto y devuelve animales cuyo nombre/raza coincide.
- [ ] Texto vacío → comportamiento actual (sin filtro de texto).
- [ ] El término se refleja en la URL (compartible) y se combina con los
      filtros existentes.
- [ ] Rendimiento aceptable en free tier (índice adecuado).

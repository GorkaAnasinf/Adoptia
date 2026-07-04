---
id: FEATURE-006
tipo: feature
titulo: Mapa de protectoras con búsqueda por proximidad
estado: listo
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
---

# FEATURE-006 — Mapa de protectoras con búsqueda por proximidad

## Descripción

Mapa interactivo a pantalla completa con todas las protectoras verificadas (marcadores con clustering). El usuario comparte su ubicación o busca por ciudad/CP y ve la lista ordenada por cercanía, con distancia, nº de animales y acceso a cada protectora. (Ref: U2)

## Contexto / impacto

Funcionalidad diferencial de la plataforma ("qué hay cerca de mí"). Primera pantalla que se enseñará en la demo.

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (query PostGIS), prompts Stitch §1.2, skill `adoptia-frontend` (patrón Leaflet+Next)

### Seguridad

- Solo shelters `verified` en el mapa (RLS). Búsqueda por ciudad usa geocoding en servidor con caché (no abusar de Nominatim).
- La ubicación del usuario NUNCA se persiste — solo se usa en la sesión.

### Modelo de datos

- Sin cambios. RPC `shelters_nearby(lat, lng, radius_m)` en Postgres para la consulta PostGIS.

### API

- `GET /api/geocode?q=ciudad` (proxy Nominatim con caché y rate limit).

### Frontend

- Leaflet con `react-leaflet` (dynamic import, sin SSR) + `leaflet.markercluster`.
- Layout Stitch 1.2: mapa + lista lateral (desktop) / bottom sheet (móvil); chips de filtro (perros, gatos, acogida, voluntariado); popup con tarjeta y "Ver protectora".
- Sincronización mapa↔lista (hover/selección).

### Tareas TDD

1. Test RPC `shelters_nearby` con seed (dentro/fuera de radio, orden).
2. Test: shelter `pending` no aparece en respuesta.
3. Test geocode con caché (segunda llamada no toca Nominatim — mock).
4. Test componente: denegación de geolocalización → fallback a buscador.
5. E2E: permitir ubicación → lista ordenada → clic marcador → popup → ficha.

### Dependencias

- FEATURE-002.

## Criterios de aceptación / Casuística a cubrir

- [ ] Clustering fluido con 200+ marcadores.
- [ ] Geolocalización denegada o no disponible: búsqueda por ciudad/CP funciona igual.
- [ ] Ciudad no encontrada: mensaje claro con sugerencia.
- [ ] Filtros de chips aplican a mapa Y lista a la vez.
- [ ] Bottom sheet móvil deslizable; mapa usable con gestos (sin secuestrar scroll).
- [ ] Tiles de OSM con atribución correcta (requisito de licencia).
- [ ] Zona sin protectoras: estado vacío "aún no hay protectoras en tu zona" + CTA de unirse.

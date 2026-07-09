---
id: FEATURE-005
tipo: feature
titulo: Área pública — home, búsqueda de animales y fichas
estado: desarrollo
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-09
---

# FEATURE-005 — Área pública: home, búsqueda de animales y fichas

## Descripción

Cualquier visitante (sin cuenta) puede: ver la home con buscador rápido y animales recientes; buscar animales con filtros (especie, tamaño, edad, sexo, distancia, compatibilidades) y ordenación; y consultar la ficha completa de cada animal y de cada protectora. (Ref: U1, U3, U4, U5)

## Contexto / impacto

Es la cara de la plataforma y la fuente de tráfico orgánico (SEO). Las fichas indexadas en Google son el canal de captación principal.

## Plan de desarrollo

### Documentación a consultar

- Prompts Stitch §1.1, 1.3, 1.4 y ficha protectora, [DESIGN](../../technical/DESIGN.md), [DATA_MODEL](../../technical/DATA_MODEL.md), skill `adoptia-frontend`

### Seguridad

- Todo lectura pública vía RLS (solo publicado+verificado). Sin datos personales expuestos.

### Modelo de datos

- Sin cambios. Query de proximidad de DATA_MODEL para orden por distancia.

### API

- Sin handlers: Server Components consultan Supabase directamente.

### Frontend

- Home (Stitch 1.1): hero + buscador (especie+ubicación), fila de recientes, "cómo funciona", contadores, CTA protectoras, footer legal.
- Listado (Stitch 1.3): grid 2/4 columnas, chips de filtro, slider distancia, orden cercanos/recientes, paginación, estado vacío con CTA de alerta (deshabilitado hasta FEATURE-010).
- Ficha animal (Stitch 1.4): galería, chips compatibilidad, salud, historia, tarjeta protectora con mini-mapa, barra sticky "Me interesa" + compartir WhatsApp.
- Ficha protectora: info, instalaciones, mapa, sus animales, cómo colaborar.
- SSR/ISR con revalidación; `generateMetadata` por ficha.

### Tareas TDD

1. [x] Test query de listado con filtros combinados (unit sobre builder). *(ciclo 1)*
2. [x] Test orden por distancia con seed geolocalizado. *(ciclo 1 — `src/test/rls/animal-search.test.ts`)*
3. [x] Test: animal reservado muestra badge y sin botón "Me interesa". *(ciclo 1 tarjeta + ciclo 2 ficha)*
4. [x] Test estados vacíos (sin resultados) *(ciclo 1; protectora sin animales ya cubierto en FEATURE-004)*
5. [ ] E2E: home → filtrar → ficha → volver conservando filtros. *(ciclo 3)*

### Registro de ciclos

- **Ciclo 1 (2026-07-09)** — Listado público `/animales`: builder `src/lib/animal-search.ts`
  (parse URL → args RPC, edad por buckets, query string compartible), RPC `animals_search`
  (migración `20260709120000`, security invoker → RLS aplica, distancia PostGIS, total_count),
  componentes `AnimalCard`/`AnimalSearchFilters`/`AnimalSearchEmpty` y página con filtros
  combinables en URL, paginación y aviso de ubicación. 337 tests en verde.
- **Ciclo 2 (2026-07-09)** — Ficha pública `/animales/[slug]`: `AnimalPublicProfile` (galería
  accesible con miniaturas, chips de rasgos, convivencia tri-estado, salud, historia, tarjeta
  de protectora con `MiniMapa` Leaflet sin SSR, barra sticky móvil), `InterestButton` (pide
  login al pulsar; con sesión aviso "próximamente" hasta FEATURE-007), compartir WhatsApp,
  página amable con sugerencias para despublicados (noindex) y `generateMetadata`. 349 tests.
- **Nota:** los umbrales de cobertura (70% funcs/stmts) ya fallaban en `develop` antes de este
  ciclo (63.65% funcs); la rama los mejora pero no los alcanza — pendiente item de deuda.

### Dependencias

- FEATURE-003 (contenido), FEATURE-002 (protectoras verificadas).

## Criterios de aceptación / Casuística a cubrir

- [ ] Navegación completa sin cuenta; "Me interesa" pide login solo al pulsarlo.
- [ ] Filtros combinables y reflejados en URL (compartible, back correcto).
- [ ] Sin ubicación concedida: orden por recientes y aviso no intrusivo.
- [ ] Distancia mostrada solo si hay ubicación del usuario.
- [ ] Animal despublicado/adoptado: su URL devuelve página amable con sugerencias, no 404 seco.
- [ ] LCP <2.5 s móvil en listado con imágenes optimizadas (`next/image`).
- [ ] Accesibilidad AA: fotos con alt, navegación por teclado en galería y filtros.

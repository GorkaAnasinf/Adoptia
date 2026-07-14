---
id: IMPROVEMENT-021
tipo: improvement
titulo: Búsqueda por texto/raza en el listado de animales
estado: hecho
prioridad: baja
hito: "0.5"
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

### Hallazgos de arquitectura (contexto real)

- RPC actual: [`animals_search`](../../../supabase/migrations/20260709120000_feature005_animals_search.sql)
  — `language sql`, `stable`, **SECURITY INVOKER** (la RLS de `animals`/`shelters`
  aplica dentro; anon solo ve publicados de protectoras verificadas).
- Columnas útiles en `animals` (baseline `20260705090000`): **`name text`** y
  **`breed text`** (raza). Ambas sirven para el texto. `description` se deja
  fuera (ruido, y no aporta a "buscar raza/nombre").
- Extensiones instaladas: `postgis`, `btree_gist`. **No** hay `pg_trgm`. Para el
  volumen del free tier basta `ilike '%q%'`; un índice trigram sería sobre-
  ingeniería ahora (se anota como follow-up si el dataset crece).
- La búsqueda pública vive en [`animal-search.ts`](../../../src/lib/animal-search.ts)
  (`parseAnimalSearch`, `buildQueryString`, `searchToRpcArgs`,
  `AnimalsSearchRpcArgs`) y la UI de filtros en
  [`AnimalSearchFilters.tsx`](../../../src/components/animals/AnimalSearchFilters.tsx)
  (form con estado `borrador` que aplica navegando con query string).
- El buscador de la cabecera es hoy un enlace en
  [`PublicNav.tsx`](../../../src/components/layout/PublicNav.tsx).
- ⚠️ **Firma del RPC**: añadir `p_query` crea una firma nueva → `create or
  replace` NO basta (Postgres dejaría un overload ambiguo). La migración debe
  `drop function` de la firma antigua y volver a crear la función.

### Documentación a consultar

- Skills: `adoptia-database` (migraciones/RPC/RLS), `adoptia-security`
  (SECURITY INVOKER, inyección/escape en `ilike`), `adoptia-frontend`
  (form de filtros, buscador), `adoptia-testing` (RLS + componentes).
- `docs/technical/DATA_MODEL.md` (tabla `animals`), `API_CONTRACTS.md` (si se
  documenta la firma del RPC).

### Seguridad

- Se mantiene **SECURITY INVOKER**: la RLS sigue filtrando; el texto no abre
  filas nuevas, solo restringe.
- `p_query` es un **parámetro vinculado** (no se concatena SQL de usuario) →
  sin inyección. Los metacaracteres LIKE (`%`, `_`, `\`) del usuario se
  **escapan** antes de construir el patrón para que no actúen como comodín.
- Longitud del término **acotada** (p. ej. ≤ 60 chars) en `parseAnimalSearch`
  (cliente/servidor comparten la lib). Término vacío/espacios → `null` (sin
  filtro). No hay datos personales implicados.

### Modelo de datos

- **Nueva migración** `supabase/migrations/<ts>_improvement021_animals_search_query.sql`:
  - `drop function if exists public.animals_search(<firma actual de 14 args>);`
  - Recrea `animals_search` con un parámetro extra **`p_query text default null`**
    (al final de la lista) y una condición añadida en el `where`:
    `and (p_query is null or a.name ilike p_query or a.breed ilike p_query)`,
    donde el patrón `%…%` (con metacaracteres escapados) se pasa ya montado
    desde el cliente **o** se monta en SQL; decidir en implementación (preferible
    montar el patrón en JS y pasar `p_query` ya con `%…%` para tener el escape
    en un único sitio testeado). Resto de la función idéntica.
  - Sin índices nuevos (ilike secuencial es suficiente para el free tier).
    Anotar en la propia migración que, si crece, procede `pg_trgm` + índice GIN.

### API

- Sin endpoints nuevos. Cambia la **firma del RPC** `animals_search`
  (nuevo `p_query`). Actualizar `API_CONTRACTS.md` si documenta la firma.

### Frontend

- `animal-search.ts`:
  - `AnimalSearch` gana `q: string | undefined`.
  - `parseAnimalSearch`: lee `params.q`, hace `trim`, acota longitud, `''→undefined`.
  - `buildQueryString`: añade `q` cuando exista (URL compartible).
  - `AnimalsSearchRpcArgs` gana `p_query: string | null`; `searchToRpcArgs`
    monta el patrón `%término%` con metacaracteres escapados (o `null`).
- `AnimalSearchFilters.tsx`: nuevo campo de texto (input) ligado a `borrador.q`,
  aplicado al enviar el form (mismo patrón que el resto de filtros).
- `PublicNav.tsx`: el buscador pasa de enlace a **form real** (input + submit)
  que navega a `/animales?q=<término>`; mantener la estética pill actual y la
  variante del drawer móvil.
- Estado vacío: cuando el término no casa, se muestra el estado vacío ya
  existente del listado (verificar copy).

### Tareas TDD

1. [x] **parse**: `q` recortado, vacío→undefined, longitud acotada a 60.
2. [x] **buildQueryString**: incluye/omite `q`.
3. [x] **searchToRpcArgs**: `p_query = %término%` con `%`/`_`/`\` escapados;
   sin texto → `null` (helper `escaparLike`).
4. [x] **Migración + RPC**: `drop` de la firma vieja + recreate con `p_query`;
   tests de integración (por nombre, por raza, `null` sin filtro, borrador que
   casaría NO se expone). *Nota: los tests son `skipIf(!rlsDisponible)`; no
   se pudieron correr aquí por desincronía del entorno local (ver Entrega).*
5. [x] **AnimalSearchFilters**: campo de texto; aplica `q` a la URL y llega
   preseleccionado.
6. [x] **PublicNav**: el buscador pasa de enlace a form real → `/animales?q=…`
   (vacío → `/animales`).
7. [x] **Estado vacío**: ya cubierto por el listado (`vacioTitulo/vacioTexto`);
   agnóstico al término. Sin cambios de código.

### Dependencias

- Ninguna (FEATURE-021 ya `hecho`; se construye sobre `animals_search` de
  FEATURE-005, ya en producción).

## Criterios de aceptación / Casuística a cubrir

- [ ] El buscador acepta texto y devuelve animales cuyo **nombre o raza** casa.
- [ ] Término **vacío/solo espacios** → comportamiento actual (sin filtro).
- [ ] El término se refleja en la **URL** (compartible) y se **combina** con los
      filtros existentes (especie, tamaño, ubicación…).
- [ ] **Seguridad**: SECURITY INVOKER intacto; anon no ve borradores aunque el
      término casaría; metacaracteres LIKE escapados; longitud acotada.
- [ ] **Estado vacío** cuidado cuando no hay coincidencias.
- [ ] Rendimiento aceptable en free tier (sin índice nuevo; nota de `pg_trgm`
      para el futuro).
- [ ] Textos en `messages/es.json`; tests verdes, `lint` y `tsc` limpios.
- [ ] La migración es **idempotente/segura** (drop de firma vieja + recreate).

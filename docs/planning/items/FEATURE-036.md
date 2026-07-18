---
id: FEATURE-036
tipo: feature
titulo: Rediseño del listado de animales según wireframe Stitch (tanda, pantalla 2)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-18
actualizado: 2026-07-18
---

# FEATURE-036 — Rediseño del listado de animales (/animales)

## Descripción

Segunda pantalla de la tanda de rediseño: wireframe en `assets/wireframes/animales/`. La vista actual ya es funcionalmente idéntica al mock (mismos filtros, orden, favoritos, paginación) — el trabajo es afinado visual y coherencia con el lenguaje fijado en la home (FEATURE-034/IMPROVEMENT-027). Instrucción del usuario: **las incoherencias se resuelven al estilo de la home**, mismos detalles, A11y de serie, y añadir los detalles que se detecten en falta.

Diferencias reales wireframe ↔ actual:

- **Panel de filtros**: mock = superficie tonal (crema #f9f3eb) con inputs blancos; actual = panel blanco con ring negro. → tonal + `shadow-soft` (lenguaje de la home).
- **Título**: mock = «Peludos buscando un hogar» grande, con el **contador en línea propia** en terracota («130 resultados encontrados»); actual = «Peludos cerca de ti» con contador inline entre paréntesis.
- **Paginación**: mock añade **flechas anterior/siguiente** a los círculos; actual solo círculos + «Ver más».
- **Tarjetas**: ya coherentes (AnimalCard compartida, rediseñada en FEATURE-034). El chip «URGENTE» del mock queda **fuera** (requiere campo en BD — ya es candidato en el backlog).
- **Efectos de la tanda**: aplicar `Reveal` escalonado a las tarjetas (IMPROVEMENT-027).

## Contexto / impacto

Es la pantalla de conversión principal (donde se elige animal). La coherencia tanda-a-tanda es lo que el usuario está construyendo pantalla a pantalla.

## Plan de desarrollo

### Alcance

- **Dentro**: solo presentación — mismo RPC `animals_search`, mismos filtros y navegación.
- **Coherencia con la home (gana la home ante incoherencias del mock)**: header/footer/breadcrumbs reales (no los del mock), tarjeta compartida intacta, tokens y sombras de `globals.css`.
- **A11y (requisito de la tanda)**: labels ya existentes se conservan; flechas de paginación con `aria-label`; foco visible y `motion-safe:active:scale-95` en botones; el slider de distancia deshabilitado explica por qué (hoy solo se atenúa — detalle en falta).
- **Detalles en falta que se añaden** (aportación):
  1. En móvil, el resumen del desplegable «Filtros» muestra el **número de filtros activos** («Filtros (3)») para saber que hay filtros aplicados sin abrirlo.
  2. Texto de ayuda accesible junto al slider deshabilitado: «Activa tu ubicación para filtrar por distancia».

### Documentación a consultar

- `assets/wireframes/animales/{code.html,DESIGN.md,screen.png}`, [DESIGN](../../technical/DESIGN.md), skills `adoptia-frontend` y `adoptia-testing`. Items FEATURE-034 e IMPROVEMENT-027 (lenguaje fijado).

### Seguridad

- Sin superficie nueva. Solo presentación.

### Modelo de datos / API

- Sin cambios.

### Frontend

- `src/app/(public)/animales/page.tsx`: panel tonal (`bg-surface-container-low` + `shadow-soft`, también el `<details>` móvil), cabecera título+contador apilados, `Reveal` escalonado en tarjetas, flechas anterior/siguiente en la paginación.
- `src/components/animals/AnimalSearchFilters.tsx`: contador de filtros activos expuesto para el summary (o helper en `animal-search.ts`), ayuda del slider deshabilitado, focus/active en botones.
- `messages/es.json` (`busqueda.*`): `title` → «Peludos buscando un hogar», `resultados` → «# resultados encontrados» (plural ICU, sin paréntesis), nueva `seoTitle` para `generateMetadata` (el H1 comercial no es buen título SEO), claves nuevas de ayuda del slider y flechas.

### Tareas TDD

1. `animal-search`: helper `contarFiltrosActivos(search)` — test primero (0 sin filtros; cuenta texto/especie/tamaño/edad/sexo/compat/distancia; no cuenta página ni orden).
2. `page.test.tsx` del listado: título nuevo y contador en línea propia («N resultados encontrados»); adaptar los tests existentes que casan el formato viejo.
3. Paginación: con varias páginas aparecen flechas anterior/siguiente con `aria-label` y href correctos; en la página 1 no hay «anterior»; en la última no hay «siguiente».
4. Filtros: con filtros activos el summary móvil muestra el contador; slider deshabilitado acompaña texto de ayuda.
5. Restyle visual (panel tonal, Reveal, botones) — cambios de clase sin test, cubiertos por los tests existentes de comportamiento.
6. Revisión visual contra `screen.png` (dev + capturas desktop/móvil) y `prefers-reduced-motion`.

### Dependencias

- FEATURE-034 e IMPROVEMENT-027 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Panel de filtros tonal (`surface-container-low` + `shadow-soft`) con inputs blancos; funcionalidad intacta (tests existentes verdes).
- [x] Título «Peludos buscando un hogar» + contador en línea propia en terracota; plural 0/1/N (clave `resultados` reescrita) — test adaptado.
- [x] Metadata SEO con clave propia `seoTitle` («Animales en adopción»).
- [x] Paginación: flechas con `aria-label` y foco visible; sin «anterior» en la 1.ª ni «siguiente» en la última — 3 tests nuevos; «Ver más» conservado.
- [x] Tarjetas compartidas con `Reveal` escalonado; grid 2/4 intacto.
- [x] Summary móvil «Filtros (N)» — helper `contarFiltrosActivos` con 3 tests (página/orden/ubicación no cuentan).
- [x] Slider deshabilitado con ayuda visible y `aria-describedby` — test.
- [x] A11y: foco visible, `motion-safe:active:scale-95` en «Aplicar filtros», cursor global ya activo.
- [x] Estados vacíos intactos — tests existentes verdes.
- [x] Cero literales; 6 claves nuevas en `busqueda.*`.
- [x] QA: suite **1121/1121 con RLS**, cobertura 82,5 %, E2E área pública 4/4, lint y tsc limpios. Capturas desktop/móvil comparadas con `screen.png`.

## Cierre (2026-07-18)

- Listado alineado con el lenguaje de la tanda: panel tonal sin rings, cabecera título+contador apilados con copy del wireframe, flechas de paginación, `Reveal` en tarjetas. Tarjeta y header/footer ya venían de FEATURE-034 — cero duplicación.
- Incoherencias del mock resueltas a favor de la home según instrucción del usuario (header/footer/breadcrumbs reales); chip «URGENTE» del mock fuera de alcance (campo en BD — candidato en backlog).
- Detalles añadidos no pedidos por el mock: contador de filtros activos en el summary móvil y explicación accesible del slider deshabilitado.
- Lección de test: dos `render()` en el mismo `it` conviven en el DOM (Testing Library solo limpia entre tests) — separar en tests independientes.

---
id: FEATURE-008
tipo: feature
titulo: SEO, datos de demo y pulido del MVP
estado: hecho
prioridad: media
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-10
---

# FEATURE-008 — SEO, datos de demo y pulido del MVP

## Descripción

Dejar el MVP presentable: fichas indexables y compartibles (og:image con la foto del animal, sitemap, datos estructurados), datos de demostración realistas (3-4 protectoras ficticias con animales y fotos libres), páginas de error amables y textos legales publicados. (Ref: checklist §7 de la biblia)

## Contexto / impacto

De esto depende la demo a dirección y la captación orgánica posterior. El og:image es clave: la mayoría de fichas se compartirán por WhatsApp.

## Plan de desarrollo

### Documentación a consultar

- Biblia §7 (checklist SEO/legal/demo), [PRIVACY](../../meta/PRIVACY.md), skill `adoptia-frontend`

### Seguridad

- Textos legales revisados: la plataforma **intermedia**, la adopción la formaliza la protectora (limitación de responsabilidad).
- `robots.txt` bloquea panel/admin; sitemap solo público.

### Modelo de datos

- `supabase/seed.sql`: 4 protectoras (Bilbao, Madrid, Valencia, Sevilla) con 6-10 animales cada una, fotos Unsplash/Pexels, solicitudes de ejemplo.

### API

- `GET /api/og/[slug]` — generación de og:image con `next/og` (foto + nombre + "En adopción").

### Frontend

- `generateMetadata` en fichas; JSON-LD (schema.org `Product`/`Organization` adaptado); sitemap.xml y robots.txt dinámicos.
- Páginas: 404/500 amables con ilustración, `/privacidad`, `/aviso-legal`, `/cookies`.
- Contadores reales de la home (protectoras, animales, adopciones).

### Tareas TDD

1. Test metadata de ficha (title/description/og por animal).
2. Test og-image endpoint devuelve imagen con foto de portada.
3. Test sitemap: solo contenido publicado/verificado; borradores fuera.
4. Test 404 de animal adoptado sugiere similares.
5. Lighthouse CI: SEO ≥95, accesibilidad ≥90 en home/listado/ficha.

### Dependencias

- FEATURE-005, FEATURE-007.

## Criterios de aceptación / Casuística a cubrir

- [x] Compartir ficha por WhatsApp muestra foto del animal + nombre (og:image `/api/og/[slug]` + metadatos OpenGraph verificados en local).
- [x] `site:` de Google indexaría solo público (robots bloquea panel/admin/cuenta/api/auth; sitemap solo publicados de verificadas — el animal `not_listed` del seed queda fuera, comprobado).
- [x] Seed ejecutable en un paso (`supabase db reset` validado: 4 protectoras, 23 animales, 22 fotos, 3 solicitudes, 6 perfiles).
- [x] Política de privacidad, aviso legal y cookies publicados y enlazados en footer (más términos).
- [x] 404/500 con navegación de escape; sin páginas de error por defecto de Next (`not-found`, `error`, `global-error`).
- [x] Lighthouse móvil (build de producción local): SEO 100 en las tres páginas; A11y 100/98/100; Perf 84 (home), 87 (listado), 73 (ficha — LCP inflado por la primera optimización de imagen remota en local; re-medir en producción, seguimiento en [[IMPROVEMENT-012]]).

## Cierre (2026-07-10)

Implementado en rama `feature/FEATURE-008-seo-demo-pulido` con TDD (og:image, metadata, JSON-LD, sitemap, robots, 404, contadores, CSP). Suite completa verde (435 tests), lint y `tsc` limpios, build OK y smoke test real sobre `npm run start` con el seed cargado. Único criterio con matiz: performance móvil de la ficha (73 local), delegado a [[IMPROVEMENT-012]] para re-medición en producción.

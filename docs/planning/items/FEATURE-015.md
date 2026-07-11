---
id: FEATURE-015
tipo: feature
titulo: Contenido educativo sobre adopción responsable
estado: hecho
prioridad: baja
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-11
---

# FEATURE-015 — Contenido educativo

## Descripción

Sección de guías sobre adopción responsable: primeros días en casa, costes reales de tener un animal, preparación de la vivienda, etc. Contenido estático bien maquetado. (Ref: U14)

## Contexto / impacto

Aporta valor al adoptante, reduce devoluciones post-adopción y es el motor SEO de long-tail ("cuánto cuesta tener un perro").

## Plan de desarrollo

### Documentación a consultar

- Skill `adoptia-frontend` (MDX en App Router), FEATURE-008 (patrones SEO)

### Seguridad

- Contenido estático; sin superficie nueva.

### Modelo de datos

- Sin cambios: ficheros MDX en `src/content/guias/`.

### API

- Sin cambios.

### Frontend

- `/guias` con índice por categorías y plantilla de artículo (tiempo de lectura, TOC, CTA "buscar animales cerca"). MDX con componentes propios (avisos, checklists).

### Tareas TDD

1. Test render de MDX con componentes personalizados.
2. Test metadata/JSON-LD `Article` por guía.
3. Test sitemap incluye guías.

### Dependencias

- FEATURE-008.

## Criterios de aceptación / Casuística a cubrir

- [x] 4 guías iniciales publicadas (primeros días, costes reales, preparar la casa, adoptar un senior) y enlazadas desde home, pie de la ficha del animal y footer.
- [x] Cada guía con metadata SEO completa (title, description, canonical, OpenGraph article), JSON-LD `Article` y entrada en el sitemap.
- [x] Añadir una guía = añadir un fichero Markdown en `src/content/guias/` con frontmatter, sin tocar código (índice, sitemap y rutas estáticas se generan del directorio; test verifica los metadatos de todas).

## Cierre (2026-07-11)

- **Sin MDX**: se descartó `@next/mdx` (dependencia nueva + riesgo de dynamic import por slug bajo turbopack) en favor de **Markdown con renderer propio** (`src/components/guias/Markdown.tsx`): h2/h3 con ancla, párrafos, listas, checklists (`- [ ]`), avisos (`>`), negrita/cursiva y enlaces (internos con next/link). Cubre los "componentes propios" del plan (avisos, checklists) con sintaxis Markdown estándar.
- **Páginas**: `/guias` (índice por categorías con tiempo de lectura) y `/guias/[slug]` (TOC de h2, tiempo de lectura, fecha, CTA "buscar animales cerca"); rutas de guía pre-renderizadas (`generateStaticParams`).
- **Lib** `src/lib/guias.ts`: frontmatter propio, minutos de lectura (~200 ppm), TOC, y `leerGuia` rechaza slugs con path traversal.
- **Tests**: 7 de lib (incluye validación de las 4 guías reales) + 2 del renderer. Suite: 648.

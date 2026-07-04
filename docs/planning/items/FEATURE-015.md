---
id: FEATURE-015
tipo: feature
titulo: Contenido educativo sobre adopción responsable
estado: listo
prioridad: baja
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
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

- [ ] Mínimo 4 guías iniciales publicadas y enlazadas desde home y fichas.
- [ ] Cada guía con metadata SEO completa y datos estructurados.
- [ ] Añadir una guía = añadir un fichero MDX, sin tocar código.

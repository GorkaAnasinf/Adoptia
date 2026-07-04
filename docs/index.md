# Adoptia

**Plataforma web que conecta protectoras de animales con personas que quieren adoptar.**
Mapa por proximidad, fichas de animales, solicitudes con cuestionario y citas — todo lo que hoy está disperso en redes y teléfono, en un solo lugar.

## Navegación

| Área | Qué encontrarás |
|------|-----------------|
| [🧭 Contexto de producto](product/PRODUCT_CONTEXT.md) | **Empieza aquí** — mapa del conocimiento y catálogo de features |
| [📦 Producto](product/PLAN.md) | Visión, problema, valor, límites del MVP |
| [🔧 Técnico](technical/ARCHITECTURE.md) | Arquitectura, modelo de datos, API, diseño, decisiones |
| [🗓️ Planificación](planning/BACKLOG.md) | Backlog, roadmap, changelog — dónde estamos |
| [⚙️ Operación](operations/SETUP.md) | Cómo arrancar, entornos, runbooks, seguridad |
| [📐 Meta](meta/TESTING.md) | Testing, privacidad RGPD, cómo documentamos |

## Flujo de trabajo

1. Los items viven en `docs/planning/items/` (única fuente de verdad).
2. BACKLOG, ROADMAP y el catálogo de PRODUCT_CONTEXT se **renderizan** con `python scripts/render_planning.py` — nunca se editan a mano.
3. El desarrollo sigue el flujo SDD de la **Manada** (`/adoptia-balto` como punto de entrada).

## Stack

Next.js 15 (App Router) + TypeScript · Tailwind + shadcn/ui · Supabase (PostgreSQL + PostGIS, Auth, Storage) · Leaflet + OpenStreetMap · Resend · Vercel — **coste 0 €** en free tiers.

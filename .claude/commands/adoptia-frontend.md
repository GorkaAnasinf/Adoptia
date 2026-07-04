---
description: Patrones de frontend de Adoptia — Next.js 15 App Router, Tailwind + shadcn/ui, tokens de diseño, Leaflet, i18n
---

# Skill: Frontend Adoptia

Referencia obligatoria antes de tocar UI. Design system completo: `docs/technical/DESIGN.md`. Pantallas de referencia: `docs/technical/prompts-stitch.md`.

## Tokens de diseño (fuente: DESIGN.md)

- **Primario terracota** `#9f402d` (container `#e2725b`) — marca, estados activos, selección.
- **Secundario teal** `#396662` — CTAs de alta prioridad ("Adoptar", "Me interesa").
- **Terciario salvia** `#4e635a` — éxito, etiquetas.
- **Fondo crema** `#fef8f0`, texto `#1d1b17`, error `#ba1a1a`.
- Tipografía: **Montserrat** (titulares) + **Open Sans** (cuerpo) vía `next/font`.
- Radios: inputs 8px, cards 16px, chips/pills full. Sin bordes duros: sombras ambiente suaves.
- Los tokens viven en la config de Tailwind (`primary`, `secondary`, `tertiary`, `surface`...) — **usa las clases semánticas, nunca hex sueltos**.
- **Sin dark mode** (decisión inicial).

## Estructura y patrones App Router

- Grupos de rutas: `(public)` SSR/ISR, `(adopter)`/`(shelter)`/`(admin)` CSR autenticado.
- **Server Components por defecto**; `"use client"` solo con interactividad real.
- Datos en páginas públicas: consulta Supabase en el Server Component + `revalidate` (ISR).
- Metadata: `generateMetadata` en toda página pública (SEO crítico).
- Imágenes SIEMPRE `next/image` con `alt` real (accesibilidad + performance).

## Formularios

React Hook Form + Zod, siempre este trío:

```tsx
const schema = z.object({ ... });            // en src/lib/schemas/ — se REUTILIZA en el servidor
const form = useForm({ resolver: zodResolver(schema) });
// errores accesibles: aria-invalid + mensaje asociado, componentes shadcn <Form>
```

Steppers (cuestionario, onboarding): validación por paso, estado en el padre, progreso visible, no perder datos al retroceder.

## Leaflet (mapa)

```tsx
// SIEMPRE dynamic import sin SSR — Leaflet toca window
const Mapa = dynamic(() => import("@/components/map/Mapa"), { ssr: false });
```

- `react-leaflet` + `leaflet.markercluster`; atribución OSM obligatoria.
- Móvil: bottom sheet para la lista; no secuestrar el scroll de la página con el mapa.

## i18n (next-intl)

- TODO texto de UI en `messages/es.json`; en componentes `useTranslations()` / `getTranslations()`.
- Prohibido texto hardcodeado — es lo primero que revisa Scooby.

## Mobile-first y accesibilidad (WCAG AA)

- Diseña la vista móvil primero; grid 2 col móvil / 4 desktop en listados.
- Targets táctiles ≥44px; contraste AA (el par terracota/blanco ya cumple); focus visible.
- **Estados vacíos cuidados** en toda lista (ilustración + texto amable + CTA) — es seña de identidad del producto.
- Barra de acción sticky inferior en fichas (móvil).

## Convenciones

- Componentes en `src/components/{ui,animals,map,forms,shelters}/`; PascalCase.
- shadcn/ui como base — no reinventar botones/inputs/dialogs.
- Optimistic UI en favoritos y acciones ligeras.

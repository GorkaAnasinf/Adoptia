# Arquitectura — Adoptia

> Referencia completa con justificaciones: [analisis-tecnico.md](analisis-tecnico.md) (biblia del proyecto).

## Visión

Aplicación **Next.js 15 (App Router) + TypeScript** desplegada en Vercel, con **Supabase** como backend gestionado (PostgreSQL + PostGIS, Auth, Storage). **No hay backend separado**: la lógica de servidor vive en Route Handlers y Server Components. Restricción rectora: **coste 0 €** — todo en free tiers, escalable a planes de pago sin reescribir.

```
[Navegador]
    │
    ▼
[Vercel — Next.js 15]
    ├── Páginas públicas (SSR/ISR): home, mapa, /animales/[slug], /protectoras/[slug]
    ├── Panel protectora + área adoptante (CSR autenticado)
    ├── Admin (verificación, moderación)
    └── Route Handlers /api/*: solicitudes, emails, cron (keepalive, backups)
    │
    ▼
[Supabase]
    ├── PostgreSQL + PostGIS (proximidad: ST_DWithin, orden por distancia)
    ├── Auth (email+password, Google OAuth; roles adopter/shelter/admin)
    ├── Storage (fotos comprimidas en cliente, ≤300 KB; vídeo ≤50 MB o link YouTube)
    └── RLS — políticas de acceso EN LA BD, no en el código
    │
    ▼
[Resend] emails · [OSM/Leaflet] mapas · [Nominatim] geocoding (cacheado en BD)
```

## Capas y responsabilidades

| Capa | Tecnología | Responsabilidad |
|------|-----------|-----------------|
| UI | Tailwind CSS 4 + shadcn/ui | Componentes según [DESIGN.md](DESIGN.md) |
| Formularios/validación | React Hook Form + Zod | Un esquema Zod por formulario, reutilizado en servidor |
| Datos | supabase-js (+ Drizzle si crece) | Queries tipadas; escrituras sensibles vía Route Handlers |
| Auth | Supabase Auth + middleware Next | Sesión SSR con `@supabase/ssr`; roles en `profiles.role` |
| Seguridad | RLS + validación Zod en servidor | Ver [SECURITY](../operations/SECURITY.md) |
| Emails | Resend + react-email | Plantillas en `src/emails/` |
| Mapas | Leaflet + OpenStreetMap | Clustering de marcadores; sin API key |
| Observabilidad | Sentry + Umami | Errores + analítica sin cookies |

## Decisiones estructurales clave

- **SSR/ISR para SEO**: las fichas deben indexarse ("adoptar perro en Bilbao"). Páginas públicas con ISR; panel privado CSR.
- **RLS como pilar**: lectura pública solo de contenido publicado y protectoras verificadas; cada protectora solo escribe lo suyo. El código asume que la BD ya protege.
- **Geocoding solo en escritura**: Nominatim se llama al dar de alta/editar dirección; lat/lng se persisten en `shelters.location`. Nunca geocodificar en lectura.
- **Media barata**: compresión de imagen en cliente (browser-image-compression), `next/image` para servir, YouTube embebido para vídeo largo.

## Estructura del repositorio

```
adoptia/
├── docs/                    # esta documentación (MkDocs)
├── scripts/                 # render_planning.py
├── supabase/
│   ├── migrations/          # SQL versionado (CLI de Supabase)
│   └── seed.sql             # datos de demo
├── src/
│   ├── app/
│   │   ├── (public)/        # home, mapa, animales/[slug], protectoras/[slug]
│   │   ├── (adopter)/       # mis-solicitudes, favoritos, alertas
│   │   ├── (shelter)/panel/ # dashboard, animales, solicitudes, agenda, perfil
│   │   ├── (admin)/
│   │   └── api/             # route handlers (solicitudes, emails, cron)
│   ├── components/          # ui/ (shadcn), animals/, map/, forms/
│   ├── lib/                 # supabase client, zod schemas, utils
│   └── emails/              # plantillas react-email
└── .github/workflows/       # ci.yml, keepalive.yml (+ backup.yml futuro)
```

## Internacionalización

ES único al lanzar. **Preparado con next-intl desde FEATURE-000**: textos en `messages/es.json`, nunca hardcodeados en componentes. Añadir un idioma = añadir un JSON, sin tocar código.

## Entornos

| Rama | Entorno | Servicio |
|------|---------|----------|
| `main` | Producción | Vercel + proyecto Supabase |
| `develop` | Preview automático | Vercel Preview Deployments |

Detalle en [ENVIRONMENT](../operations/ENVIRONMENT.md).

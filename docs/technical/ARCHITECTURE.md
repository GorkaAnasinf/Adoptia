# Arquitectura — Adoptia

> Referencia completa con justificaciones: [analisis-tecnico.md](analisis-tecnico.md) (biblia del proyecto).

## Visión

Aplicación **Next.js 15 (App Router) + TypeScript** desplegada en Vercel, con **Supabase** como backend gestionado (PostgreSQL + PostGIS, Auth, Storage). **No hay backend separado**: la lógica de servidor vive en Route Handlers y Server Components. Restricción rectora: **coste 0 €** — todo en free tiers, escalable a planes de pago sin reescribir.

```
[Navegador]
    │
    ▼
[Vercel — Next.js 15]
    ├── Páginas públicas (SSR/ISR): home, buscador, mapa, /animales/[slug],
    │                               /protectoras/[slug], /jornadas, /perdidos-encontrados, /guias
    ├── Panel protectora + área adoptante (CSR autenticado)
    ├── Admin (verificación, moderación, reportes, auditoría)
    └── Route Handlers /api/*: solicitudes, citas, acogida, donaciones, historias,
                               moderación, og (imagen social), geocode, cron
    │
    ▼
[Supabase]
    ├── PostgreSQL + PostGIS (proximidad: ST_DWithin, orden por distancia, índices GiST)
    ├── Auth (email + contraseña; roles adopter/shelter/admin en `profiles.role`)
    ├── Storage (6 buckets: logos, animal-media, shelter-media, lost-found,
    │            story-media, event-posters — fotos comprimidas en cliente ≤300 KB)
    └── RLS — políticas de acceso EN LA BD, no en el código
    │
    ▼
[SMTP Gmail] emails · [OSM/Leaflet] mapas · [Nominatim] geocoding (cacheado en BD)
[Turnstile] CAPTCHA · [Sentry] errores · [Umami] analítica sin cookies
```

## Capas y responsabilidades

| Capa | Tecnología | Responsabilidad |
|------|-----------|-----------------|
| UI | Tailwind CSS 4 + shadcn/ui | Componentes según [DESIGN.md](DESIGN.md) |
| Formularios/validación | React Hook Form + Zod | Un esquema Zod por formulario, reutilizado en servidor |
| Datos | supabase-js | Queries tipadas contra `database.types.ts`; escrituras sensibles vía Route Handlers |
| Auth | Supabase Auth + middleware Next | Sesión SSR con `@supabase/ssr`; roles en `profiles.role` |
| Seguridad | RLS + validación Zod en servidor | Ver [SECURITY](../operations/SECURITY.md) |
| Emails | Nodemailer + SMTP de Gmail | Plantillas HTML propias en `src/lib/email/templates.ts` (Decisión #22) |
| Mapas | Leaflet + OpenStreetMap | Clustering de marcadores; sin API key; `dynamic import` sin SSR |
| Observabilidad | Sentry + Umami | Errores + analítica sin cookies |

## Trabajo programado (crons)

Cuatro workflows de GitHub Actions golpean endpoints `/api/cron/*` protegidos por `CRON_SECRET`:

| Workflow | Qué hace |
|----------|----------|
| `alertas.yml` | Envía las alertas guardadas que tengan animales nuevos que encajen |
| `recordatorios.yml` | Recordatorio de cita 24 h antes, al adoptante y a la protectora |
| `jornadas.yml` | Recordatorio de jornada a los asistentes, resumen a la protectora y aviso de jornada cercana por zona |
| `keepalive.yml` | Evita la hibernación del proyecto Supabase gratuito |

La idempotencia vive en la BD (`last_sent_at`, `reminder_sent_at`, `reminded_at`, `zone_notified_at`): un cron que se ejecute dos veces no envía dos correos.

## Decisiones estructurales clave

- **SSR/ISR para SEO**: las fichas deben indexarse ("adoptar perro en Bilbao"). Páginas públicas con ISR; panel privado CSR.
- **RLS como pilar**: lectura pública solo de contenido publicado y protectoras verificadas; cada protectora solo escribe lo suyo. El código asume que la BD ya protege.
- **Geocoding solo en escritura**: Nominatim se llama al dar de alta/editar dirección; lat/lng se persisten en `shelters.location`. Nunca geocodificar en lectura; las respuestas se cachean en `geocode_cache`.
- **Privacidad geográfica por diseño**: las ubicaciones de particulares (`foster_homes`, `lost_found_posts`, `lost_found_sightings`, `donation_offers`) se redondean a una rejilla de ~200 m mediante trigger **al escribir** — la dirección exacta nunca llega a existir en la base de datos.
- **Media barata**: compresión de imagen en cliente (browser-image-compression), `next/image` para servir, YouTube embebido para vídeo largo.
- **Exposición controlada vía RPC**: lo que necesita filtro geográfico o de visibilidad sale por funciones `security definer`, no por consultas directas a la tabla. Los listados pensados para el público (`shelters_nearby`, `events_upcoming`, `event_detail`, `lost_found_list`) se conceden a `anon` devolviendo solo lo publicado; los que exponen datos de particulares (`foster_homes_nearby`, `donation_offers_nearby`) tienen el permiso **revocado a `anon`** y solo los ejecuta una protectora verificada dentro del radio que el propio particular declaró.

## Estructura del repositorio

```
adoptia/
├── docs/                    # esta documentación (MkDocs)
├── messages/es.json         # textos de UI (next-intl)
├── scripts/                 # render_planning.py
├── supabase/
│   ├── migrations/          # SQL versionado (CLI de Supabase): esquema + políticas RLS
│   └── seed.sql             # datos de demo
├── src/
│   ├── app/
│   │   ├── (public)/        # home, buscador, mapa, animales/[slug], protectoras/[slug],
│   │   │                    # jornadas, perdidos-encontrados, necesidades, acogida, guías, legales
│   │   ├── (adopter)/       # mi cuenta: solicitudes, citas, favoritos, alertas, acogida
│   │   ├── (shelter)/panel/ # dashboard, animales, solicitudes, agenda, citas, jornadas,
│   │   │                    # estadísticas, perfil, acogida, necesidades
│   │   ├── (admin)/         # verificación, moderación, reportes, auditoría
│   │   ├── (auth)/          # login, registro, recuperación, verificación de correo
│   │   └── api/             # route handlers (solicitudes, citas, admin, og, cron, geocode…)
│   ├── components/          # ui/ (shadcn), animales/, mapa/, formularios/, perdidos/…
│   ├── content/             # contenido editorial (guías de adopción)
│   ├── i18n/                # configuración de next-intl
│   ├── lib/                 # clientes Supabase, esquemas Zod, email/, utilidades
│   └── test/                # utilidades de test
└── .github/workflows/       # ci.yml, alertas.yml, recordatorios.yml, jornadas.yml, keepalive.yml
```

## Internacionalización

ES único al lanzar. **Preparado con next-intl desde FEATURE-000**: textos en `messages/es.json`, nunca hardcodeados en componentes. Añadir un idioma = añadir un JSON, sin tocar código.

## Entornos

| Rama | Entorno | Servicio |
|------|---------|----------|
| `main` | Producción | Vercel + proyecto Supabase |
| `feature/*` · `fix/*` | Preview automático por rama | Vercel Preview Deployments |

El flujo es **main-based**: las ramas salen de `main` y se liberan a `main` con `merge --no-ff` (no hay `develop` intermedio). Detalle en [ENVIRONMENT](../operations/ENVIRONMENT.md).

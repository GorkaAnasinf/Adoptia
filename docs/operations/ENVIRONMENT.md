# Entornos y variables — Adoptia

## Entornos

| Entorno | Rama | Hosting | Datos |
|---------|------|---------|-------|
| **Producción** | `main` | Vercel (dominio propio o adoptia.vercel.app) | Proyecto Supabase principal |
| **Preview** | `develop` (y ramas feature) | Vercel Preview Deployments (URL por push) | Mismo proyecto Supabase* |
| **Local** | — | `next dev` | Mismo proyecto Supabase o `supabase start` local |

\* Un solo proyecto Supabase al principio (free = 2 proyectos máx.). Si el preview necesita datos aislados, crear segundo proyecto free como staging y variar las env en Vercel Preview.

## Variables

| Variable | Ámbito | Descripción |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente+servidor | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente+servidor | Clave pública (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** | Salta RLS — solo Route Handlers admin/cron. Jamás con prefijo NEXT_PUBLIC |
| `RESEND_API_KEY` | servidor | Envío de emails |
| `EMAIL_FROM` | servidor | Remitente verificado en Resend |
| `NEXT_PUBLIC_SITE_URL` | cliente+servidor | URLs absolutas (emails, og, sitemap) |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | ambos | Monitorización de errores |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | cliente | Analítica sin cookies |
| `CRON_SECRET` | servidor | Protege `/api/cron/*` |

Reglas:

- `.env.local` para local; Vercel dashboard para deploy; GitHub secrets para CI.
- Alta de variable nueva = actualizar `.env.example` + esta tabla en el mismo commit.
- Rotación: si una clave se filtra, rotar en el proveedor y actualizar los 3 sitios (ver [RUNBOOKS](RUNBOOKS.md)).

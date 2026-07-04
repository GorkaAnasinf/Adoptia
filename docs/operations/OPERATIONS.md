# Operaciones — Adoptia

## Ciclo de release

1. Trabajo en ramas `feature/FEATURE-NNN-slug` desde `develop` (gitflow sin PRs, ver [CONTRIBUTING](../../CONTRIBUTING.md)).
2. Merge a `develop` → preview en Vercel + CI.
3. Release: merge `develop → main` → producción automática. Etiquetar `vX.Y.Z` y actualizar [CHANGELOG](../planning/CHANGELOG.md).

## Tareas programadas (GitHub Actions)

| Workflow | Cuándo | Qué hace |
|----------|--------|----------|
| `ci.yml` | push/PR a develop/main | lint + typecheck + tests + build + render-check + docs |
| `keepalive.yml` | lunes y jueves 08:00 UTC | Ping a Supabase (evita pausa free de 7 días) |
| `backup.yml` (pendiente, con FEATURE-000) | semanal | `pg_dump` a artefacto (Supabase free no tiene backups) |

## Monitorización

- **Sentry**: errores de cliente y servidor; alerta por email al superar umbral.
- **Vercel dashboard**: build fallido, uso de bandwidth (límite 100 GB/mes free).
- **Supabase dashboard**: tamaño BD (500 MB) y Storage (1 GB) — revisar mensualmente; la compresión de imágenes en cliente es la defensa principal.
- **Resend**: cuota 100 emails/día — si las alertas (FEATURE-010) se acercan, agrupar más agresivamente.

## Límites free tier y señales de escalado

| Recurso | Límite | Señal para escalar |
|---------|--------|--------------------|
| Supabase BD | 500 MB | >70% → limpiar o Supabase Pro (25 $/mes) |
| Supabase Storage | 1 GB | >70% → Cloudinary/Bunny para media |
| Resend | 100/día | Rebotes por cuota → plan de pago o agrupación |
| Vercel bandwidth | 100 GB/mes | >70% → Vercel Pro |

## Incidencias

Procedimientos paso a paso en [RUNBOOKS.md](RUNBOOKS.md).

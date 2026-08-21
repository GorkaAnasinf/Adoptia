# Operaciones — Adoptia

## Ciclo de release

1. Trabajo en ramas `feature/FEATURE-NNN-slug` (o `fix/BUG-NNN-slug`) **desde `main`** (gitflow main-based sin PRs, Decisión #58; ver [CONTRIBUTING](../../CONTRIBUTING.md)).
2. Cada push a la rama genera un **preview automático** en Vercel y ejecuta CI.
3. Release: merge de la rama a `main` con `merge --no-ff` + push → producción automática. Actualizar [CHANGELOG](../planning/CHANGELOG.md).

> `develop` quedó en desuso (llegó a estar ~83 commits por detrás): ramificar desde ahí producía conflictos inexistentes en el trabajo real.

## Tareas programadas (GitHub Actions)

| Workflow | Cuándo | Qué hace |
|----------|--------|----------|
| `ci.yml` | push a `main` y a ramas de trabajo | lint + typecheck + tests (unit + RLS) + build + auditoría de dependencias |
| `keepalive.yml` | lunes y jueves 08:00 UTC | Ping a Supabase (evita pausa free de 7 días) |
| `alertas.yml` | diario 09:00 UTC | Envía las alertas guardadas con animales nuevos que encajan |
| `recordatorios.yml` | cada hora (min. 10) | Recordatorio de cita 24 h antes (adoptante y protectora) |
| `jornadas.yml` | cada hora (min. 20) | Recordatorio de jornada, resumen a la protectora y aviso por zona |
| `backup.yml` (pendiente) | semanal | `pg_dump` a artefacto (Supabase free no tiene backups) |

## Monitorización

- **Sentry**: errores de cliente y servidor; alerta por email al superar umbral.
- **Vercel dashboard**: build fallido, uso de bandwidth (límite 100 GB/mes free).
- **Supabase dashboard**: tamaño BD (500 MB) y Storage (1 GB) — revisar mensualmente; la compresión de imágenes en cliente es la defensa principal.
- **SMTP de Gmail**: límite práctico ~500 emails/día (Decisión #22) — si las alertas (FEATURE-010) y los recordatorios se acercan, agrupar más agresivamente o pasar a un proveedor con dominio verificado.

## Límites free tier y señales de escalado

| Recurso | Límite | Señal para escalar |
|---------|--------|--------------------|
| Supabase BD | 500 MB | >70% → limpiar o Supabase Pro (25 $/mes) |
| Supabase Storage | 1 GB | >70% → Cloudinary/Bunny para media |
| SMTP de Gmail | ~500/día | Rebotes por cuota → proveedor transaccional con dominio propio o agrupación |
| Vercel bandwidth | 100 GB/mes | >70% → Vercel Pro |

## Incidencias

Procedimientos paso a paso en [RUNBOOKS.md](RUNBOOKS.md).

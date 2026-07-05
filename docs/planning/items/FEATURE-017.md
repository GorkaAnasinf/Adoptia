---
id: FEATURE-017
tipo: feature
titulo: Despliegue inicial — Supabase cloud y Vercel enlazados
estado: recibido
prioridad: alta
hito: "0.1"
duplicado_de: null
creado: 2026-07-05
actualizado: 2026-07-05
---

# FEATURE-017 — Despliegue inicial: Supabase cloud y Vercel enlazados

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Completar los pasos manuales de FEATURE-000 que requieren cuentas externas del propietario del proyecto: crear el proyecto Supabase cloud, aplicar la migración baseline (`supabase db push`), enlazar el repo a Vercel con sus variables de entorno y verificar que un push a `develop` genera preview automáticamente y que el workflow de keepalive funciona con `CRON_SECRET` real.

## Contexto / impacto

Sin esto no hay entorno público ni previews; el desarrollo local funciona (stack `supabase start`), pero la demo a dirección necesita URL real. Bloquea la verificación completa de dos criterios de FEATURE-000 (CI/preview y `db push` contra proyecto nuevo).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [ENVIRONMENT](../../operations/ENVIRONMENT.md), [SETUP](../../operations/SETUP.md)

### Seguridad

- Claves solo en Vercel dashboard y GitHub secrets; `SUPABASE_SERVICE_ROLE_KEY` jamás en cliente ni en el repo.

### Modelo de datos

- Sin cambios (aplica la migración baseline existente).

### API

- Sin cambios.

### Frontend

- Sin cambios.

### Tareas TDD

1. `supabase link` + `supabase db push` contra proyecto cloud nuevo; verificar PostGIS y RLS activas.
2. Vercel: importar repo, variables de entorno (production + preview), rama de producción `main`.
3. GitHub secrets para CI (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Push a `develop` → preview automática; workflow keepalive en verde con `CRON_SECRET`.

### Dependencias

- FEATURE-000 (hecho).

## Criterios de aceptación / Casuística a cubrir

- [ ] `supabase db push` aplica limpia en el proyecto cloud nuevo; PostGIS activo.
- [ ] Push a `develop` genera preview en Vercel automáticamente.
- [ ] CI en GitHub Actions verde con los secrets configurados.
- [ ] `GET /api/cron/keepalive` responde 200 con el `CRON_SECRET` de producción y 401 sin él.

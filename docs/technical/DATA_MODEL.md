# Modelo de datos — Adoptia

> Tablas campo a campo en la [biblia técnica §3](analisis-tecnico.md). Este documento es el resumen operativo.

## Diagrama de entidades

```
profiles ──< shelters ──< animals ──< animal_media
   │             │           │
   │             │           ├──< adoption_requests >── profiles
   │             │           │           │
   │             │           │           └──< appointments
   │             │           └──< sponsorships          (fase 3)
   │             ├──< shelter_media
   │             └──< availability_slots                (fase 2)
   ├──< favorites >── animals                           (fase 2)
   ├──< saved_searches                                  (fase 2)
   └──< lost_found_posts                                (fase 3)
```

## Entidades núcleo (fase 1)

| Tabla | Qué es | Claves de diseño |
|-------|--------|------------------|
| `profiles` | Extiende `auth.users`; rol `adopter/shelter/admin` | PK = `auth.users.id` |
| `shelters` | Protectora | `location geography(Point)` (PostGIS), `status pending/verified/suspended`, `slug` único |
| `animals` | Ficha de animal | `status available/reserved/adopted/fostered/not_listed`; `published_at null` = borrador; compatibilidades `boolean nullable` (null = desconocido) |
| `animal_media` / `shelter_media` | Fotos/vídeos | `type photo/video/youtube`; `is_cover`; `sort_order` |
| `adoption_requests` | Solicitud "Me interesa" | `questionnaire jsonb`; **unique(animal_id, adopter_id)**; estados `pending/approved/rejected/withdrawn/completed` |

Fase 2: `availability_slots`, `appointments`, `favorites`, `saved_searches`, `notifications`.
Fase 3: `sponsorships`, `lost_found_posts`.

## Reglas RLS (pilar de seguridad)

| Tabla | Lectura | Escritura |
|-------|---------|-----------|
| `animals`, `shelters` | Pública **solo** si `published_at is not null` / `status='verified'` | Solo `shelter.owner_id = auth.uid()` |
| `adoption_requests` | El adoptante que la creó + la protectora del animal | Adoptante crea; protectora actualiza estado/notas |
| `favorites`, `saved_searches` | Solo su dueño | Solo su dueño |
| Todo | `admin` acceso total (verificación, moderación) | — |

## Consulta clave — proximidad

```sql
select a.*, s.name shelter_name,
       st_distance(s.location, st_makepoint(:lng,:lat)::geography) as distance_m
from animals a
join shelters s on s.id = a.shelter_id
where a.status = 'available'
  and a.published_at is not null
  and s.status = 'verified'
  and st_dwithin(s.location, st_makepoint(:lng,:lat)::geography, :radius_m)
order by distance_m;
```

Requiere extensión **PostGIS** activada (disponible en Supabase free) e índice GiST sobre `shelters.location`.

## Migraciones

SQL versionado en `supabase/migrations/` con la CLI de Supabase (`supabase migration new`, `supabase db push`). Nunca cambios manuales en el dashboard sin su migración correspondiente. Seed de demo en `supabase/seed.sql`.

---
description: Patrones de base de datos de Adoptia — migraciones Supabase, RLS, PostGIS, Storage
---

# Skill: Base de datos Adoptia

Modelo completo: `docs/technical/DATA_MODEL.md` + `docs/technical/analisis-tecnico.md` §3.

## Migraciones (Supabase CLI)

```powershell
supabase migration new nombre_descriptivo   # crea supabase/migrations/<ts>_nombre.sql
supabase db push                            # aplica al proyecto linkado
supabase db reset                           # local: migraciones + seed.sql
```

Reglas: TODO cambio de esquema es una migración versionada · nunca editar migraciones ya aplicadas (nueva migración correctora) · enums de Postgres para estados · `created_at timestamptz default now()` y trigger de `updated_at` en tablas mutables.

## RLS — patrón obligatorio en TODA tabla nueva

```sql
alter table public.animals enable row level security;  -- deny by default

-- lectura pública SOLO de contenido publicado de protectora verificada
create policy "animals_public_read" on public.animals for select
  using (published_at is not null
         and exists (select 1 from shelters s where s.id = shelter_id and s.status = 'verified'));

-- escritura solo del dueño del shelter
create policy "animals_owner_write" on public.animals for all
  using (exists (select 1 from shelters s where s.id = shelter_id and s.owner_id = auth.uid()));

-- admin todo
create policy "animals_admin" on public.animals for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
```

- Cada política nueva → test de acceso permitido Y denegado (ver skill `adoptia-testing`).
- Columnas sensibles que el otro lado no debe ver (p. ej. `shelter_notes`): exponer vía **vista** o select explícito, nunca `select *` hacia el cliente.

## PostGIS

```sql
create extension if not exists postgis;
-- columna: location geography(Point, 4326)
create index shelters_location_idx on shelters using gist(location);
```

Consulta de proximidad SIEMPRE con `st_dwithin` (usa el índice) + `st_distance` para ordenar — patrón completo en DATA_MODEL. Exponer como **función RPC** (`shelters_nearby(lat, lng, radius_m)`) con `security definer` cuidadoso (filtra `verified` dentro).

## Storage

- Buckets: `logos`, `animal-media`, `shelter-media`. Rutas `shelter_id/<uuid>.webp`.
- Políticas de Storage espejo de las RLS (dueño escribe en su carpeta; lectura pública solo de contenido publicado).
- Validar MIME y tamaño en política además del cliente.
- Al borrar fila de media, borrar el objeto de Storage (no dejar huérfanos).

## Seed

`supabase/seed.sql`: 4 protectoras ficticias geolocalizadas (Bilbao, Madrid, Valencia, Sevilla) con animales variados — determinista, ejecutable N veces (`on conflict do nothing`).

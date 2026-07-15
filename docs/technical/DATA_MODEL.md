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
   └──< lost_found_posts ──< lost_found_sightings       (fase 3)
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
Fase 3: `sponsorships`, `lost_found_posts`, `lost_found_sightings`.

### Avisos de perdidos y sus pistas (FEATURE-012 + FEATURE-022)

| Tabla | Qué es | Claves de diseño |
|-------|--------|------------------|
| `lost_found_posts` | Aviso de perdido/encontrado | `type lost/found`, `status open/resolved/archived`, `location geography(Point)` **redondeada a ~200 m por trigger antes de guardar**; `contact_phone` (opt-in, check de formato) y `allow_contact` (FEATURE-022); señas `breed/sex/size/color/has_collar/collar_description/has_microchip` y `occurred_on` (FEATURE-023); `last_activity_at` alimenta el cron de caducidad a 60 días |
| `lost_found_sightings` | "He visto a este animal": pista de un vecino | `post_id → lost_found_posts` (`on delete cascade`), `seen_at` con check de no-futuro, `location` con **el mismo trigger de redondeo** que el aviso; trigger `after insert` que refresca `last_activity_at` del aviso |

**Redondeo de privacidad**: `public.round_lost_found_location()` hace snap a una rejilla de 0.002° (~200 m) en un `BEFORE INSERT/UPDATE`. La coordenada exacta **nunca llega a existir en BD**, así que no puede filtrarse por ninguna vía (ni un dump, ni un `select` con `service_role`). La misma función la reusan `lost_found_posts`, `lost_found_sightings` y `foster_homes`.

**Nada de número de microchip** (FEATURE-023): `has_microchip` es un `boolean` nullable (null = «no lo sé»), como las compatibilidades de `animals`. El número identifica al dueño en el registro autonómico, así que es un dato personal indirecto disfrazado de dato del animal. Hay un test de RLS que vigila que no aparezca ninguna columna que lo contenga.

**`occurred_on` no es `created_at`**: la primera es cuándo se perdió o se encontró el animal; la segunda, cuándo se publicó el aviso. Los filtros y las tarjetas usan `occurred_on` — publicar tarde no debe hacer que un aviso viejo parezca fresco. Se llama así, y no `lost_at`, porque la tabla sirve para `lost` y para `found`.

**Minimización en las pistas**: el RPC público `lost_found_sightings_list(post_id)` devuelve fecha, nota, foto y lat/lng redondeados — **no `user_id`**: quién reporta no es asunto público. Borrar la cuenta borra sus avistamientos en cascada.

| Tabla | Lectura | Escritura |
|-------|---------|-----------|
| `lost_found_posts` | Pública si `status in (open, resolved)`; `archived` solo autor/admin | Solo el autor (`user_id = auth.uid()`) |
| `lost_found_sightings` | Pública **solo si el aviso padre es público** (se archivan con él) | Inserta el propio usuario y solo sobre avisos `open`; borran el que reportó, **el autor del aviso** (spam en su ficha) y admin |

## Reglas RLS (pilar de seguridad)

| Tabla | Lectura | Escritura |
|-------|---------|-----------|
| `animals`, `shelters` | Pública **solo** si `published_at is not null` / `status='verified'` | Solo `shelter.owner_id = auth.uid()` |
| `adoption_requests` | El adoptante que la creó + la protectora del animal | Adoptante crea; protectora actualiza estado/notas |
| `favorites`, `saved_searches` | Solo su dueño | Solo su dueño |
| Todo | `admin` acceso total (verificación, moderación) | — |

### `adoption_requests.shelter_notes` — RLS por columna (FEATURE-007)

La policy de `update`/`select` de `adoption_requests` es a nivel de fila (adoptante dueño y protectora dueña comparten `using`/`with check`), así que no puede impedir por sí sola que el adoptante lea o escriba `shelter_notes` (notas internas de la protectora). Migración `20260710120000_feature007_adoption_requests_column_rls.sql`:

- **Lectura**: se revoca `SELECT` de tabla completa a `authenticated`/`anon` y se vuelve a conceder columna a columna, **sin** `shelter_notes`. Solo el backend con `service_role` (admin client) puede leerla — así lo hace ya el panel de la protectora (`src/app/(shelter)/panel/solicitudes/page.tsx`). Cualquier query desde un cliente `authenticated`/`anon` que use `select()`/`select("*")` sobre `adoption_requests` debe listar columnas explícitas (sin `shelter_notes`).
- **Escritura**: un trigger `BEFORE UPDATE` (`adoption_requests_guard_adopter_update`) compara `OLD`/`NEW` (RLS `with check` no tiene acceso a `OLD`) y bloquea que el propio adoptante modifique `shelter_notes` o cambie `status` a un valor distinto de `withdrawn`. La protectora dueña del animal y el admin quedan exentos.

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

Desde FEATURE-005 esta consulta vive en el RPC **`animals_search`** (migración
`20260709120000`, SECURITY INVOKER → la RLS aplica): filtros combinables (especie, tamaños,
sexos, convivencia, rango de nacimiento), **búsqueda por texto libre** sobre `name`/`breed`
(parámetro `p_query`, `ilike`; IMPROVEMENT-021, migración `20260714150000` que hace
`drop`+recreate por el cambio de firma), radio y orden por distancia opcionales, portada
desde `animal_media` y `total_count` por ventana para paginar. Lo consumen el listado
`/animales`, la home y las sugerencias de la ficha vía `supabase.rpc("animals_search", args)`
con el builder de `src/lib/animal-search.ts`.

El equivalente para protectoras es el RPC **`shelters_nearby`** (baseline, extendido en
FEATURE-006 por las migraciones `20260710100000`/`20260710110000`, SECURITY DEFINER que
filtra `status = 'verified'` dentro de la función): recibe `lat`/`lng`/`radius_m` y filtros
opcionales de especie/voluntariado/acogida, y devuelve además `lat`/`lng` (para el marcador)
y `animal_count` (animales publicados, filtrados por la misma especie si aplica). Lo consume
la pantalla `/mapa` vía `supabase.rpc("shelters_nearby", args)` con el builder de
`src/lib/shelters-search.ts`.

Los agregados públicos anónimos de la ficha van por funciones **SECURITY DEFINER** que
blindan la visibilidad dentro (solo animal publicado de protectora `verified`, si no
devuelven neutro): **`registrar_visita`** (FEATURE-014, incrementa `page_views` sin PII) y
**`contar_interesados`** (IMPROVEMENT-020, migración `20260713140000`, devuelve el nº de
adoptantes distintos con solicitud sobre el animal — sin filtrar identidades; la tabla
`adoption_requests` sigue sin lectura pública). La ficha lo consume con
`supabase.rpc("contar_interesados", { p_animal_id })`.

## Migraciones

SQL versionado en `supabase/migrations/` con la CLI de Supabase (`supabase migration new`, `supabase db push`). Nunca cambios manuales en el dashboard sin su migración correspondiente. Seed de demo en `supabase/seed.sql`.

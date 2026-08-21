# Modelo de datos — Adoptia

> Tablas campo a campo en la [biblia técnica §3](analisis-tecnico.md). Este documento es el resumen operativo.

## Diagrama de entidades

```
profiles ──< shelters ──< animals ──< animal_media
   │             │           │
   │             │           ├──< adoption_requests >── profiles
   │             │           │           │
   │             │           │           └──< appointments
   │             │           ├──< sponsorships
   │             │           ├──< page_views
   │             │           └──< adoption_stories >── profiles
   │             ├──< shelter_media
   │             ├──< availability_slots
   │             ├──< availability_overrides
   │             ├──< availability_templates
   │             ├──< shelter_needs
   │             ├──< foster_proposals >── foster_homes
   │             └──< events ──< event_animals >── animals
   │                     └──< event_attendees >── profiles
   ├──< favorites >── animals
   ├──< saved_searches
   ├──< foster_homes
   ├──< donation_offers
   ├──< reports >── animals
   ├──< audit_log            (admin; sin cascada, ver borrado de cuenta)
   └──< lost_found_posts ──< lost_found_sightings
                       └──< lost_found_media

geocode_cache            (caché de Nominatim, sin relación)
```

**28 tablas en total**, todas con RLS activada. La agrupación por fases del plan
original ya no aplica: el inventario vigente es el del diagrama.

## Entidades núcleo (fase 1)

| Tabla | Qué es | Claves de diseño |
|-------|--------|------------------|
| `profiles` | Extiende `auth.users`; rol `adopter/shelter/admin` | PK = `auth.users.id` |
| `shelters` | Protectora | `location geography(Point)` (PostGIS), `status pending/verified/suspended`, `slug` único |
| `animals` | Ficha de animal | `status available/reserved/adopted/fostered/not_listed`; `published_at null` = borrador; compatibilidades `boolean nullable` (null = desconocido) |
| `animal_media` / `shelter_media` | Fotos/vídeos | `type photo/video/youtube`; `is_cover`; `sort_order` |
| `adoption_requests` | Solicitud "Me interesa" | `questionnaire jsonb`; **unique(animal_id, adopter_id)**; estados `pending/approved/rejected/withdrawn/completed` |

El resto de tablas se documenta por bloque funcional en las secciones siguientes:
agenda y citas (`availability_slots`, `availability_overrides`, `availability_templates`,
`appointments`), seguimiento del adoptante (`favorites`, `saved_searches`), perdidos y
encontrados (`lost_found_*`), acogida (`foster_homes`, `foster_proposals`), ayuda material
(`shelter_needs`, `donation_offers`), historias felices (`adoption_stories`), jornadas
(`events`, `event_animals`, `event_attendees`), métricas (`page_views`, `sponsorships`) y
moderación (`reports`, `audit_log`).

> **No hay tabla `notifications`.** Se descartó deliberadamente (FEATURE-010): para
> «avisar una sola vez» bastan marcas de fecha en la propia fila (`favorites.notified_at`,
> `saved_searches.last_sent_at`, `events.reminder_sent_at`…), que además hacen los crons
> idempotentes sin una tabla genérica que mantener.

### Agenda de disponibilidad: patrón + excepciones (FEATURE-009 + FEATURE-053)

La disponibilidad de visitas de una protectora se modela como **patrón semanal recurrente + excepciones por fecha**:

- `availability_slots` (FEATURE-009): patrón semanal (`weekday` 0–6, `start_time`/`end_time`, `slot_minutes`). Es la base.
- `availability_overrides` (FEATURE-053): excepción de un día concreto — `unique(shelter_id, date)`, `closed` (día cerrado/vacaciones) o `slots jsonb` `[{start,end,minutes}]` (horario especial que sustituye al patrón ese día), `note`. CHECKs: `slots` es array, `closed ⇒ slots vacío`, y `availability_override_slots_ok(slots)` valida `fin>inicio` y `minutes ∈ [15,120]` por franja.
- `availability_templates` (FEATURE-057): plantillas de horario reutilizables — `unique(shelter_id, nombre)`, `slots jsonb`. **Privadas de la protectora** (RLS: solo la dueña/admin, **sin lectura pública** a diferencia de overrides). CHECKs: `slots` array, `jsonb_array_length >= 1`, `availability_override_slots_ok(slots)`. Aplicar una plantilla = escribir sus `slots` como overrides especiales en los días elegidos.

**Resolución por fecha** (misma lógica en el cliente `src/lib/agenda.ts` y en el RPC): `closed` → sin huecos · `slots` → esos huecos · sin override → patrón semanal. El RPC `appointment_free_slots(shelter, days)` aplica las excepciones antes de generar huecos y resta las citas vivas. RLS de `availability_overrides` = espejo de `availability_slots` (la dueña escribe; público lee de verificadas). Capacidad = **1 cita por hueco** (exclusion constraint en `appointments`).

### Avisos de perdidos y sus pistas (FEATURE-012 + FEATURE-022 + FEATURE-024)

| Tabla | Qué es | Claves de diseño |
|-------|--------|------------------|
| `lost_found_posts` | Aviso de perdido/encontrado | `type lost/found`, `status open/resolved/archived`, `location geography(Point)` **redondeada a ~200 m por trigger antes de guardar**; `contact_phone` (opt-in, check de formato) y `allow_contact` (FEATURE-022); señas `breed/sex/size/color/has_collar/collar_description/has_microchip` y `occurred_on` (FEATURE-023); `last_activity_at` alimenta el cron de caducidad a 60 días. **Ya NO tiene `photo_url`**: la portada sale de `lost_found_media` (FEATURE-024) |
| `lost_found_sightings` | "He visto a este animal": pista de un vecino | `post_id → lost_found_posts` (`on delete cascade`), `seen_at` con check de no-futuro, `location` con **el mismo trigger de redondeo** que el aviso; trigger `after insert` que refresca `last_activity_at` del aviso |
| `lost_found_media` | Galería del aviso (FEATURE-024) | Espejo de `animal_media`: `post_id` (`on delete cascade`), `url`, `is_cover`, `sort_order`; **índice único parcial de una sola portada** por aviso. `lost_found_list` devuelve `cover_url` (portada) y el RPC `lost_found_media_list` la galería. La subconsulta de portada va blindada por un test que muerde (lección de BUG-006) |

### Casas de acogida (FEATURE-016 + FEATURE-029)

| Tabla | Qué es | Claves de diseño |
|-------|--------|------------------|
| `foster_homes` | Registro de acogedor | PK = `user_id → profiles` (`on delete cascade`); `location` **redondeada ~200 m por trigger**; `radius_km 1..200` (el radio lo declara el acogedor); `condiciones jsonb`; `consent_at` obligatorio. RLS: solo el dueño; las protectoras acceden únicamente por el RPC `foster_homes_nearby` (verificada + dentro del radio DEL ACOGEDOR, sin coordenadas ni email) |
| `foster_proposals` | Propuesta de acogida protectora → acogedor (FEATURE-029) | `shelter_id` (`cascade`), `foster_user_id → foster_homes` (`cascade`: la baja del acogedor arrastra sus propuestas — supresión real, ver DECISIONS), `animal_id` nullable (`set null`: el historial sobrevive al animal), `duracion ≤120`, `mensaje ≤1000`, `status enviada/aceptada/rechazada/finalizada`. **Índice único parcial** `(shelter_id, foster_user_id) where status in ('enviada','aceptada')`: el reenvío se bloquea en BD. RLS: leen protectora dueña y acogedor; actualiza solo la protectora dueña; insert solo protectora verificada con animal propio; delete solo admin. **Trigger `sync_animal_estado_acogida`** (IMPROVEMENT-026): `aceptada` → animal a `fostered`; dejar de estar aceptada o borrarse (baja del acogedor) → vuelta a `available` **solo si no queda otra `aceptada` viva** (relevo, FEATURE-030); solo toca `available↔fostered`. **Relevo** (FEATURE-030): columnas `relevo_pedido_at/motivo/fecha_limite` sobre la propuesta aceptada — el acogedor las escribe únicamente vía RPCs `pedir_relevo`/`cancelar_relevo` (security definer, doble guarda), sin ganar update sobre la tabla |

### Tablón de necesidades (FEATURE-031)

| Tabla | Qué es | Claves de diseño |
|-------|--------|------------------|
| `shelter_needs` | Petición de ayuda material de una protectora | `categoria comida/mantas_ropa/medicinas/transporte/otros`, `urgencia normal/urgente`, `status abierta/cubierta`. RLS: escribe solo la dueña de protectora **verificada**; el público (anon incluido) lee solo `abiertas` de verificadas; la dueña conserva su historial de cubiertas (reabrible). RPC `shelter_needs_nearby(lat,lng,radius)` para el tablón por zona: urgentes primero y después cercanía, usable por anon. El contacto «Puedo ayudar» va por handler (relay), no toca la tabla |

### Ofertas de donación de particulares (FEATURE-032)

| Tabla | Qué es | Claves de diseño |
|-------|--------|------------------|
| `donation_offers` | Oferta de material de un particular (comida, accesorios, mantas…) | Espejo de `foster_homes`: `location` **redondeada ~200 m por trigger**, `radius_km 1..200` (el radio lo declara el donante), `categoria comida/accesorios/mantas_ropa/juguetes/otros`, `status abierta/entregada/caducada`. RLS: solo el dueño (borrado real, cascade con la cuenta); las protectoras acceden únicamente por el RPC `donation_offers_nearby(p_shelter_id)` (doble guarda: caller dueño + verificada; sin coordenadas, `user_id` ni email). Caducidad: `renovada_at` **no manipulable** (trigger la fija a `now()`, exime `service_role`), el cron de avisos marca `caducada` a los 60 días y el RPC filtra por `renovada_at` como doble red; «Renovar» la reabre. Tope de 5 abiertas por usuario (trigger). El contacto va por handler (relay AL DONANTE), no toca la tabla |

**Redondeo de privacidad**: `public.round_lost_found_location()` hace snap a una rejilla de 0.002° (~200 m) en un `BEFORE INSERT/UPDATE`. La coordenada exacta **nunca llega a existir en BD**, así que no puede filtrarse por ninguna vía (ni un dump, ni un `select` con `service_role`). La misma función la reusan `lost_found_posts`, `lost_found_sightings`, `foster_homes` y `donation_offers`.

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

Al mismo patrón pertenece **`shelter_public_stats`** (FEATURE-028, migración
`20260717090000`, que también añade `shelters.cover_url` y `shelters.founded_year`):
devuelve los conteos agregados del perfil público — `adopciones` (todos los `status =
'adopted'`, **incluidos los despublicados** que la RLS pública no deja ver como filas) y
`disponibles` (publicados con `status = 'available'`) — solo si la protectora está
`verified`, es del caller o el caller es admin; si no, 0 filas. Lo consume
`/protectoras/[slug]` vía `supabase.rpc("shelter_public_stats", { p_shelter_id })`.

## Jornadas de adopción (FEATURE-062, migración `20260725100000`)

Eventos presenciales de captación que organiza una protectora. Tres tablas:

- **`events`** — la jornada: `shelter_id`, `title`, `description`, `starts_at`/`ends_at`
  (con `check (ends_at > starts_at)`), `location extensions.geography(point,4326)` **propia
  del evento** (una plaza/parque, NO la sede), `address`/`city`, `poster_url` (cartel,
  opcional), `capacity` (aforo informativo, nullable, `check > 0`), `status`
  (enum `event_status`: `draft`/`published`/`cancelled`/`finished`) y
  `check (status <> 'published' or location is not null)` — publicar exige ubicación.
- **`event_animals`** — animales que van (opcional): PK `(event_id, animal_id)`.
- **`event_attendees`** — asistencia confirmada (RSVP): PK `(event_id, user_id)`.

**RLS**: `events` la gestiona solo la **dueña de una protectora verificada** (insert/update/
delete); el público lee cualquier estado salvo `draft` de verificadas; admin todo.
`event_animals` hereda la visibilidad del evento y en escritura exige que el animal sea de la
**misma protectora**. `event_attendees`: cada usuario gestiona **su propia** fila y solo puede
confirmar a un evento `published` de verificada; la **dueña** del evento lee la lista completa;
un asistente NO ve a otro (tests en `src/test/rls/eventos.test.ts`).

Dos RPCs **SECURITY DEFINER** (recuentos exactos sin exponer PII de asistentes):
**`events_upcoming(p_lat, p_lng, p_radius_m)`** — jornadas `published` y futuras de
verificadas, con `lat`/`lng`, nombre de la protectora y recuentos de animales/asistentes;
si se pasan coordenadas filtra por radio (`st_dwithin`) y ordena por distancia. La consume
`/jornadas`. **`event_detail(p_id)`** — detalle de una jornada con `lat`/`lng` y recuento de
asistentes para la ficha y la edición; lleva una **guarda de visibilidad** que replica la RLS
de lectura (nunca devuelve un `draft` a quien no es la dueña/admin). Bucket de Storage
**`event-posters`** (público) para los carteles, con carpeta = `auth.uid()`.

**Avisos (FEATURE-063, migración `20260725160000`):** columnas de idempotencia
que escribe el cron con service role — `event_attendees.reminded_at`
(recordatorio 24 h enviado a ese asistente), `events.reminder_sent_at` (resumen
24 h a la protectora) y `events.zone_notified_at` (aviso de jornada cercana ya
emitido). El RPC **`event_zone_matches()`** (SECURITY DEFINER, solo `service_role`)
empareja jornadas publicadas y futuras aún no avisadas con las búsquedas
guardadas **activas** cuya zona (`filters.lat/lng/radio_km`) las cubre
(`st_dwithin`). Lo consume el cron `/api/cron/jornadas`.

**Resultado (FEATURE-064, migración `20260726100000`):** `events.adoptions_count`
y `events.attended_count` (int nullable, `check >= 0`) — la protectora los declara
al **finalizar** una jornada pasada (estado `finished`). Son agregados sin PII:
alimentan la tarjeta de estadísticas de la protectora y el social proof público
del perfil ("en nuestras jornadas, N animales encontraron familia"), que se lee
directamente de los eventos `finished` (público por RLS).

## Migraciones

SQL versionado en `supabase/migrations/` con la CLI de Supabase (`supabase migration new`, `supabase db push`). Nunca cambios manuales en el dashboard sin su migración correspondiente. Seed de demo en `supabase/seed.sql`.

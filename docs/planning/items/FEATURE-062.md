---
id: FEATURE-062
tipo: feature
titulo: Jornadas de adopción F1 — crear/publicar, listado+mapa público, ficha, RSVP y compartir
estado: desarrollo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-25
actualizado: 2026-07-25
---

# FEATURE-062 — Jornadas de adopción F1 (base)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Nueva capacidad: **jornadas de adopción** — eventos presenciales de captación que organiza una protectora (un sábado en una plaza, un parque o una tienda) llevando varios de sus animales para que la gente los conozca. La jornada vive en la plataforma: se crea desde el panel, se descubre en un **listado + mapa por proximidad**, tiene **ficha pública**, la gente **confirma asistencia (RSVP)** y **comparte** el evento.

El alcance se parte en tres items para respetar la cadencia "una pieza, se prueba, se libera":

- **FEATURE-062 (este) — F1:** modelo + crear/publicar desde el panel (formulario por secciones + cartel) + listado/mapa público + ficha + RSVP simple + compartir + moderación admin.
- **FEATURE-063 — F2:** recordatorio por email a asistentes, aviso a la protectora de nuevas confirmaciones y avisos de jornada cercana por zona.
- **FEATURE-064 — F3:** cierre de la jornada con métricas (nº de adopciones) que alimentan estadísticas e historias felices.

### Decisiones de producto (acordadas con el analista)

- **Ubicación propia del evento**, NO la sede de la protectora: una jornada ocurre en una plaza/parque. El evento tiene su propia `location` + dirección, geocodificada como en el wizard de alta.
- **Aforo informativo**, no estricto: `capacity` es un número orientativo; no hay lista de espera ni bloqueo de plazas en F1.
- **Jornada sin animales concretos permitida** (evento genérico de captación): vincular animales es opcional.
- **Cartel opcional**: la protectora puede subir una imagen de cartel; si no hay, la ficha usa el diseño por defecto.
- **Compartir**: Web Share API en móvil con copia de enlace como respaldo (mismo patrón que Perdidos/Historias).

## Contexto / impacto

Afecta a **protectoras** (organizan y difunden), **adoptantes/público** (descubren y asisten) y **admin** (modera). Hoy las protectoras difunden estas jornadas solo por redes sociales, sin descubrimiento por proximidad ni registro de interesados. Es un hueco real detectado como siguiente candidato tras cerrar la tanda de rediseño: reutiliza casi por completo infraestructura existente (mapa PostGIS, patrón listado/ficha de Perdidos, form patrón base, botón compartir), por lo que el coste marginal es bajo y el encaje con la misión (más adopciones) es directo.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- `docs/technical/DATA_MODEL.md` (protectoras `shelters` con `location`/`owner_id`/`status`, `animals`, patrón de RLS).
- Migración de referencia del modelo + RLS + RPC de listado: `supabase/migrations/20260711180000_feature012_perdidos_encontrados.sql` (tabla con `geography(point)`, índice GIST, trigger `set_updated_at`, políticas, `lost_found_list()`), y el nearby PostGIS `supabase/migrations/20260710110000_feature006_shelters_nearby_latlng.sql`.
- Patrón de compartir: [CompartirAvisoButton](../../../src/components/perdidos/CompartirAvisoButton.tsx) (Web Share API + portapapeles).
- Patrón listado/mapa y ficha a dos columnas: Perdidos y encontrados (FEATURE-025/026) — [perdidos-encontrados](../../../src/app/(public)/perdidos-encontrados/).
- Form **por secciones** (patrón base FEATURE-043) y geocoding de dirección del wizard de alta (skill `adoptia-backend`).
- Storage/subida de imagen comprimida en cliente ≤300 KB (`next/image`, patrón de fotos de aviso/animales).
- Skills: `adoptia-database` (migración, RLS, RPC, Storage), `adoptia-frontend` (Leaflet dynamic import, tokens, i18n, form por secciones), `adoptia-backend` (Route Handlers, geocoding), `adoptia-security` (RLS, validación), `adoptia-testing` (TDD, tests RLS).
- Sistema visual existente: `docs/technical/DESIGN.md` (no romper identidad — reutilizar tokens, tarjetas, `rounded-full`, paleta arena/primary).

### Seguridad

- **RLS nueva** sobre las tres tablas:
  - `events` — `select`: `status = 'published'` (público) **o** dueña de la protectora (`shelter_id` cuyo `owner_id = auth.uid()`) **o** `public.is_admin()`. `insert`/`update`/`delete`: solo dueña de la protectora o admin, con `with check` simétrico. Borradores (`draft`) nunca visibles al público.
  - `event_animals` — visibilidad y escritura heredadas del evento (dueña de la protectora del evento o admin escribe; público lee las de eventos `published`). Verificar además que el `animal_id` pertenece a la misma protectora del evento (check en escritura vía subconsulta o validación en API).
  - `event_attendees` — cada usuario gestiona **su propia** fila (`insert`/`delete`/`update` con `user_id = auth.uid()`); la **dueña** del evento puede leer la lista de asistentes (para preparar aforo); admin lee todo. Un asistente NO puede ver la fila de otro asistente.
- Solo protectoras **verificadas** publican (coherente con `shelters_nearby`): filtrar por `s.status = 'verified'` en el RPC de listado público y validar en `insert`/`update` que la protectora está verificada.
- Validación (Zod en cliente + `check` en BD): `ends_at > starts_at`; `title` no vacío; `capacity` nulo o `> 0`; `location` presente para publicar; URL de cartel del bucket propio.
- Datos personales: `event_attendees` liga usuario↔evento. La dueña ve **solo** que "N personas asistirán" y, como mucho, su nombre público — **no** email ni datos sensibles. Reflejar en `docs/meta/PRIVACY.md` al cerrar.
- Moderación admin: el admin puede cambiar el `status` (p. ej. a `cancelled`/oculto) reutilizando el patrón de moderación (FEATURE-011).

### Modelo de datos

Nueva migración `supabase/migrations/20260725xxxxxx_feature062_events.sql`:

```sql
create type public.event_status as enum ('draft', 'published', 'cancelled', 'finished');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location extensions.geography (point, 4326),   -- ubicación propia del evento
  address text,
  city text,
  poster_url text,                                -- cartel (opcional)
  capacity int,                                   -- aforo informativo, nullable
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (capacity is null or capacity > 0)
);
create index events_status_starts_idx on public.events (status, starts_at);
create index events_location_idx on public.events using gist (location);

create table public.event_animals (
  event_id uuid not null references public.events (id) on delete cascade,
  animal_id uuid not null references public.animals (id) on delete cascade,
  primary key (event_id, animal_id)
);

create table public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- trigger set_updated_at en events; enable RLS + policies (arriba) + grants
-- (anon: select; authenticated: select/insert/update/delete acotado por RLS).
```

- **RPC `events_list()`** (`security invoker`, `stable`), clon de `lost_found_list()`: devuelve eventos `published` **futuros** (`ends_at >= now()`) de protectoras verificadas, con `lat`/`lng` (`st_y`/`st_x`), nombre/slug de la protectora, recuento de animales y de asistentes, orden por `starts_at`. Para el mapa por proximidad, variante `events_nearby(lat, lng, radius_m)` con `st_dwithin` (patrón `shelters_nearby`). `grant execute` a `anon, authenticated`.
- **Bucket Storage `event-posters`** (público), políticas por carpeta = `shelter_id`/`owner`, clon del bucket `lost-found`.

### API

- **Sin endpoints nuevos** para el CRUD: acceso directo por supabase-js amparado por RLS (mismo patrón que Perdidos y ofertas de donación).
- **Geocoding**: reutilizar el Route Handler/servicio de geocodificación del wizard de alta para convertir la dirección del evento en `location` (o el buscador de direcciones OSM ya usado). Sin contrato nuevo si se reutiliza el existente; anotar en `API_CONTRACTS.md` que `events`/attendees son acceso directo.

### Frontend

Reutilizar el lenguaje visual existente (tokens, tarjetas, `rounded-full`, Reveal/hover del panel) — **no** introducir estilos nuevos.

- **Panel protectora — alta/edición** `panel/jornadas/nueva` y `panel/jornadas/[id]`: **formulario por secciones** (patrón base FEATURE-043): (1) Datos de la jornada (título, descripción, fecha/hora inicio-fin), (2) Ubicación (dirección con autocompletado + mini-mapa Leaflet `dynamic import`), (3) Animales que van (selector del catálogo propio, opcional), (4) Cartel (subida de imagen comprimida ≤300 KB), (5) Publicar/guardar borrador. Estados: borrador/publicada/cancelada.
- **Panel protectora — listado** `panel/jornadas`: rejilla de tarjetas de sus jornadas (próximas/pasadas/borradores) con acciones editar/cancelar y contador de asistentes.
- **Público — listado + mapa** `/jornadas`: clon del patrón de Perdidos (listado de tarjetas + mapa Leaflet con pines por proximidad, filtros básicos por especie/fecha). Estado vacío cuidado.
- **Público — ficha** `/jornadas/[id]`: dos columnas (patrón ficha de aviso): cartel/mapa + datos + animales que van (mini-tarjetas enlazando a su ficha) + **botón "Voy a ir" (RSVP)** para usuarios autenticados (login gate si anónimo) + **botón compartir** (componente `CompartirEventoButton`, reutilizando el patrón de `CompartirAvisoButton`).
- **Área del adoptante**: las jornadas a las que asistirá aparecen en su panel (`/mi-cuenta`), coherente con favoritos/alertas.
- Menú público: entrada "Jornadas" (coherente con IMPROVEMENT-033).
- i18n: nuevo namespace `jornadas` en `messages/es.json` (nada hardcodeado).

### Tareas TDD

1. **Migración + RLS** — tests RLS (`src/test/rls/`): dueña de la protectora crea/edita/borra sus eventos; otra protectora denegada; anónimo lee solo `published` de verificadas (no `draft`); adoptante hace/retira su RSVP pero no el de otro; dueña lee asistentes de su evento; asistente no lee asistentes ajenos; admin modera.
2. **RPC `events_list` / `events_nearby`** — test: solo `published` futuros de verificadas; `lat/lng`; recuentos; orden; radio (`st_dwithin`).
3. **Validación** (`src/lib/...` puro) — `ends_at > starts_at`, `capacity>0|null`, título requerido, publicar exige `location`.
4. **Form por secciones (panel)** — test: navegación entre secciones, guardar borrador vs publicar, vincular animales (opcional), subir cartel; errores por sección.
5. **Listado + mapa público** — test: tarjetas + pines, filtros, estado vacío.
6. **Ficha pública** — test: render de datos/animales/cartel; login gate del RSVP; alternar "Voy a ir"/"Ya no voy".
7. **`CompartirEventoButton`** — test: Web Share API cuando existe; portapapeles + confirmación como respaldo (clonar test de `CompartirAvisoButton`).
8. **Integración** — página de ficha compone datos+animales+asistentes; panel lista jornadas de la protectora.
9. i18n + `npx tsc --noEmit` + lint verde + cobertura sobre umbral.

### Dependencias

- Ninguna para empezar (usa `shelters`, `animals`, geocoding y Storage ya existentes). **FEATURE-063 (F2) y FEATURE-064 (F3) dependen de este.**

## Documentación a alinear (al cerrar — Hachiko)

- **Alinear con el `git diff` al cerrar:** `docs/technical/DATA_MODEL.md` (tablas `events`/`event_animals`/`event_attendees`, RPC), `docs/technical/API_CONTRACTS.md` (acceso directo + geocoding), `docs/technical/DECISIONS.md` (ubicación propia del evento, aforo informativo), `docs/meta/PRIVACY.md` (asistentes), catálogo de `PRODUCT_CONTEXT.md` (se regenera con `python scripts/render_planning.py`), CHANGELOG.
- **Manual de usuario (`docs/manual/`): actualizar SOLO cuando F1 esté implementada, probada y verde** — sección nueva para protectora (crear/publicar/gestionar jornadas) y para adoptante (descubrir en el mapa, confirmar asistencia, compartir). Capturas de pantalla como en las secciones ya documentadas.

## Criterios de aceptación / Casuística a cubrir

- [x] La protectora crea una jornada con formulario **por secciones**, guarda borrador y la publica; puede editar y cancelar.
- [x] Ubicación propia del evento (no la sede) con `MapPinPicker` y mini-mapa en la ficha; publicar exige ubicación válida (gating en UI + check de BD + `jornadaEsPublicable`).
- [x] Vincular animales del propio catálogo es opcional; jornada sin animales permitida.
- [x] Cartel opcional (subida comprimida vía `comprimirFoto`, bucket `event-posters`); ficha con 🐾 por defecto si no hay cartel.
- [x] Público ve listado + mapa solo de jornadas **publicadas futuras** de protectoras **verificadas** (RPC `events_upcoming`); borradores nunca visibles.
- [x] Ficha a dos columnas con datos, animales, RSVP (login gate para anónimo) y botón compartir (Web Share + portapapeles).
- [x] RSVP: el usuario confirma/retira asistencia; la dueña ve el recuento/lista de asistentes; un asistente no ve a otros.
- [x] Seguridad RLS: matriz permitido/denegado por rol para las tres tablas (`src/test/rls/eventos.test.ts`, 8/8; RPC `event_detail` no filtra borradores).
- [x] Estados vacíos (sin jornadas, sin animales, sin asistentes) y errores de guardado con feedback.
- [x] Identidad visual intacta (tokens/patrones existentes); textos en `messages/es.json`; `tsc` y lint limpios.
- [ ] Documentación y manual anotados como pendientes de alinear al cerrar (ver sección anterior) — **a cargo de Hachiko**.

## Estado de implementación (Bolt · 2026-07-25)

Rama `feature/FEATURE-062-jornadas-adopcion` (desde `main`), 5 commits. Verificación: unit + **199/199 RLS en DB limpio**, cobertura 80.9 % global / 96 % `src/lib`, `tsc` y lint sin errores. **Pendiente de despliegue:** migración `20260725100000_feature062_events.sql` (aplicada solo en local vía `db reset`; falta `supabase db push` a producción). Queda a cargo de **Scooby** (QA final) y **Hachiko** (alinear DATA_MODEL/API_CONTRACTS/DECISIONS/PRIVACY + CHANGELOG + manual cuando se cierre).

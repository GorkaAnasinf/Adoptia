---
id: FEATURE-022
tipo: feature
titulo: Avisos de perdidos — contacto sin exponer datos y avistamientos ciudadanos
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-15
actualizado: 2026-07-15
---

# FEATURE-022 — Avisos de perdidos: contacto sin exponer datos y avistamientos ciudadanos

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Hoy la sección de perdidos y encontrados (FEATURE-012) es un tablón de solo lectura: quien publica que ha perdido a su animal no puede recibir ni una pista, y quien lo ve por la calle no tiene ningún botón que pulsar. Este item cierra ese círculo con dos cosas:

1. **Contactar con el autor del aviso** sin que ninguna de las dos partes vea el correo de la otra: el mensaje viaja por la plataforma. El autor puede, si quiere, publicar un teléfono de contacto en el aviso.
2. **Avistamientos**: cualquiera con cuenta puede decir "he visto a este animal", marcando dónde y cuándo, con una nota y una foto opcional. Los avistamientos se pintan en el mapa de la ficha y avisan al dueño por correo.

## Contexto / impacto

Un animal perdido se recupera con pistas de vecinos en las primeras 72 h. Sin canal de vuelta, el aviso no sirve de nada y el usuario se va a los grupos de Facebook, que es exactamente lo que la sección venía a sustituir. Los avistamientos son además la señal de actividad que el cron de caducidad necesita: un aviso con pistas frescas no debe archivarse a los 60 días.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`lost_found_posts`, fase 3), [API_CONTRACTS](../../technical/API_CONTRACTS.md), [DECISIONS](../../technical/DECISIONS.md)
- Skills: `adoptia-database` (migración, RLS, PostGIS), `adoptia-security` (rate limit, minimización), `adoptia-backend` (Route Handlers, Resend), `adoptia-frontend` (Leaflet, i18n), `adoptia-testing`
- Precedentes vivos a reusar, no reinventar:
  - `POST /api/acogida/contactar` ([route.ts](../../../src/app/api/acogida/contactar/route.ts)) — relay por email + rate limit en memoria + `obtenerContactoAdoptante` con service_role.
  - `public.round_lost_found_location()` ([migración FEATURE-012](../../../supabase/migrations/20260711180000_feature012_perdidos_encontrados.sql)) — trigger genérico sobre `new.location`, reutilizable tal cual.
  - `MapPinPicker`, `comprimirFoto`, bucket `lost-found`.

### Seguridad

- **El redondeo de ~200 m se aplica también a los avistamientos.** Es la decisión 🔒 de FEATURE-012 y un pin exacto de avistamiento la rompería por la puerta de atrás (delataría dónde vive quien reporta, o la casa del propio animal). Mismo trigger, misma rejilla de 0.002°.
- **El correo no se expone en ninguna dirección.** El relay envía al autor el mensaje del interesado; el `Reply-To` lleva el correo del interesado, que lo cede conscientemente al escribir (aviso explícito en el formulario). El del autor no sale nunca de `auth.users`.
- **Teléfono opt-in.** `contact_phone` es nullable y solo se rellena si el autor lo teclea; junto al campo, aviso de la estafa del rescate ("tengo a tu perro, ingrésame X"). Validado por formato y, al ser público por definición, nunca se muestra a `anon` sin que el autor lo haya publicado — es él quien decide.
- **Nada de número de microchip.** Identifica al dueño en el registro autonómico: dato personal indirecto. Queda fuera de este item y de FEATURE-023 salvo como booleano.
- **Anti-spam:** ambos endpoints exigen sesión y rate-limitan por usuario (patrón en memoria de `/api/acogida/contactar`). Contacto: 5/hora. Avistamientos: 3/hora. Ambos rechazan avisos que no estén `open`.
- **RLS:** `lost_found_sightings` — lectura pública solo si el aviso padre es `open`/`resolved`; inserta solo el propio usuario; borra el autor del avistamiento, **el autor del aviso** (para barrer spam de su ficha) o admin.

### Modelo de datos

Migración `20260715xxxxxx_feature022_avisos_contacto_avistamientos.sql`:

```sql
-- 1. Contacto opt-in en el aviso
alter table public.lost_found_posts
  add column contact_phone text
    check (contact_phone is null or contact_phone ~ '^[+0-9][0-9 ]{5,19}$'),
  add column allow_contact boolean not null default true;

-- 2. Avistamientos
create table public.lost_found_sightings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lost_found_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  seen_at timestamptz not null,
  note text,
  photo_url text,
  location extensions.geography (point, 4326) not null,
  created_at timestamptz not null default now()
);
create index lost_found_sightings_post_idx on public.lost_found_sightings (post_id, seen_at desc);
create index lost_found_sightings_location_idx on public.lost_found_sightings using gist (location);
```

- Trigger `lost_found_sightings_round_location` → **reusa** `public.round_lost_found_location()` (before insert or update of location).
- Trigger nuevo `bump_lost_found_activity()` → after insert on sightings: `update lost_found_posts set last_activity_at = now() where id = new.post_id`. Efecto buscado: un aviso con pistas no lo archiva el cron de 60 días.
- Check de coherencia: `seen_at <= now()` y no anterior a 90 días (validado en API; el check de BD solo cubre el futuro).
- RPC `lost_found_sightings_list(p_post_id uuid)` → `security invoker`, devuelve `lat`/`lng` ya redondeados por el trigger, `seen_at`, `note`, `photo_url`, orden `seen_at desc`, límite 100. Sin `user_id`: quién reporta no es asunto público.
- Actualizar la tabla de `lost_found_posts` en DATA_MODEL.md y añadir la fila de `lost_found_sightings`.

### API

| Método | Ruta | Auth | Qué hace |
|--------|------|------|----------|
| POST | `/api/perdidos/[id]/contactar` | sesión | Body `{ mensaje: string 10..1000 }`. Valida aviso `open` y `allow_contact`. Envía email AL AUTOR (`plantillaContactoAviso`) con el mensaje y `Reply-To` del remitente. 401 / 404 / 409 (`allow_contact=false`) / 422 / 429 / 502. |
| POST | `/api/perdidos/[id]/avistamientos` | sesión | Body `{ lat, lng, seen_at, nota?, photo_url? }`. Valida aviso `open`. Inserta (BD redondea) y notifica al autor (`plantillaAvistamiento`) con enlace a la ficha. 401 / 404 / 409 / 422 / 429. |

- Ambos con `createAdminClient()` solo para resolver el contacto del autor (`obtenerContactoAdoptante`) — nunca devuelven ese contacto al llamante.
- Dos plantillas nuevas en `src/lib/email/templates.ts`.
- Cuota Resend (3k/mes): un aviso muy activo genera como mucho 3 correos/hora/reportante; aceptable. Si se queda corto, agrupar es follow-up, no este item.
- Documentar ambas en `API_CONTRACTS.md`.

### Frontend

- `NuevoAvisoForm`: campo teléfono opcional + texto de aviso de estafas + checkbox "permitir que me escriban por la plataforma" (default marcado → `allow_contact`).
- Ficha `/perdidos-encontrados/[id]`:
  - Bloque **"¿Lo has visto?"** con dos acciones: `ContactarAvisoDialog` (textarea + aviso de cesión del correo) y `NuevoAvistamientoForm` (`MapPinPicker` + fecha + nota + foto comprimida al bucket `lost-found`).
  - Teléfono del autor, si lo publicó, con el aviso de estafa a la vista.
  - **Timeline de avistamientos** (fecha, nota, foto) + sus pines en el mini-mapa, con icono distinto al del aviso.
  - Sin sesión: los botones llevan a login con `redirect` de vuelta a la ficha.
  - Aviso `resolved`/`archived`: sin acciones, timeline en solo lectura.
- Textos nuevos en `messages/es.json` bajo `perdidos.*`. Cero literales.
- Móvil primero: el vecino reporta desde la calle.

### Tareas TDD

1. **RLS avistamientos** (`src/test/rls/perdidos-avistamientos.test.ts`): anon lee los de un aviso `open`, no los de uno `archived`; el usuario solo inserta con su `user_id`; el autor del aviso borra un avistamiento ajeno de su ficha; un tercero no.
2. **Trigger de privacidad**: insertar un avistamiento con coordenada exacta → lo leído está en la rejilla de 0.002° (la exacta no existe en BD).
3. **Trigger de actividad + cron**: insertar avistamiento en un aviso con `last_activity_at` de hace 70 días → el cron de `/api/cron/avisos` ya no lo archiva.
4. **`POST /api/perdidos/[id]/contactar`**: 401 sin sesión; 422 mensaje corto; 404 aviso inexistente; 409 con `allow_contact=false` y con aviso `archived`; 429 a la 6ª en una hora; 200 → `enviarEmail` recibe el correo del autor y la respuesta **no** lo incluye.
5. **`POST /api/perdidos/[id]/avistamientos`**: 401; 422 (`seen_at` futuro, lat/lng fuera de rango); 409 si el aviso no está `open`; 429 a la 4ª; 201 → fila creada + email al autor.
6. **Componentes**: `NuevoAvistamientoForm` (no envía sin pin ni fecha) y ficha (sin sesión los botones llevan a login; `resolved` no ofrece acciones).
7. **E2E** (`e2e/perdidos.spec.ts`): usuario A publica perdido → usuario B reporta un avistamiento → aparece en el timeline y en el mini-mapa de la ficha → A lo ve.

### Dependencias

- FEATURE-012 (`hecho`), FEATURE-016 (`hecho` — de ahí sale el patrón de relay).

## Criterios de aceptación / Casuística a cubrir

Marcados `[x]` los cubiertos por test **ejecutado**; `[~]` los que tienen test escrito pero pendiente de ejecutar (ver Bloqueo abajo).

- [x] Desde la ficha de un aviso abierto, un usuario con cuenta escribe al autor sin ver su correo, y el autor recibe el mensaje con `Reply-To` del remitente.
- [x] El correo del autor no aparece en ninguna respuesta HTTP, ni en el RPC del listado, ni en el HTML de la ficha.
- [x] El autor puede publicar un teléfono opcional; si no lo hace, la ficha no muestra ningún teléfono. El campo se muestra siempre junto al aviso de la estafa del rescate.
- [x] El autor puede desactivar que le escriban (`allow_contact=false`) y el endpoint responde 409.
- [x] Un avistamiento exige cuenta, pin y fecha; la fecha no puede ser futura ni de hace más de 90 días.
- [~] La coordenada exacta de un avistamiento **nunca llega a existir en BD**: el trigger la redondea a ~200 m antes de guardar (mismo criterio que el aviso).
- [x] Los avistamientos se ven en el timeline y en el mini-mapa con icono propio, ordenados del más reciente al más antiguo.
- [~] Un avistamiento refresca `last_activity_at` del aviso: el cron de 60 días no lo archiva.
- [~] El autor del aviso puede borrar un avistamiento de su ficha (spam); un tercero no puede. *(La UI del borrado sí está probada; la política RLS que lo respalda, no.)*
- [x] Estado vacío: aviso abierto sin avistamientos muestra el bloque "¿Lo has visto?" y un mensaje claro, no una lista vacía.
- [x] Aviso `resolved` o `archived`: sin botones de contacto ni de avistamiento; el timeline existente se sigue leyendo si el aviso es público.
- [x] Sin sesión: los botones llevan a login y devuelven a la ficha tras entrar.
- [x] Rate limit: 5 contactos/hora y 3 avistamientos/hora por usuario → 429.
- [~] RGPD: quien reporta cede su nota y zona aproximada, no su identidad — el RPC público no devuelve `user_id`. Al borrar una cuenta, sus avistamientos caen por `on delete cascade`.

## Cierre (2026-07-15)

- **BD**: migración `20260715120000_feature022_avisos_contacto_avistamientos`. `lost_found_posts` gana `contact_phone` (opt-in, check `^[+0-9][0-9 ]{5,19}$`) y `allow_contact`. Nueva `lost_found_sightings` con dos triggers: el de redondeo **reusa `round_lost_found_location()` de FEATURE-012** (un pin exacto delataría a quien reporta) y `bump_lost_found_activity()` (`security definer`, porque el vecino no puede tocar el aviso ajeno bajo RLS) refresca `last_activity_at` y frena el cron de 60 días. RPC `lost_found_sightings_list` sin `user_id`.
- **API**: `POST /api/perdidos/[id]/contactar` (relay; `Reply-To` del remitente que cede el suyo, el del autor nunca sale de `auth.users`; 5/hora) y `POST /api/perdidos/[id]/avistamientos` (la pista se guarda aunque el email falle; 3/hora). Documentados en API_CONTRACTS.
- **Emails**: `enviarEmail` acepta `replyTo`; `templates.ts` gana `esc()` — primer texto libre de un desconocido que entra en el HTML de un correo — y dos plantillas.
- **UI**: bloque "¿Lo has visto?" en la ficha (contacto + avistamiento, solo con cuenta, solo en avisos abiertos, nunca al propio autor), teléfono con aviso de estafa, timeline con borrado por el autor, pines de avistamiento en el mini-mapa (`MiniMapa` acepta `extras` y se vuelve navegable). Alta con teléfono y checkbox de contacto.
- **Decisiones sobre la marcha**: (1) el `<input type="datetime-local">` va **sin `max`** — el bloqueo nativo del navegador corta el submit con un aviso sin traducir; validamos en cliente y en servidor. (2) La foto del avistamiento que no sube **corta el envío con aviso** en vez de mandar la pista sin ella en silencio (hallazgo de Scooby).
- **Tests**: 15 de API (8 de contacto + 7 de avistamientos), 29 de componentes de perdidos (form de avistamiento, diálogo de contacto, timeline, alta) y 12 de la ficha. Suite: **759 verdes** (venía de 746). + 10 RLS y 2 E2E escritos pero **sin ejecutar**.
- **⚠️ Bloqueo abierto — la migración NO se ha aplicado ni en local.** Docker estaba parado y se decidió seguir sin verificar. Antes de `supabase db push` a producción hace falta: `npx supabase start` → `supabase db reset` → `npm run test` (los 10 RLS de `perdidos-avistamientos` en verde) → `npx playwright test perdidos`. Los 5 criterios `[~]` dependen de eso.

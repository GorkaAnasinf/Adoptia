---
id: FEATURE-002
tipo: feature
titulo: Onboarding de protectoras y verificación por admin
estado: desarrollo
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-06
---

# FEATURE-002 — Onboarding de protectoras y verificación por admin

## Descripción

Una protectora recién registrada completa un asistente de 3 pasos (datos de entidad con CIF, ubicación geocodificada sobre mapa ajustable, perfil público con logo y descripción) y queda **pendiente de verificación**. Un admin revisa los datos y la verifica o rechaza; solo las verificadas son públicas. (Ref: P1, A1)

## Contexto / impacto

La verificación es la base de la confianza de la plataforma y evita fraudes. Sin protectoras verificadas no hay contenido público.

## Plan de desarrollo

> **Diseño acordado con el usuario (2026-07-06):** wizard de 3 pasos **centrado `max-w-2xl`, SIN imagen ni split** (a diferencia de login/registro). Misma escala de controles que auth: `Input` estándar, `Button size="lg"`, `gap-3`, tarjetas de selección `border-2 rounded-xl`, `font-heading` en títulos. Stepper horizontal arriba (número + etiqueta, activo en `primary`). Entrada **automática tras registro** como `shelter` → panel bloqueado hasta completar. **Verificación SIN documento adjunto** (admin valida con CIF + datos; no se añade `doc_url`). Editor de horarios **completo por día (L-D)**.

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`shelters`, enum `shelter_status`), [API_CONTRACTS](../../technical/API_CONTRACTS.md) (filas `geocode` y `verificar`), [DESIGN](../../technical/DESIGN.md) (tokens), prompts Stitch §2.1.
- [DECISIONS](../../technical/DECISIONS.md): **#6 🔒 Leaflet+Nominatim**, **#15 compresión imagen ≤300 KB cliente**, **#19 rol en middleware + RLS**, **#22 email por SMTP Gmail + plantillas HTML propias (NO Resend)**.
- Skills: `adoptia-frontend` (wizard, Leaflet, i18n), `adoptia-backend` (Route Handlers, geocoding, email), `adoptia-database` (migración, RLS, PostGIS, Storage), `adoptia-security`, `adoptia-testing`.

### ⚠️ Discrepancias detectadas (resueltas en este plan)

- **Email:** el enunciado original decía "Resend". **Se usa SMTP de Gmail + plantillas HTML propias** por la DECISIÓN #22 (Resend descartado: exige dominio verificado). Este item **introduce la primera infra de email de la app** (`src/lib/email/`), aún inexistente.
- **Hueco de seguridad en RLS (crítico):** la política `shelters_owner_update` del baseline permite al dueño actualizar **cualquier** columna, incluido `status` → una protectora podría auto-verificarse. Se cierra con **trigger BEFORE UPDATE** (RLS `with check` no puede comparar old/new).

### Seguridad

- **Trigger `shelters_protect_privileged_fields`** (BEFORE UPDATE): si cambia `status` o `verification_note` y **no** `is_admin()` → `raise exception`. La protectora edita el resto de su ficha con normalidad.
- **CIF y email de entidad únicos:** índices únicos parciales (`where cif is not null` / `where email is not null`) sobre `shelters`. Segundo alta con mismo CIF → error controlado.
- **Geocoding solo en servidor** (`/api/protectoras/geocode`, auth `shelter`): no exponer Nominatim desde cliente; respetar su política de uso (User-Agent propio, 1 req/s) y **cachear en BD** (`geocode_cache`) para no repetir llamadas.
- **Bucket Storage `logos`** (nuevo): lectura pública; escritura/borrado solo el dueño en su carpeta `{shelter_id}/…`. Validar tipo (`image/*`) y tamaño en cliente **y** en política de Storage. Compresión cliente ≤300 KB (Decisión #15).
- **Endpoint admin `verificar`:** el handler comprueba rol `admin` (defensa en profundidad sobre RLS) antes de mutar; motivo obligatorio al rechazar.
- **Gate de onboarding:** middleware ya redirige por rol (#19). El bloqueo "panel hasta completar alta" se resuelve en el **layout server de `(shelter)`** (evita recargar el middleware con una query extra por request).

### Modelo de datos

Nueva migración `supabase/migrations/<ts>_feature002_onboarding.sql`:

- `alter table shelters add column submitted_at timestamptz;` — null = borrador en curso (wizard sin terminar); con valor = enviada a revisión. Dirige el gate y el banner.
- `alter table shelters add column verification_note text;` — motivo de rechazo (para el email y el historial).
- `create unique index shelters_cif_key on shelters (cif) where cif is not null;`
- `create unique index shelters_email_key on shelters (lower(email)) where email is not null;`
- Trigger `shelters_protect_privileged_fields` + función `security definer`.
- Tabla `geocode_cache (query_norm text primary key, lat double precision, lng double precision, created_at timestamptz default now())`; RLS: sin acceso a `anon`; solo el service role / handler escribe y lee. Grants explícitos (Decisión #18).
- Bucket `logos` vía `insert into storage.buckets` + políticas `storage.objects` (public read; owner write/update/delete en `{shelter_id}/`).

`opening_hours` y `social_links` (jsonb) ya existen — sin cambios de columna, se define su **forma** en Zod:
- `opening_hours`: `{ [dia: 'lun'..'dom']: Array<{ open: 'HH:mm', close: 'HH:mm' }> }` (varias franjas por día).
- `social_links`: `{ instagram?, facebook?, x?, tiktok? }`.

### API

Documentar ambos en API_CONTRACTS al cerrar (Hachiko):

- **`POST /api/protectoras/geocode`** — auth `shelter`. Body `{ address, city, province, postal_code }`. Normaliza la query, consulta `geocode_cache`; si falla, llama Nominatim (User-Agent propio), cachea y devuelve `{ lat, lng, source: 'cache'|'nominatim' }`. Si Nominatim no encuentra nada → `200 { lat: null, lng: null }` (el cliente pide pin manual). Nunca 500 por dirección inexistente.
- **`POST /api/admin/protectoras/[id]/verificar`** — auth `admin`. Body `{ accion: 'verify'|'reject', motivo? }`. `verify` → `status='verified'`. `reject` → `status='suspended'` + `verification_note=motivo` (motivo obligatorio, si falta → 400). Envía email al gestor (SMTP Gmail, plantilla propia, español). Idempotente y con comprobación de rol server-side.

### Frontend

Referencia: prompts Stitch **§2.1**. Textos en `messages/es.json` (namespace `onboarding` + `admin`).

- **Ruta wizard:** `src/app/(shelter)/panel/alta/page.tsx` (cliente). Contenedor centrado `max-w-2xl`, stepper de 3 pasos, botones Atrás/Siguiente (`Button size="lg"`).
- **Gate:** `src/app/(shelter)/layout.tsx` (server) — si el `shelter` no tiene fila o `submitted_at is null` y no está ya en `/panel/alta` → `redirect('/panel/alta')`.
- **Paso 1 — Entidad:** nombre, CIF, email entidad, teléfono, web (opcional). Validación Zod por paso; aviso claro de CIF/email duplicado (error del insert).
- **Paso 2 — Ubicación:** dirección/ciudad/provincia/CP + botón "Localizar en el mapa" (llama al geocode). **Mapa Leaflet a ancho completo** (`dynamic import` sin SSR, Decisión #8) con **pin arrastrable**; si el geocode no encuentra → aviso + colocar pin a mano. Guarda `lat/lng` del pin final.
- **Paso 3 — Perfil público:** logo (compresión cliente ≤300 KB + preview), descripción (textarea), **editor de horarios por día L-D con franjas**, toggles voluntarios/acogida, redes (opcional).
- **Persistencia de borrador:** cada avance de paso hace `upsert` del `shelter` (sin `submitted_at`) → si abandona y vuelve, el wizard recupera lo guardado.
- **Cierre:** al completar → set `submitted_at=now()` (status sigue `pending`) → pantalla "En revisión".
- **Banner de estado en el panel:** `pending` → banner ámbar "en revisión"; `suspended` → banner rojo con `verification_note`, mantiene acceso a sus datos, sin visibilidad pública.
- **Vista admin:** `src/app/(admin)/admin/protectoras/page.tsx` — cola de pendientes (nombre, CIF, ciudad, fecha) + acciones Verificar / Rechazar (modal con motivo obligatorio en rechazo). Layout admin mínimo si no existe.
- **Componentes reutilizables nuevos:** `Stepper`, `MapPinPicker` (Leaflet), `OpeningHoursEditor`, `LogoUploader`.

### Tareas TDD

1. ✅ **Schemas Zod del wizard** — test (CIF español válido/ inválido, CP 5 dígitos, teléfono ES, `opening_hours`/`social_links` bien formados) → `src/lib/schemas/shelter.ts`.
2. ✅ **Migración + tests de RLS** (contra stack local, Decisión #17): dueño **no** puede cambiar `status` (trigger lo bloquea); admin **sí**; segundo shelter con mismo CIF/email falla; `geocode_cache` no accesible a `anon`; bucket `logos` solo escribe el dueño.
3. ✅ **Endpoint geocode** — test: dirección → `lat/lng` persistidos en `geocode_cache`; segunda llamada misma dirección responde `source:'cache'` sin tocar Nominatim (mock); dirección inexistente → `{lat:null,lng:null}` 200.
4. ✅ **Gate de onboarding** — test del layout `(shelter)`: `submitted_at` null → redirige a `/panel/alta`; con valor → deja pasar. Shelter `pending`/borrador NO aparece en `shelters_nearby` / listados públicos.
5. **Wizard + persistencia de borrador** — test: avanzar de paso hace upsert; recargar recupera datos; completar setea `submitted_at` y muestra "En revisión".
6. **`OpeningHoursEditor`** — test: añadir/eliminar franjas por día, validación open<close, serializa a `opening_hours` jsonb.
7. **`LogoUploader` + compresión** — test util: imagen >300 KB se comprime a ≤300 KB; rechaza no-imagen; sube a `logos/{shelter_id}/`.
8. **Infra email** (`src/lib/email/`) — test: `sendMail` usa transporte SMTP configurado por env (mock nodemailer); plantillas `verificada`/`rechazada` renderizan español con datos.
9. **Endpoint verificar** — test: solo `admin` (otro rol → 403); `verify` → `status=verified` y aparece en público; `reject` sin motivo → 400; `reject` con motivo → `suspended` + `verification_note` + pierde visibilidad; ambos disparan email (mock).
10. **E2E Playwright** — registro protectora → wizard 3 pasos → "En revisión" → admin verifica → perfil visible públicamente.

### Dependencias

- **FEATURE-001** (registro/login) — `hecho`.
- **Paquetes npm a añadir:** `leaflet` + `react-leaflet` + `@types/leaflet`; `browser-image-compression`; `nodemailer` + `@types/nodemailer`.
- **Env nuevas:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (Gmail app password). En `.env.example` y Vercel.

## Criterios de aceptación / Casuística a cubrir

- [ ] Wizard de 3 pasos con validación por paso y **estado guardado si se abandona a medias** (borrador recuperable).
- [ ] Entrada automática al wizard tras registrarse como protectora; panel bloqueado hasta completar el alta.
- [ ] Dirección geocodificada con **pin ajustable** manualmente (Nominatim puede fallar ±100 m).
- [ ] Geocoding fallido (dirección no encontrada): mensaje claro + introducción manual del pin; nunca error 500.
- [ ] Segunda alta con la misma dirección reutiliza la **caché** (no vuelve a llamar a Nominatim).
- [ ] CIF y email de entidad **únicos** — segundo alta con mismo CIF/email se bloquea con aviso claro.
- [ ] Logo comprimido en cliente ≤300 KB; se rechaza archivo que no sea imagen; solo el dueño escribe en su carpeta de Storage.
- [ ] Editor de horarios por día (L-D) con múltiples franjas, validando `apertura < cierre`.
- [ ] Protectora `pending`/borrador **NO** visible en mapa/listados; ve banner "en revisión" en su panel.
- [ ] **Seguridad:** la protectora NO puede cambiar su propio `status` (trigger lo impide aunque toque la API directa).
- [ ] Verificar/rechazar **solo desde admin** (rol comprobado en handler y RLS); ambos envían email en español al gestor.
- [ ] Rechazo exige motivo; se guarda en `verification_note` y se muestra en el banner rojo de la protectora.
- [ ] Protectora `suspended` pierde visibilidad pública inmediatamente pero conserva acceso a sus datos.

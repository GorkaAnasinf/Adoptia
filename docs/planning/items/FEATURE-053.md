---
id: FEATURE-053
tipo: feature
titulo: Agenda de la protectora F1 — calendario mensual con excepciones por día
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-053 — Agenda de la protectora F1 (calendario mensual + excepciones)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Primera fase del rediseño de la Agenda de la protectora (`panel/agenda`) con el wireframe Stitch `assets/wireframes/protectorasagenda/`. Hoy la Agenda es una lista + formulario de franjas semanales ([DisponibilidadEditor](../../../src/components/citas/DisponibilidadEditor.tsx)). Se sustituye por un **calendario mensual** donde la protectora configura la disponibilidad día a día, con soporte para **cerrar días concretos** (vacaciones/festivos) y **horarios especiales por fecha**, sin perder el patrón semanal recurrente.

El faseado completo (aprobado con el analista) se parte en tres items para respetar la cadencia "pantalla a pantalla, liberación por cada una":

- **FEATURE-053 (este) — F1:** datos + excepciones por día + edición en vista mensual.
- **FEATURE-054 — F2:** utilidades masivas (pintar días, rango de cierre, festivos, plantillas, copiar/pegar).
- **FEATURE-055 — F3:** vistas anual (heatmap) y diaria (timeline de citas), con el segmented control de 3 modos.

### Modelo aprobado — Recurrente + excepciones (enfoque A)

- `availability_slots` (patrón semanal) **queda igual** = base.
- Nueva tabla `availability_overrides` para días concretos: `closed` (cerrado/vacaciones) o `slots` jsonb (horario especial que sustituye al patrón ese día).
- Resolución por fecha: `closed` → sin huecos · `slots` → esos huecos · sin override → patrón semanal.
- Capacidad = **1 cita por hueco** (constraint actual intacto). La "capacidad" del wireframe es un contador informativo (F3).

## Contexto / impacto

Afecta a las **protectoras**. El editor actual solo permite un patrón semanal repetitivo: no hay forma de cerrar un día concreto ni fijar un horario especial, así que la agenda no refleja festivos, vacaciones ni cierres, y los adoptantes podrían reservar huecos inexistentes. F1 cierra ese hueco funcional con el mínimo cambio de modelo.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- `docs/technical/DATA_MODEL.md` (fase 2: `availability_slots`, `appointments`).
- Migración existente `supabase/migrations/20260711100000_feature009_citas.sql` (tabla, RLS y RPC `appointment_free_slots`).
- Skills: `adoptia-database` (migraciones, RLS, RPC), `adoptia-frontend` (calendario, tokens, i18n), `adoptia-testing` (TDD, tests RLS), `adoptia-security`.
- Wireframe: `assets/wireframes/protectorasagenda/` (screen.png + DESIGN.md); paleta ya en tokens del proyecto.
- Patrón de referencia UI: [CalendarioCitas](../../../src/components/citas/CalendarioCitas.tsx) y [panel/citas/page.tsx](../../../src/app/(shelter)/panel/citas/page.tsx) (cálculo de días en `Europe/Madrid`).

### Seguridad

- **RLS nueva** sobre `availability_overrides`, clon de `availability_slots`:
  - `select`: público si la protectora está `verified` **o** es la dueña (`owner_id = auth.uid()`), o admin.
  - `all` (write): solo la dueña o admin, con `with check` simétrico.
- Tests RLS obligatorios: dueña escribe/lee; otra protectora NO escribe; anónimo lee solo de verificadas; adoptante no escribe.
- El RPC `appointment_free_slots` sigue `security definer` y **no expone citas ajenas** (solo devuelve huecos libres); no cambia esa superficie.
- Validación de forma de `slots` (Zod en cliente + `check` básico en BD): array de `{start,end,minutes}`, `end>start`, `minutes ∈ [15,120]`, sin solapes.
- Sin datos personales nuevos → sin implicaciones RGPD.

### Modelo de datos

Nueva migración `supabase/migrations/20260722xxxxxx_feature053_availability_overrides.sql`:

```sql
create table public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  date date not null,
  closed boolean not null default false,
  slots jsonb not null default '[]'::jsonb,   -- [{start,end,minutes}] si no closed
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shelter_id, date),
  check (not closed or slots = '[]'::jsonb)     -- cerrado ⇒ sin franjas
);
create index availability_overrides_shelter_date_idx on public.availability_overrides (shelter_id, date);
-- trigger set_updated_at + enable RLS + policies (clon de availability_slots) + grants.
```

**Reescritura del RPC** `appointment_free_slots(p_shelter_id, p_days)`: por cada día del rango, resolver la fuente de franjas — si hay override `closed` → saltar el día; si hay override con `slots` → generar huecos desde ese jsonb; si no hay override → patrón semanal `availability_slots` (lógica actual). Después, restar citas vivas (sin cambios). Interpretación horaria en `Europe/Madrid`. Mantener firma y `grant execute` a `anon, authenticated`.

### API

- **Sin endpoints nuevos.** El CRUD de `availability_overrides` va **directo por supabase-js amparado por RLS** (mismo patrón que el CRUD de franjas actual y el de ofertas de donación). Los batch (rango/festivos) llegan en F2.
- `API_CONTRACTS.md`: sin cambios (nota de que overrides es acceso directo, como `availability_slots`).

### Frontend

Sustituir el contenido de `panel/agenda`:

- **`panel/agenda/page.tsx`** (server): carga franjas semanales + overrides del mes visible + recuento de citas por día del mes; pasa todo a `AgendaCliente`.
- **`AgendaCliente.tsx`** (client, orquestador): estado de mes/día seleccionado; en F1 solo renderiza la vista mensual (el segmented control de 3 modos entra en F3). Layout `lg:grid-cols-[1fr_20rem]` como en citas.
- **`CalendarioMensual.tsx`**: rejilla del mes (Lun–Dom), navegación ‹ ›, estado por día (patrón/override franjas = "disponible", `closed` = "cerrado", días con citas = punto), día seleccionado y "hoy" resaltados. Leyenda del wireframe.
- **`PanelDiaEditor.tsx`** (panel derecho del wireframe): del día seleccionado —
  - Toggle **"Cerrar este día"** → upsert override `closed=true`.
  - **Franjas horarias** (añadir/editar/borrar) → guardar sin "repetir" = upsert override `slots`.
  - Checkbox **"Repetir semanalmente"** → escribe/actualiza `availability_slots` de ese `weekday` y **elimina** el override de la fecha (vuelve al patrón).
  - Botón **Guardar disponibilidad** + **Resetear** (borra el override del día).
- **`resolverDiaAgenda(weekly, override)`** en `src/lib/agenda.ts`: función pura que devuelve el estado del día (`{tipo:'patron'|'especial'|'cerrado', franjas}`) — reutilizable por calendario y editor.
- i18n: nuevas claves en `messages/es.json` (namespace `citas` o nuevo `agenda`).

### Tareas TDD

1. **Migración + RLS** — test RLS (`src/test/rls/`): dueña lee/escribe overrides; otra protectora denegada; anónimo lee solo de verificadas; adoptante no escribe.
2. **RPC** — test de `appointment_free_slots` con overrides: día `closed` → 0 huecos; override `slots` → esos huecos; sin override → patrón semanal; cita viva resta hueco.
3. **`resolverDiaAgenda`** — unit test de la función pura (patrón / especial / cerrado / prioridad override sobre patrón).
4. **`CalendarioMensual`** — test: estados por día (disponible/cerrado/con citas), navegación de mes, selección de día.
5. **`PanelDiaEditor` — cerrar día** — test: toggle → upsert override `closed`.
6. **`PanelDiaEditor` — horario especial** — test: guardar franjas sin repetir → upsert override `slots` (validación de solapes/rango).
7. **`PanelDiaEditor` — repetir semanalmente** — test: escribe `availability_slots` del weekday y limpia el override de la fecha.
8. **`AgendaCliente` + `page.tsx`** — test de integración: carga franjas+overrides+citas y compone la vista mensual; estado vacío (sin franjas).
9. i18n + limpieza de `DisponibilidadEditor` (retirar o dejar como interno si algo lo reutiliza) + `npx tsc --noEmit` + lint verde.

### Dependencias

- Ninguna (FEATURE-009 citas ya `hecho`). F2 (FEATURE-054) y F3 (FEATURE-055) dependen de este.

## Criterios de aceptación / Casuística a cubrir

- [ ] Cerrar un día concreto: no genera huecos y el calendario lo marca "cerrado".
- [ ] Horario especial por fecha: sustituye al patrón semanal ese día (huecos del override).
- [ ] "Repetir semanalmente": el cambio pasa al patrón (`availability_slots`) y desaparece el override de la fecha.
- [ ] Resetear día: elimina el override y el día vuelve al patrón semanal.
- [ ] El RPC `appointment_free_slots` respeta overrides (cerrado sin huecos; especial sustituye patrón; citas vivas restan).
- [ ] Vista mensual: estado correcto por día (disponible / cerrado / con citas), navegación de mes y "hoy".
- [ ] Seguridad RLS: solo la dueña escribe overrides; público solo lee de verificadas; tests permitido/denegado.
- [ ] Validación: franjas con `end>start`, `minutes ∈ [15,120]`, sin solapes; rango/fecha inválidos rechazados.
- [ ] Estados vacíos (sin franjas, sin citas) y errores de guardado con feedback.
- [ ] Textos en `messages/es.json` (nada hardcodeado); imágenes/íconos según patrón; `tsc` y lint limpios.

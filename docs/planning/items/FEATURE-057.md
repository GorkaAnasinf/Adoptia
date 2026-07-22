---
id: FEATURE-057
tipo: feature
titulo: Agenda de la protectora F2c — plantillas de horario
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-057 — Agenda de la protectora F2c (plantillas de horario)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Última utilidad masiva de la Agenda (ver [FEATURE-053](FEATURE-053.md), [FEATURE-054](FEATURE-054.md), [FEATURE-056](FEATURE-056.md)). Permite **guardar horarios reutilizables** («Mañanas L-V», «Fines de semana») y **aplicarlos** a los días que la protectora seleccione.

### Decisión tomada (con el analista)

- **Persistencia en tabla `availability_templates`** (nueva, con RLS de la dueña), no en `localStorage`: las plantillas sobreviven entre dispositivos y sesiones.

## Contexto / impacto

Afecta a las **protectoras**. Evita reescribir el mismo horario una y otra vez; con la selección múltiple de F2a, aplicar una plantilla a muchos días es un gesto.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [FEATURE-053](FEATURE-053.md) (migración `20260722100000_feature053_availability_overrides.sql`: patrón de tabla + RLS + `availability_override_slots_ok`), [FEATURE-054](FEATURE-054.md)/[FEATURE-056](FEATURE-056.md) (`AgendaCliente`, `ejecutarBatch`, `PanelDiaEditor`).
- Skills: `adoptia-database` (migración, RLS, CHECK), `adoptia-security` (RLS), `adoptia-testing`, `adoptia-frontend`.
- `docs/technical/DATA_MODEL.md` (sección «Agenda de disponibilidad»).

### Seguridad

- **Tabla nueva `availability_templates` con RLS**. A diferencia de `availability_overrides`, las plantillas son **internas de la protectora** (no información pública): la política de lectura es **solo la dueña o admin** (no hay lectura pública de verificadas).
  - `select`/`all`: `shelter.owner_id = auth.uid()` o `is_admin()`, con `with check` simétrico.
- Tests RLS obligatorios: la dueña hace CRUD; otra protectora NO lee ni escribe; anónimo no lee.
- Validación: `plantillaSchema` (Zod compartido) — nombre 1–60, al menos una franja válida; en BD, CHECK `availability_override_slots_ok(slots)` (reutilizado) + `jsonb_array_length(slots) >= 1`.
- Sin datos personales → sin RGPD.

### Modelo de datos

Nueva migración `supabase/migrations/20260722140000_feature057_availability_templates.sql`:

```sql
create table public.availability_templates (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  nombre text not null,
  slots jsonb not null default '[]'::jsonb, -- [{start,end,minutes}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shelter_id, nombre),
  check (jsonb_typeof(slots) = 'array'),
  check (jsonb_array_length(slots) >= 1),
  check (public.availability_override_slots_ok(slots))
);
create index availability_templates_shelter_idx on public.availability_templates (shelter_id);
-- trigger set_updated_at + enable RLS + policy (solo dueña/admin) + grants (sin anon).
```

### API

- **Sin endpoints.** CRUD de plantillas por supabase-js/RLS (guardar/listar/borrar); aplicar = el mismo `upsert` de array de F2a sobre `availability_overrides`. `API_CONTRACTS.md`: nota de que `availability_templates` es acceso directo (privado de la dueña).

### Frontend

- **`src/lib/schemas/agenda.ts`** — añadir `plantillaSchema` (`nombre`, `slots`).
- **`PanelDiaEditor`** — botón **«Guardar como plantilla»** cuando hay franjas (no cerrado): pide nombre y emite `{nombre, slots}` al padre.
- **`PlantillasPicker.tsx`** — en la barra de selección: lista de plantillas (aplicar a la selección) y borrar cada una. Estado vacío amable si no hay plantillas.
- **`AgendaCliente`**:
  - `plantillas` en estado (cargadas del server).
  - `guardarPlantilla({nombre, slots})` → insert (supabase-js), refresca.
  - `aplicarPlantilla(plantilla)` → `ejecutarBatch` con override especial (`slots` de la plantilla) sobre los días seleccionados.
  - `borrarPlantilla(id)` → delete, refresca.
- **`panel/agenda/page.tsx`** — carga las plantillas de la protectora y las pasa a `AgendaCliente`.
- i18n: claves en el namespace `agenda`.

### Tareas TDD

1. **Migración + RLS** — test RLS: la dueña hace CRUD de plantillas; otra protectora denegada (lee 0 / no escribe); anónimo no lee. CHECK rechaza plantilla sin franjas.
2. **`plantillaSchema`** — test: nombre 1–60, ≥1 franja, franjas válidas; rechaza nombre vacío / sin franjas.
3. **`PanelDiaEditor` — guardar como plantilla** — test: con franjas, «Guardar como plantilla» emite `{nombre, slots}`.
4. **`PlantillasPicker`** — test: lista las plantillas, aplicar invoca el callback con la plantilla, borrar invoca el suyo; estado vacío sin plantillas.
5. **`AgendaCliente` — aplicar plantilla a selección** — test: `upsert` de overrides especiales con los `slots` de la plantilla en los días seleccionados.
6. **`AgendaCliente` — guardar/borrar plantilla** — test: insert y delete en `availability_templates`.
7. **`page.tsx`** — test de integración: carga plantillas y las pasa al cliente.
8. i18n + estados vacíos + `tsc`/lint/coverage verdes.

### Dependencias

- [FEATURE-053](FEATURE-053.md), [FEATURE-054](FEATURE-054.md) `hecho`. ✅ (usa `availability_override_slots_ok` y el batch).

## Criterios de aceptación / Casuística a cubrir

- [ ] Guardar una plantilla con nombre y franjas (desde el editor de día).
- [ ] Listar las plantillas de la protectora; estado vacío si no hay.
- [ ] Aplicar una plantilla a la selección: cada día recibe el horario de la plantilla.
- [ ] Borrar una plantilla.
- [ ] Validación: nombre 1–60, al menos una franja válida; nombre duplicado se rechaza (unique).
- [ ] Seguridad RLS: solo la dueña ve/edita sus plantillas; otra protectora y anónimo denegados; tests permitido/denegado.
- [ ] La tabla NO es de lectura pública (a diferencia de overrides).
- [ ] Error de guardado/aplicación con feedback; textos en `messages/es.json`; `tsc`/lint limpios.

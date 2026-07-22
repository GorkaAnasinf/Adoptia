---
id: FEATURE-055
tipo: feature
titulo: Agenda de la protectora F3 — vistas anual (heatmap) y diaria (timeline)
estado: desarrollo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-055 — Agenda de la protectora F3 (vistas anual y diaria)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Cierra el rediseño de la Agenda (ver [FEATURE-053](FEATURE-053.md)…[FEATURE-057](FEATURE-057.md)). Añade el **segmented control de 3 modos** sobre `panel/agenda`:

- **Mensual** (de F1): edición de disponibilidad (calendario + editor de día). Es el modo por defecto.
- **Anual** (visor): 12 mini-meses tipo **heatmap** con el estado de cada día (configurado / cerrado / con citas); click en un día salta a la vista mensual en esa fecha.
- **Diaria** (visor): **timeline de las citas** del día seleccionado con hora, animal, adoptante y estado.

Incorpora también las **tarjetas de resumen** del wireframe: capacidad (huecos libres), citas pendientes hoy y próxima disponibilidad.

### Decisiones tomadas (con el analista)

- **Vista diaria con detalle de cita** (hora, animal, adoptante, estado). El nombre del adoptante se resuelve server-side con el admin client acotado, igual que en el panel de Citas.
- **Tarjetas de resumen con datos reales**: capacidad y próxima disponibilidad salen del RPC `appointment_free_slots` (ya existente); citas pendientes hoy del recuento de `appointments`.

## Contexto / impacto

Afecta a las **protectoras**. Cierra la pantalla dando la panorámica anual y el detalle diario para «ver la agenda cuando hay citas», además de la edición mensual de F1. Todo en una sola pantalla, coherente con el wireframe.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [FEATURE-053](FEATURE-053.md) (`AgendaCliente`, `CalendarioMensual`, `resolverDiaAgenda`), `src/app/(shelter)/panel/citas/page.tsx` (patrón de carga de citas con detalle + nombres vía admin), `src/components/citas/CalendarioCitas.tsx`.
- `src/components/ui/SegmentedControl.tsx` (reutilizable), migración de FEATURE-009 (RPC `appointment_free_slots`).
- Skills: `adoptia-frontend`, `adoptia-testing`, `adoptia-security` (bypass admin acotado).
- Wireframe: `assets/wireframes/protectorasagenda/`.

### Seguridad

- **Sin tabla ni RLS nuevas.** La vista diaria muestra el **nombre del adoptante**: se resuelve server-side con `createAdminClient()` **acotado a los ids de las citas de la protectora** (mismo patrón ya aprobado en `panel/citas/page.tsx`); nunca se expone el contacto (email/teléfono). El adoptante ya es visible para la protectora tras aprobar su solicitud → sin nueva superficie RGPD.
- El RPC `appointment_free_slots` es `security definer` y solo devuelve horas libres (no citas ajenas).

### Modelo de datos

- **Sin cambios.**

### API

- **Sin endpoints nuevos.** Se usa el RPC `appointment_free_slots` (ya existente) desde el Server Component.

### Frontend

- **`SegmentedControl`** (reutilizado) en `AgendaCliente`: estado `vista: "mensual" | "anual" | "diaria"` (defecto `mensual`). En anual/diaria se ocultan las utilidades de edición.
- **`VistaAnual.tsx`** — 12 mini-meses (reutiliza `celdasMes`/`fechaISO` y `estadoDe`); cada día coloreado por estado; click en un día → `onIrADia(iso)` (cambia a mensual y selecciona la fecha).
- **`VistaDiaria.tsx`** — timeline de las citas del día seleccionado: hora (Europe/Madrid), nombre del animal, adoptante, estado (chips reutilizando las claves `estado*` de `citas`). Estado vacío si no hay citas ese día; aviso si no hay día elegido.
- **`ResumenAgenda.tsx`** — 3 tarjetas: **capacidad** (nº de huecos libres próximos), **citas pendientes hoy**, **próxima disponibilidad** (primer hueco libre, formateado «Hoy/Mañana HH:MM»). Muestra «—» sin datos.
- **`panel/agenda/page.tsx`** — además de lo actual: carga las **citas del año con detalle** (`adoption_requests → animals`, portada) y los **nombres de adoptante** vía admin acotado; llama al RPC `appointment_free_slots`; deriva `citasPorDia` de esas citas. Pasa `citasDetalle`, `huecos` y el resumen a `AgendaCliente`.
- i18n: claves nuevas en `agenda` (etiquetas de las vistas y tarjetas; reutiliza `estado*` de `citas`).

### Tareas TDD

1. **`AgendaCliente` — segmented control** — test: por defecto muestra mensual (editor visible); cambiar a Anual muestra el heatmap; a Diaria muestra el timeline; en anual/diaria no aparecen las utilidades de edición.
2. **`VistaAnual`** — test: 12 meses; un día cerrado se marca `cerrado`, uno con citas `con-citas`; click en un día invoca `onIrADia` con su ISO.
3. **`VistaDiaria`** — test: lista las citas del día con hora/animal/adoptante/estado; estado vacío sin citas; aviso sin día seleccionado.
4. **`ResumenAgenda`** — test: pinta capacidad, citas pendientes y próxima disponibilidad; «—» cuando no hay huecos.
5. **`page.tsx`** — test de integración: carga citas con detalle + huecos (RPC mockeado) y compone resumen + vistas; caso sin citas.
6. i18n + estados vacíos + `tsc`/lint/coverage verdes.

### Dependencias

- [FEATURE-053](FEATURE-053.md) `hecho` (base de la agenda). Las demás fases (054/056/057) no son bloqueantes pero conviven en la misma rama.

## Criterios de aceptación / Casuística a cubrir

- [ ] Segmented control alterna mensual / anual / diaria sin recargar; defecto mensual.
- [ ] Vista anual: heatmap de 12 meses con estado por día; click en un día salta a mensual en esa fecha.
- [ ] Vista diaria: timeline de las citas del día (hora, animal, adoptante, estado); estado vacío sin citas; aviso sin día elegido.
- [ ] Tarjetas de resumen con datos reales (capacidad = huecos, citas pendientes hoy, próxima disponibilidad); «—» sin datos.
- [ ] En anual/diaria no se muestran las utilidades de edición (selección/rango/festivos/plantillas).
- [ ] Seguridad: el nombre del adoptante se resuelve con admin acotado server-side; sin exponer contacto; RPC sin citas ajenas.
- [ ] Rendimiento: la vista anual no dispara N consultas (una carga agregada; el estado se calcula en cliente).
- [ ] Textos en `messages/es.json`; `tsc` y lint limpios.

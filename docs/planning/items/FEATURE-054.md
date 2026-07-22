---
id: FEATURE-054
tipo: feature
titulo: Agenda de la protectora F2a — pintar días y cerrar rangos (batch)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-054 — Agenda de la protectora F2a (pintar días + rango de cierre)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Segunda fase del rediseño de la Agenda (ver [FEATURE-053](FEATURE-053.md) para modelo y decisiones), **primera mitad de las utilidades masivas (F2a)**. Sobre el calendario mensual y la tabla `availability_overrides` de F1, añade las dos utilidades de alta masiva más usadas:

1. **Pintar días** — un modo de selección múltiple: la protectora marca varios días (click / click-y-arrastrar-mentalmente por clicks) y luego, desde una barra de acción, **cierra** o **aplica una franja** a todos de golpe.
2. **Rango de cierre / vacaciones** — un diálogo con fecha desde/hasta + nota que **cierra todos los días del rango** en un gesto (p. ej. «Cerrado del 1 al 15 de agosto — Vacaciones»).

La segunda mitad —festivos, plantillas de horario y copiar/pegar día— se planifica aparte en **FEATURE-056 (F2b)** para respetar la cadencia de liberación y la regla de ≤10 tareas TDD.

### Decisiones tomadas (con el analista)

- **Batch sin Route Handler**: un `upsert([...])` de supabase-js es una sola sentencia SQL atómica y sigue amparado por RLS, así que cerrar un rango o pintar N días es **un único upsert de un array**. Afina la Decisión #48 (no hace falta endpoint transaccional para estos batch).
- Sin cambios de modelo: reutiliza `availability_overrides` de F1. **Sin migración.**

## Contexto / impacto

Afecta a las **protectoras**. F1 permite editar día a día; cerrar un mes de vacaciones a mano son ~30 clicks. F2a reduce eso a un gesto (rango) o a una selección + acción (pintar), que es el objetivo «amigable y rápido» del rediseño.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [FEATURE-053](FEATURE-053.md) (modelo, `src/lib/agenda.ts`, `AgendaCliente`, `CalendarioMensual`, `PanelDiaEditor`).
- `docs/technical/DATA_MODEL.md` (sección «Agenda de disponibilidad: patrón + excepciones»).
- `docs/technical/DECISIONS.md` #46–48.
- Skills: `adoptia-frontend` (interacción, tokens, i18n), `adoptia-testing` (TDD), `adoptia-security` (RLS del batch).
- Wireframe: `assets/wireframes/protectorasagenda/`.

### Seguridad

- **Sin superficie nueva de BD**: el batch usa la RLS de `availability_overrides` ya existente (solo la dueña escribe). El `upsert` de un array de filas de otra protectora sería rechazado por la política `with check` fila a fila.
- Validación en cliente (Zod compartido en `src/lib/schemas/`): rango con `hasta >= desde`, límite de tamaño de rango (p. ej. ≤ 366 días) para no generar upserts desmedidos, nota `max 200`.
- Sin datos personales → sin RGPD.

### Modelo de datos

- **Sin cambios** (reutiliza `availability_overrides`). Sin migración.

### API

- **Sin endpoints.** Batch = `supabase.from("availability_overrides").upsert(filas, { onConflict: "shelter_id,date" })` (atómico, RLS). `API_CONTRACTS.md` sin cambios.

### Frontend

Amplía la pantalla `panel/agenda` (todo dentro de `AgendaCliente`):

- **`UtilidadesBar.tsx`** — barra sobre el calendario con: botón **«Seleccionar días»** (activa el modo selección) y botón **«Cerrar rango…»** (abre el diálogo).
- **Modo selección en `CalendarioMensual`** — props nuevas `modoSeleccion: boolean` y `seleccionados: Set<string>`; en ese modo, al pulsar un día se **conmuta** en el set (en vez de abrir el editor) y se resalta. Aparece una **barra de acción flotante** con «N días seleccionados · Cerrar · Aplicar franja · Cancelar».
- **`AplicarFranjaSheet`** (o reutilizar un mini-form) — al pulsar «Aplicar franja» sobre la selección: una franja (inicio/fin/duración) que se escribe como `slots` en cada día seleccionado.
- **`RangoCierreDialog.tsx`** — fecha desde/hasta + nota; al confirmar, cierra el rango.
- **`AgendaCliente`** — estado `modoSeleccion`/`seleccionados` y funciones `cerrarSeleccion()`, `aplicarFranjaSeleccion(franja)`, `cerrarRango(desde, hasta, nota)`: construyen el array de overrides y hacen **un** `upsert`; actualizan el estado local y `router.refresh()`; feedback de error como en F1.
- **`src/lib/agenda.ts`** — función pura `diasEnRango(desde, hasta): string[]` (fechas ISO inclusive; rango invertido → `[]`).
- i18n: nuevas claves en el namespace `agenda`.

### Tareas TDD

1. **`diasEnRango`** — unit test: rango normal (inclusive), un solo día, rango invertido → `[]`, cruce de mes.
2. **Schema `rangoCierreSchema`** (Zod) — test: `hasta>=desde`, tamaño ≤ límite, nota acotada.
3. **`CalendarioMensual` modo selección** — test: en `modoSeleccion`, pulsar días los conmuta en `seleccionados` (callback) y se marcan; fuera del modo, comportamiento de F1 intacto.
4. **`UtilidadesBar`** — test: activa modo selección y abre el diálogo de rango.
5. **`AgendaCliente` — cerrar selección** — test: seleccionar 3 días + «Cerrar» → un `upsert` con 3 filas `closed:true`; refresh.
6. **`AgendaCliente` — aplicar franja a selección** — test: selección + franja → `upsert` con N filas `closed:false, slots:[…]`.
7. **`RangoCierreDialog` + `cerrarRango`** — test: rango de 5 días → `upsert` de 5 filas cerradas con la nota; rango inválido bloquea y avisa.
8. i18n + estados (selección vacía deshabilita acciones; error de batch con feedback) + `tsc`/lint/coverage verdes.

### Dependencias

- [FEATURE-053](FEATURE-053.md) `hecho`. ✅

## Criterios de aceptación / Casuística a cubrir

- [ ] Modo selección: marcar/desmarcar varios días; contador visible; «Cancelar» limpia la selección.
- [ ] Cerrar la selección: todos los días marcados quedan `closed` (un solo upsert) y se ven cerrados en el calendario.
- [ ] Aplicar franja a la selección: todos los días marcados reciben ese horario especial.
- [ ] Rango de cierre: cierra todos los días entre desde/hasta (inclusive) con la nota.
- [ ] Rango inválido (hasta<desde o excede el límite) se rechaza con aviso; no escribe nada.
- [ ] Selección vacía: las acciones de la barra están deshabilitadas.
- [ ] Seguridad: el batch respeta la RLS (solo la dueña); un upsert con filas ajenas se rechaza.
- [ ] Error de batch: feedback claro y sin dejar el calendario inconsistente (refresh).
- [ ] Textos en `messages/es.json`; `tsc` y lint limpios.

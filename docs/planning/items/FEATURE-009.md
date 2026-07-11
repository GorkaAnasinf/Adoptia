---
id: FEATURE-009
tipo: feature
titulo: Citas con calendario y agenda de disponibilidad
estado: hecho
prioridad: alta
hito: "0.3"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-11
---

# FEATURE-009 — Citas con calendario y agenda de disponibilidad

## Descripción

Cuando la protectora aprueba una solicitud, el adoptante elige un hueco entre las franjas semanales que la protectora define (día/hora/duración). Ambos reciben confirmación y recordatorio 24 h antes por email. La protectora gestiona su agenda: confirmar, cancelar, marcar realizada o no presentada. (Ref: U9, P7)

## Contexto / impacto

Cierra el ciclo de adopción dentro de la plataforma; hoy las citas se conciertan por teléfono con idas y venidas.

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`availability_slots`, `appointments`), prompts Stitch §1.7 y §2.6, skill `adoptia-backend`

### Seguridad

- Solo el adoptante de una solicitud `approved` puede reservar; RLS sobre `appointments` vía la solicitud.
- Concurrencia: dos adoptantes no pueden reservar el mismo hueco (constraint/transacción).

### Modelo de datos

- Activar `availability_slots` y `appointments` (migración fase 2). Generación de huecos = franjas − citas existentes.

### API

- `POST /api/citas` (reservar), `PATCH /api/citas/[id]` (estados), cron de recordatorios 24 h (`/api/cron/recordatorios`).

### Frontend

- Booking (Stitch 1.7): tira semanal + pills de hora + confirmación con mapa.
- Agenda protectora (Stitch 2.6): calendario semanal + editor de disponibilidad recurrente con preview de huecos.

### Tareas TDD

1. Test generación de huecos (franjas, duración, citas ocupadas, pasado excluido).
2. Test concurrencia: doble reserva del mismo hueco → una falla limpia.
3. Test estados de cita y quién puede cambiarlos.
4. Test cron recordatorios: solo citas confirmadas a 24 h ± ventana, un solo envío.
5. E2E: aprobar solicitud → email → reservar → confirmación ambas partes.

### Dependencias

- FEATURE-007.

## Criterios de aceptación / Casuística a cubrir

- [x] Adoptante solo ve huecos futuros y libres; zona horaria Europe/Madrid consistente (RPC `appointment_free_slots` genera y filtra en Europe/Madrid; tests RLS).
- [x] Cancelación por cualquiera de las partes notifica a la otra con motivo (PATCH `cancel` + email; tests de ambos sentidos).
- [x] Cambio de disponibilidad no rompe citas ya confirmadas (las franjas solo generan huecos futuros; el editor avisa de que pausar/borrar no cancela citas).
- [x] Recordatorio 24 h antes a ambos; sin duplicados si el cron corre dos veces (`reminder_sent_at` + ventana 23–25 h; workflow horario `recordatorios.yml`).
- [x] "No se presentó" registrable; visible en historial interno de la protectora (`no_show` en `/panel/citas`).

## Cierre (2026-07-11)

- **BD**: `availability_slots` + `appointments` con RLS, exclusion constraint anti doble reserva (btree_gist) y RPC `appointment_free_slots` (security definer, solo huecos, no expone citas ajenas).
- **API**: `POST /api/citas` (revalida hueco, 409 en carrera 23P01, emails a ambos), `PATCH /api/citas/[id]` (cancel con motivo por cualquiera de las partes con aviso a la otra; done/no_show solo protectora), `GET /api/cron/recordatorios` (idempotente).
- **UI**: booking del adoptante (tira de días + pills de hora) desde su solicitud aprobada, con ver/cancelar cita; agenda `/panel/citas` (próximas con acciones + historial) y editor de disponibilidad `/panel/agenda`; tarjeta "Próximas citas" en el dashboard (pendiente desde FEATURE-004).
- **Tests**: 6 RLS/RPC, 8+8 de API, 4 del cron, 4 del booking + actualizaciones; E2E Playwright completo (reservar → agenda → realizada) en desktop y móvil. Suite: 551 unit + 2 E2E.
- **Pendiente de operación (usuario)**: `npx supabase db push` (migraciones de slug y citas) y secrets de GitHub Actions `SITE_URL` + `CRON_SECRET` (y `CRON_SECRET` en Vercel) para activar los recordatorios.

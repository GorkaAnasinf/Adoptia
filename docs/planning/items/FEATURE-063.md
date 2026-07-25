---
id: FEATURE-063
tipo: feature
titulo: Jornadas de adopción F2 — recordatorios, aviso a la protectora y avisos por zona
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-25
actualizado: 2026-07-25
---

# FEATURE-063 — Jornadas de adopción F2 (avisos)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Segunda fase de las **jornadas de adopción** (sobre FEATURE-062). Añade la capa de comunicación para que la jornada no dependa de que la gente recuerde la fecha:

- **Recordatorio por email a los asistentes** ~24 h antes de la jornada.
- **Aviso a la protectora** cuando alguien nuevo confirma asistencia (y opcionalmente resumen del día anterior).
- **Aviso de jornada cercana por zona**: los adoptantes con alerta/zona guardada reciben aviso de una jornada publicada cerca de su ubicación, reutilizando la infraestructura de alertas (FEATURE-041).

## Contexto / impacto

Afecta a **adoptantes** (reciben recordatorios y descubrimiento proactivo) y **protectoras** (saben cuánta gente esperar y ganan alcance sin depender de redes). Sin esto, la jornada existe en la plataforma pero no "llega" al usuario en el momento útil. Reutiliza Resend (emails), el cron ya existente y la infraestructura de alertas guardadas, por lo que es incremental sobre F1.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- FEATURE-062 (modelo `events`/`event_attendees`, RLS, RPC).
- Infra de **emails Resend** y **cron** existente (skill `adoptia-backend`; features previas con envío de correo y cron de archivado de perdidos).
- Infra de **alertas guardadas** de búsqueda (FEATURE-010/041) y `messages/es.json`.
- Skills: `adoptia-backend` (Route Handlers, emails, cron), `adoptia-security` (no exponer emails, idempotencia), `adoptia-testing`.

### Seguridad

- El cron/endpoint de recordatorios se ejecuta con **service role** por el servidor (nunca desde cliente); protegido por secreto de cron (patrón del cron existente). Jamás exponer emails de asistentes a la protectora ni a terceros.
- Antispam/idempotencia: marcar recordatorio ya enviado (columna/registro) para no duplicar en reejecuciones del cron.
- El aviso por zona respeta las preferencias de alerta del adoptante (opt-in existente); un usuario puede desactivarlo.

### Modelo de datos

Migración `supabase/migrations/20260725xxxxxx_feature063_event_reminders.sql` (mínima):

- Marca de idempotencia de recordatorio: `event_attendees.reminded_at timestamptz` (o tabla de log de envíos), para "enviado 24 h antes" una sola vez.
- (Opcional) marca en `events` de "notificación por zona ya emitida" para no repetir el aviso de cercanía.
- Sin cambios de RLS más allá de permitir al servidor (service role) leer lo necesario.

### API

- **Route Handler de cron** `app/api/cron/event-reminders/route.ts`: selecciona jornadas que empiezan en ~24 h, sus asistentes sin `reminded_at`, envía email Resend y marca `reminded_at`. Programación en `vercel.json`/config de cron.
- **Aviso a la protectora**: al confirmar un RSVP (F1), disparar email a la protectora (directo en el flujo o batch en el cron; decidir según coste 0 — probablemente batch diario para no saturar).
- **Aviso por zona**: extender el proceso de alertas existente para casar jornadas nuevas publicadas con alertas/zonas guardadas y notificar.

### Frontend

- Plantillas de email (coherentes con las existentes): recordatorio al asistente, aviso a la protectora, aviso de jornada cercana. Enlaces a la ficha `/jornadas/[id]`.
- Preferencia visible para el adoptante de activar/desactivar avisos de jornadas (dentro de la gestión de alertas ya existente).
- i18n de textos de email/preferencia.

### Tareas TDD

1. **Selección del cron** (función pura) — dado un conjunto de jornadas/asistentes/`now`, devuelve a quién recordar (ventana ~24 h, sin `reminded_at`).
2. **Idempotencia** — reejecutar el cron no reenvía (marca `reminded_at`).
3. **Aviso a la protectora** — nuevo RSVP genera el aviso una vez.
4. **Aviso por zona** — jornada publicada casa con alerta/zona guardada y notifica; respeta opt-out.
5. **Envío Resend** — mockear el cliente; asertar destinatarios/plantilla; no filtrar emails cruzados.
6. i18n + `tsc` + lint + cobertura.

### Dependencias

- **FEATURE-062 (F1) `hecho`.**

## Documentación a alinear (al cerrar — Hachiko)

- **Alinear con el `git diff`:** `docs/technical/DATA_MODEL.md` (marca de recordatorio), `docs/technical/API_CONTRACTS.md` (cron), `docs/technical/DECISIONS.md` si se decide batch vs inmediato, `docs/operations/*` (nuevo cron), catálogo (`render_planning.py`), CHANGELOG.
- **Manual de usuario (`docs/manual/`): actualizar SOLO cuando F2 esté implementada y probada** — explicar los avisos que recibe el adoptante (recordatorio, jornada cercana) y cómo activarlos/desactivarlos, y el aviso de confirmaciones que recibe la protectora.

## Criterios de aceptación / Casuística a cubrir

- [x] Los asistentes reciben recordatorio ~24 h antes, una sola vez (idempotente por `reminded_at`; ventana 23–25 h).
- [x] La protectora recibe un aviso sin ver emails de los asistentes — **resumen batch 24 h** ("mañana tu jornada, N asistentes"), idempotente por `reminder_sent_at`, en vez de un email por cada RSVP (batch pre-aprobado en el plan; evita hook server sobre el insert directo de F1).
- [x] Adoptantes con búsqueda guardada **activa** cuya zona cubre una jornada publicada reciben aviso de jornada cercana; enlace de baja de la alerta. Idempotente por `zone_notified_at`.
- [x] Ningún email cruzado ni fuga de datos personales (emails de asistentes nunca a la protectora); cron protegido por `CRON_SECRET` (401 sin él).
- [x] `tsc` y lint limpios. (Los textos van en las plantillas de email server-side, no en `messages/es.json`.)
- [ ] Documentación y manual alineados al cerrar — **a cargo de Hachiko**.

## Estado de implementación (Bolt · 2026-07-25)

Rama `feature/FEATURE-063-jornadas-avisos` (desde `main`). Migración `20260725160000_feature063_event_notifications` (columnas `reminded_at`/`reminder_sent_at`/`zone_notified_at` + RPC `event_zone_matches`), 3 plantillas de email y cron `GET /api/cron/jornadas`. Verificación: RLS eventos 10/10, cron 4/4, `tsc` y lint limpios.

**Desviaciones vs plan (justificadas):** (1) aviso a la protectora = resumen batch 24 h, no por-RSVP (el plan lo permitía; el insert de RSVP de F1 es directo por RLS, sin hook server). (2) El aviso por zona empareja con las búsquedas guardadas **existentes al procesar** el evento (se marca `zone_notified_at` tras el primer aviso con coincidencias); una búsqueda creada después no lo recibe — limitación aceptable para F2. **Pendiente de despliegue:** `supabase db push` a prod + alta del cron `/api/cron/jornadas` en el scheduler externo (como el resto de `/api/cron/*`).

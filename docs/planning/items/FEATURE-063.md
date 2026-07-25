---
id: FEATURE-063
tipo: feature
titulo: Jornadas de adopción F2 — recordatorios, aviso a la protectora y avisos por zona
estado: listo
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

- [ ] Los asistentes reciben recordatorio ~24 h antes, una sola vez (idempotente ante reejecuciones del cron).
- [ ] La protectora recibe aviso de nuevas confirmaciones sin ver emails de los asistentes.
- [ ] Adoptantes con alerta/zona reciben aviso de jornada cercana publicada; respeta opt-out.
- [ ] Ningún email cruzado ni fuga de datos personales; cron protegido por secreto.
- [ ] Textos en `messages/es.json`; `tsc` y lint limpios.
- [ ] Documentación y manual anotados como pendientes de alinear al cerrar.

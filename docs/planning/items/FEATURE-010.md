---
id: FEATURE-010
tipo: feature
titulo: Área personal del adoptante — solicitudes, favoritos y alertas
estado: hecho
prioridad: media
hito: "0.3"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-11
---

# FEATURE-010 — Área personal del adoptante

## Descripción

El adoptante tiene su espacio con pestañas: **Mis solicitudes** (estado e historial), **Favoritos** (animales guardados con aviso si cambian de estado), **Mis alertas** (búsquedas guardadas que envían email cuando entra un animal que encaja) y **Citas**. (Ref: U8, U10, U11)

## Contexto / impacto

Retención: el adoptante que no encuentra hoy vuelve mañana gracias a alertas y favoritos. Las alertas convierten el estado vacío del listado en captura de demanda.

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`favorites`, `saved_searches`, `notifications`), prompts Stitch §1.6, skill `adoptia-frontend`

### Seguridad

- RLS: favoritos/alertas solo del dueño. Baja de alertas con enlace firmado en el email (sin login).

### Modelo de datos

- Activar `favorites`, `saved_searches`, `notifications` (migración fase 2).

### API

- Cron `/api/cron/alertas`: casa animales publicados en las últimas 24 h con `saved_searches` activas → email con resumen (respetar límite Resend 100/día: agrupar por usuario).

### Frontend

- Stitch 1.6: 4 pestañas. Corazón de favorito en tarjetas y ficha (optimistic UI). "Crear alerta" desde estado vacío del listado con los filtros actuales.

### Tareas TDD

1. Test matching alerta↔animal (filtros + distancia PostGIS).
2. Test agrupación de emails (N animales → 1 email por usuario).
3. Test favorito: aviso al cambiar estado del animal.
4. Test enlace de baja sin sesión.
5. E2E: guardar alerta → publicar animal que encaja → email (mock).

### Dependencias

- FEATURE-007 (solicitudes visibles), FEATURE-009 (pestaña citas).

## Criterios de aceptación / Casuística a cubrir

- [x] Solicitud retirable por el adoptante (`withdrawn`) mientras esté pendiente (hecho en [[IMPROVEMENT-013]]).
- [x] Favorito de animal adoptado se marca visualmente (badge en `/mi-cuenta/favoritos`) y notifica una sola vez (`favorites.notified_at`, cron de alertas).
- [x] Alerta con topes: máx. 5 por usuario (trigger en BD, probado el 6º rechazo) y máx. 1 email/día por alerta (`last_sent_at`, filtrado en el RPC).
- [x] Darse de baja de una alerta desde el email en un clic (`/alertas/baja?token=…` con token-capacidad, sin sesión; solo desactiva, reactivable desde la cuenta).
- [x] Todo el área inaccesible sin sesión (redirect a /login probado por página); datos de otro usuario inaccesibles (RLS probada: lectura ajena vacía, insert a nombre de otro rechazado).

## Cierre (2026-07-11)

- **BD**: `favorites` (pk compuesta, `notified_at`) y `saved_searches` (filtros jsonb, `unsubscribe_token`, `last_sent_at`, tope 5 por trigger) + RPC `saved_search_matches` (matching por especie/tamaño/sexo y distancia PostGIS; solo service_role). Sin tabla `notifications` (decisión #33).
- **Cron** `/api/cron/alertas` + workflow diario `alertas.yml`: agrupa todas las coincidencias de un usuario en un email (límite Resend) y avisa una única vez de favoritos adoptados.
- **UI**: corazón de favorito en la ficha (optimistic, autocontenido), `/mi-cuenta/favoritos`, `/mi-cuenta/alertas` (pausar/activar/borrar, aviso de tope) y `/mi-cuenta/citas`; "Crear alerta" desde el estado vacío del listado con los filtros actuales de la URL. Sidebar del adoptante completo.
- **Recorte consciente**: el corazón en las tarjetas del listado (plan §frontend) queda fuera — el criterio de aceptación no lo exige y requiere estado por usuario en un componente hoy presentacional; si se quiere, item nuevo.
- **Fix de paso**: error de tipos en `e2e/citas.spec.ts` que se coló en 0.0.26 (rompía `tsc` estricto).
- **Tests**: 6 RLS (incluido tope de 5 y matching), 5 del cron, 4+5+5 de páginas, 4 del CTA de alerta. Suite: 574.

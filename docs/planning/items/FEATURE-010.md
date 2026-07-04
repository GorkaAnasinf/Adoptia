---
id: FEATURE-010
tipo: feature
titulo: Área personal del adoptante — solicitudes, favoritos y alertas
estado: listo
prioridad: media
hito: "0.3"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
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

- [ ] Solicitud retirable por el adoptante (`withdrawn`) mientras esté pendiente.
- [ ] Favorito de animal adoptado se marca visualmente y notifica una sola vez.
- [ ] Alerta con topes: máx. 5 alertas por usuario; frecuencia máx. 1 email/día por alerta.
- [ ] Darse de baja de una alerta desde el email en un clic.
- [ ] Todo el área inaccesible sin sesión; datos de otro usuario inaccesibles (RLS probada).

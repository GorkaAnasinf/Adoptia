---
id: IMPROVEMENT-013
tipo: improvement
titulo: Vista "mis solicitudes" del adoptante
estado: hecho
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-10
actualizado: 2026-07-10
---

# IMPROVEMENT-013 — Vista "mis solicitudes" del adoptante

## Descripción

El adoptante necesita una pantalla en `/mi-cuenta` que liste sus solicitudes de adopción enviadas (animal, fecha, estado: pendiente/aprobada/rechazada/completada/retirada), con acceso al detalle de cada una.

## Contexto / impacto

Detectado durante QA de FEATURE-007: `/mi-cuenta` es hoy un placeholder de estado vacío sin listado real. El aviso de "ya enviaste una solicitud para este animal" (FEATURE-007) enlaza de vuelta a la ficha del animal en lugar de al estado de la solicitud, precisamente porque esta vista no existe todavía. Sin ella, el adoptante no tiene forma de hacer seguimiento de sus solicitudes ni de retirarlas.

## Dependencias

- FEATURE-007 (hecho) — tabla `adoption_requests`, RLS y API ya listas.

## Cierre (2026-07-10)

- Nueva página `/mi-cuenta/solicitudes`: lista las solicitudes del adoptante (foto, animal con enlace a la ficha, protectora, fecha de envío y estado con badge), con estado vacío amable. La RLS existente ya limitaba la lectura a las propias.
- **Retirar solicitud**: nueva acción `withdraw` en `PATCH /api/solicitudes/[id]` — solo el adoptante dueño, solo si sigue `pending`, sin emails; botón con confirmación en cada solicitud pendiente.
- El aviso de solicitud duplicada del cuestionario enlaza ahora a `/mi-cuenta/solicitudes` (antes iba a la ficha del animal por no existir esta vista).
- `/mi-cuenta` enlaza a "Mis solicitudes".
- Tests: página (5 casos), API withdraw (4 casos), schema y wizard actualizados.

La versión completa del área personal (favoritos, alertas) sigue siendo [[FEATURE-010]].

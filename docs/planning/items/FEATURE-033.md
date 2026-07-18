---
id: FEATURE-033
tipo: feature
titulo: Alertas de búsqueda guardada (avisos de nuevos animales)
estado: descartado
prioridad: media
hito: "0.3"
duplicado_de: FEATURE-010
creado: 2026-07-17
actualizado: 2026-07-18
---

# FEATURE-033 — Alertas de búsqueda guardada

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Un adoptante busca hoy y no encuentra; vuelve (o no) dentro de un mes. Se pide:

1. El usuario guarda su búsqueda (especie, tamaño, edad, zona/radio…) con un nombre.
2. Cuando una protectora publica un animal que encaja, el usuario recibe un email con el animal y enlace a la ficha.
3. Gestión de alertas: listar, editar, desactivar, borrar; baja de avisos en un clic desde el propio email.

## Contexto / impacto

Motor de retención: convierte visitas puntuales en usuarios recurrentes y acerca a las protectoras adoptantes ya filtrados por sus preferencias. Reduce el tiempo de estancia de los animales publicados. Coste 0 (emails vía Resend ya integrado; evaluación de matching en publicación o cron existente).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

**Descartado como duplicado de [[FEATURE-010]]** (hecha en hito 0.3, en producción). Verificación del 2026-07-18 criterio a criterio:

| Criterio pedido | Dónde está ya |
|-----------------|---------------|
| Guardar búsqueda con nombre y filtros | `CrearAlertaButton` (listado `/animales`) → `saved_searches` (migración `20260711130000`) |
| Email cuando entra animal que encaja | RPC `saved_search_matches` + cron `/api/cron/alertas`, programado a diario (09:00 UTC) en `.github/workflows/alertas.yml` |
| Gestión: listar/desactivar/borrar + límite | `/mi-cuenta/alertas` + `AlertaAcciones`; tope de 5 por trigger en BD |
| Baja en un clic sin login | `/alertas/baja?token=` (uuid-capacidad `unsubscribe_token`) |
| Sin duplicados / máx 1 email/día | `last_sent_at` + ventana de 20 h en el RPC |
| Despublicado/adoptado no dispara | RPC filtra `status='available'`, `published_at not null`, protectora `verified` |
| RLS probada | `src/test/rls/favoritos-alertas.test.ts` |
| Textos en `messages/es.json` + plantilla propia | `plantillaAlertaAnimales` |

Tests de la zona re-ejecutados el 2026-07-18: 10/10 verdes.

**Deltas menores NO cubiertos** (candidatos a IMPROVEMENT si el uso real lo pide):
- Editar una alerta existente (nombre/filtros); hoy el camino es borrar y recrear desde el listado.
- El matching no casa filtro de edad (decisión deliberada: el botón solo guarda lo que el RPC sabe casar).

## Criterios de aceptación / Casuística a cubrir

- [ ] Usuario autenticado guarda/edita/desactiva/borra alertas; límite de alertas por usuario (anti-abuso).
- [ ] Animal nuevo que encaja dispara email (agrupado si hay varios; sin duplicados por animal+alerta).
- [ ] Baja en un clic desde el email (enlace firmado, sin login).
- [ ] Animal despublicado o adoptado no dispara ni aparece en emails pendientes.
- [ ] RLS probada: cada usuario solo ve/gestiona sus alertas.
- [ ] Textos en `messages/es.json`; email con plantilla propia.

---
id: IMPROVEMENT-032
tipo: improvement
titulo: Alinear las subpáginas de /mi-cuenta con el lenguaje del dashboard
estado: recibido
prioridad: baja
hito: null
duplicado_de: null
creado: 2026-07-23
actualizado: 2026-07-23
---

# IMPROVEMENT-032 — Alinear las subpáginas de /mi-cuenta con el dashboard

## Descripción

Las seis subpáginas del área del adoptante (`/mi-cuenta`: favoritos, solicitudes,
citas, alertas, acogida y perfil/dashboard) no comparten del todo el lenguaje
visual del dashboard rediseñado: cabeceras, estados vacíos, tarjetas y
espaciados. Unificarlas para que se lean como un sistema coherente (mismos
patrones de cabecera de sección, cards, chips y estados vacíos cuidados).

## Contexto / impacto

Detectado en FEATURE-039 al rediseñar el dashboard del adoptante. Es deuda de
consistencia visual: cada subpágina se hizo en su momento y hoy divergen en
detalles. Encaja en la tanda de rediseño de pantallas. Sin cambios de datos ni
RLS; puro frontend + i18n.

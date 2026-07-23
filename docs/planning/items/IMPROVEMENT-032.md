---
id: IMPROVEMENT-032
tipo: improvement
titulo: Alinear las subpáginas de /mi-cuenta con el lenguaje del dashboard
estado: hecho
prioridad: baja
hito: "0.5"
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

## Cierre (2026-07-23)

- Nuevo `CuentaSeccionHeader` (`src/components/cuenta/`): cabecera compartida que
  reutiliza el lenguaje del dashboard (`HeroCuenta`) — banda teal
  (`secondary-container`) con huella decorativa, título + subtítulo y hueco de
  acción opcional a la derecha.
- Aplicada a las **6 subpáginas** de `/mi-cuenta` (solicitudes, citas, favoritos,
  alertas, donaciones, acogida), sustituyendo el `<h1>` plano + subtítulo. La
  acción se conserva donde existía (contador+vaciar en favoritos, «crear alerta»
  en alertas). Se retira el breadcrumb interno redundante de alertas (ninguna
  otra subpágina lo tenía y la cabecera del shell ya muestra migas) y se
  normaliza el padding vertical (`py-12`→`py-8`) en donaciones y acogida.
- Sin cambios de BD/RLS/i18n (reutiliza claves existentes). El `<h1>` se mantiene
  (accesibilidad/SEO): los tests de página siguen verdes.

## Criterios de aceptación

- Las 6 subpáginas comparten la cabecera del dashboard. Suite y lint verdes.

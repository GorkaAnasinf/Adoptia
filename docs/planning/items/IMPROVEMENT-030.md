---
id: IMPROVEMENT-030
tipo: improvement
titulo: Cards ricas en la pestaña de propuestas enviadas de acogida
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-23
actualizado: 2026-07-23
---

# IMPROVEMENT-030 — Cards ricas en la pestaña de propuestas enviadas de acogida

## Descripción

La pestaña "Propuestas enviadas" de `panel/acogida` (FEATURE-058) muestra el
historial en una fila compacta muy básica. Adaptar el diseño de card de la
pestaña "Propuestas recibidas" (avatar de iniciales, cabecera con chip de
estado, bloques de info y cita del mensaje, efectos Reveal + hover-lift) — pero
sin filtros ni sidebar.

## Contexto / impacto

Coherencia visual dentro de la misma pantalla: las dos pestañas deben leerse con
el mismo lenguaje. Afecta a protectoras.

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md`, `.claude/commands/adoptia-testing.md`.
- Componente a tocar: `src/components/acogida/GestionAcogidas.tsx`.

### Seguridad

- Sin cambios. Mismo payload y acciones (`PropuestaEstadoActions`, RLS de `foster_proposals`).

### Modelo de datos

- Sin cambios.

### Frontend

- Reescribir el render de la pestaña "enviadas" con card completa: avatar del
  acogedor, nombre + chip de estado, fecha, bloques Animal/Duración, cita del
  mensaje enviado, aviso de relevo y acciones. Reveal con stagger + hover-lift.

### Tests

- Ampliar `GestionAcogidas.test.tsx`: la card de enviadas muestra nombre del
  acogedor, animal, duración, mensaje y acciones.

## Criterios de aceptación

- La pestaña enviadas usa el mismo lenguaje visual que recibidas (sin filtros).
- Suite y lint verdes; textos en `es.json`.

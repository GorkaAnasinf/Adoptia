---
id: FEATURE-055
tipo: feature
titulo: Agenda de la protectora F3 — vistas anual (heatmap) y diaria (timeline)
estado: recibido
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-055 — Agenda de la protectora F3 (vistas anual y diaria)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Tercera fase del rediseño de la Agenda (ver [FEATURE-053](FEATURE-053.md)). Añade el **segmented control de 3 modos** sobre la pantalla `panel/agenda`:

- **Mensual** (de F1): edición de disponibilidad.
- **Anual** (visor): 12 mini-meses tipo heatmap con el estado de cada día (configurado / cerrado / con citas); click en un día salta a la vista mensual.
- **Diaria** (visor): timeline de las citas del día seleccionado, reutilizando datos de `appointments`.

También incorpora las tarjetas de resumen del wireframe (capacidad = contador informativo de huecos/citas del día, citas pendientes, próxima disponibilidad).

## Contexto / impacto

Afecta a las **protectoras**. Cierra el rediseño dando la panorámica anual y el detalle diario para "ver la agenda cuando hay citas", además de la edición mensual de F1.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_Pendiente — lo escribe Snoopy al promover._

## Criterios de aceptación / Casuística a cubrir

- [ ] Segmented control alterna mensual / anual / diaria sin recargar.
- [ ] Vista anual: heatmap de 12 meses con estado por día; click salta a mensual en ese día.
- [ ] Vista diaria: timeline de citas del día (estados, adoptante, animal); estado vacío sin citas.
- [ ] Tarjetas de resumen (capacidad informativa, citas pendientes, próxima disponibilidad).
- [ ] Rendimiento: la vista anual no dispara N consultas (una carga agregada por año).
- [ ] Textos en `messages/es.json`; `tsc` y lint limpios.

## Dependencias

- [FEATURE-053](FEATURE-053.md) `hecho`. Recomendado también [FEATURE-054](FEATURE-054.md).

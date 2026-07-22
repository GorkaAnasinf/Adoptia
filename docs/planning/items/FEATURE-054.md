---
id: FEATURE-054
tipo: feature
titulo: Agenda de la protectora F2 — utilidades masivas de disponibilidad
estado: recibido
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-054 — Agenda de la protectora F2 (utilidades masivas)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Segunda fase del rediseño de la Agenda (ver [FEATURE-053](FEATURE-053.md) para modelo y decisiones). Sobre el calendario mensual y la tabla `availability_overrides` de F1, añade utilidades para dar de alta la disponibilidad de forma rápida y masiva:

1. **Pintar días** — multiselección (click / shift-click) y luego "aplicar franja" o "cerrar" en bloque.
2. **Rango de cierre / vacaciones** — date-range → cerrar del X al Y con nota (batch de overrides).
3. **Festivos** — importar festivos nacionales/autonómicos del año y cerrarlos con un click.
4. **Plantillas de horario** — guardar horarios ("Mañanas L-V") y aplicarlos a un día o rango.
5. **Copiar día → pegar** en otros días.

Las operaciones batch (rango, festivos, plantillas sobre rango) probablemente necesiten un **Route Handler** `/api/agenda/overrides` (multi-fila transaccional), a decidir en el plan de Snoopy.

## Contexto / impacto

Afecta a las **protectoras**. F1 permite editar día a día; F2 reduce el alta de semanas o meses de disponibilidad a unos pocos gestos, que es el objetivo "amigable y rápido" del rediseño. Sin F2 el alta masiva sigue siendo tediosa.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_Pendiente — lo escribe Snoopy al promover._

## Criterios de aceptación / Casuística a cubrir

- [ ] Pintar días: multiselección + aplicar franja / cerrar en bloque.
- [ ] Rango de vacaciones/cierre en un gesto (batch), con nota.
- [ ] Importar y cerrar festivos del año.
- [ ] Guardar y aplicar plantillas de horario a día/rango.
- [ ] Copiar día → pegar en otros días.
- [ ] Seguridad: batch respeta RLS (solo la dueña); validación de rangos y solapes.
- [ ] Errores parciales de batch con feedback claro; estados vacíos.

## Dependencias

- [FEATURE-053](FEATURE-053.md) `hecho`.

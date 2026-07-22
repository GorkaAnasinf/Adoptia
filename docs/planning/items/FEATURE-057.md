---
id: FEATURE-057
tipo: feature
titulo: Agenda de la protectora F2c — plantillas de horario
estado: recibido
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-057 — Agenda de la protectora F2c (plantillas de horario)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Última utilidad masiva de la Agenda (ver [FEATURE-053](FEATURE-053.md), [FEATURE-054](FEATURE-054.md), [FEATURE-056](FEATURE-056.md)). Permite **guardar horarios reutilizables** («Mañanas L-V», «Fines de semana») y **aplicarlos** a un día, a una selección o a un rango.

### Decisión tomada (con el analista)

- **Persistencia en tabla `availability_templates`** (nueva, con RLS de la dueña), no en `localStorage`: las plantillas sobreviven entre dispositivos y sesiones y son coherentes con el resto del modelo.

## Contexto / impacto

Afecta a las **protectoras**. Evita reescribir el mismo horario una y otra vez; con la selección múltiple de F2a, aplicar una plantilla a muchos días es un gesto.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_Pendiente — lo escribe Snoopy al promover. Notas: tabla `availability_templates` (id, shelter_id, nombre, slots jsonb) con RLS + CHECK de `slots` (reutilizar `availability_override_slots_ok`); aplicar = mismo `upsert` de array de F2a._

## Criterios de aceptación / Casuística a cubrir

- [ ] Guardar una plantilla con nombre y franjas.
- [ ] Listar, editar y borrar plantillas.
- [ ] Aplicar una plantilla a un día / selección / rango (batch).
- [ ] Seguridad: `availability_templates` con RLS (solo la dueña) + tests permitido/denegado.
- [ ] Validación de franjas de la plantilla (`availability_override_slots_ok`).
- [ ] Estado vacío (sin plantillas); textos en `messages/es.json`.

## Dependencias

- [FEATURE-053](FEATURE-053.md), [FEATURE-054](FEATURE-054.md) `hecho`. Recomendado [FEATURE-056](FEATURE-056.md).

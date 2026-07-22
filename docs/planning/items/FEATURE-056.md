---
id: FEATURE-056
tipo: feature
titulo: Agenda de la protectora F2b — festivos, plantillas y copiar/pegar
estado: recibido
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-056 — Agenda de la protectora F2b (festivos, plantillas, copiar/pegar)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Segunda mitad de las utilidades masivas de la Agenda (ver [FEATURE-053](FEATURE-053.md) y [FEATURE-054](FEATURE-054.md)). Completa las utilidades pendientes:

1. **Festivos** — importar los **festivos nacionales de España** (lista estática del año, decidido con el analista; los autonómicos/locales se cierran con el rango de F2a) y cerrarlos con un click.
2. **Plantillas de horario** — guardar horarios reutilizables («Mañanas L-V», «Fines de semana») en una **tabla `availability_templates`** (con RLS de la dueña) y aplicarlos a un día o a una selección/rango.
3. **Copiar día → pegar** — copiar la configuración de un día (cerrado u horario) y pegarla en otros días.

## Contexto / impacto

Afecta a las **protectoras**. Redondea el alta rápida: los festivos y las plantillas evitan repetir el mismo horario una y otra vez, y copiar/pegar clona días sueltos sin rehacerlos.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_Pendiente — lo escribe Snoopy al promover. Notas de diseño ya fijadas: festivos = lista nacional estática (sin API); plantillas = tabla `availability_templates` con RLS; el batch se aplica con el mismo `upsert` de array de F2a._

## Criterios de aceptación / Casuística a cubrir

- [ ] Importar y cerrar los festivos nacionales del año visible con un click.
- [ ] Guardar una plantilla de horario y aplicarla a un día / selección / rango.
- [ ] Editar y borrar plantillas.
- [ ] Copiar un día y pegarlo en otros (cerrado u horario).
- [ ] Seguridad: `availability_templates` con RLS (solo la dueña) + tests permitido/denegado.
- [ ] Estados vacíos (sin plantillas), errores de guardado; textos en `messages/es.json`.

## Dependencias

- [FEATURE-053](FEATURE-053.md) `hecho`. Recomendado también [FEATURE-054](FEATURE-054.md).

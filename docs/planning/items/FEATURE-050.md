---
id: FEATURE-050
tipo: feature
titulo: Rediseño de "Solicitudes recibidas" (maestra/detalle) del panel
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

> **Cierre (2026-07-22):** hecho en `feature/FEATURE-050-solicitudes-rediseno`. La vista
> de solicitudes de adopción del panel se rehace siguiendo las guías de diseño ya
> asentadas. **Lista (maestra):** cada animal es una tarjeta con **miniatura** + nombre +
> nº de solicitudes; las filas llevan **avatar de iniciales** del adoptante, fecha y chip
> de estado, con hover y fila seleccionada resaltada, y entran **escalonadas** (`Reveal`).
> **Detalle:** cabecera con adoptante + estado + referencia al animal; el **cuestionario**
> pasa de tabla plana a **secciones** (`FormSection`: 🏠 Vivienda, 👪 Convivencia, 🎓
> Experiencia) con los **valores humanizados** (reutiliza los labels del formulario de
> alta: «Casa con jardín», «Alquiler», «Sí»…); mensaje y notas en tarjetas, con feedback
> «Notas guardadas»; acciones aprobar/rechazar/completar con la **misma lógica**. Se añade
> la portada del animal a la query (bypass admin acotado ya existente). Sin cambios de
> modelo/RLS. QA: suite 1064 verde, typecheck y lint limpios. **Pendiente:** despliegue.

# FEATURE-050 — Rediseño de "Solicitudes recibidas"

## Descripción

Mejorar la vista maestra/detalle de solicitudes de adopción del panel siguiendo el
lenguaje de diseño de la app (FormSection, cards `shadow-soft`, chips de estado, Reveal,
hover, valores humanizados).

## Contexto / impacto

Afecta a la protectora. La vista era funcional pero fría: lista sin foto y cuestionario
como tabla de claves crudas (`casa_jardin`, `alquiler`). El rediseño la hace legible y
coherente con el resto del panel.

## Plan de desarrollo

### Frontend

- **`SolicitudesPanel`**: lista agrupada por animal con miniatura + avatar de iniciales +
  chip de estado + `Reveal`; detalle con cabecera (estado + animal), cuestionario en
  `FormSection` con valores humanizados, mensaje/notas en tarjetas y feedback de guardado.
  Se conserva íntegra la lógica de acciones (`approve`/`reject`+motivo/`note`/`complete`).
- **`solicitudes/page.tsx`**: la query admin añade la portada del animal
  (`animal_media`); `SolicitudRow.animal` gana `cover`.
- **i18n**: reutiliza `solicitud.vivienda*`/`regimen*` para humanizar; nuevas
  `solicitudesPanel.sectionVivienda/Convivencia/Experiencia` y `requestsCount`.

### Seguridad / Modelo

- **Sin cambios.** Mismo bypass admin acotado ya existente para leer nombre/solicitudes.

### Tareas TDD

1. `SolicitudesPanel.test.tsx`: se mantienen los casos (agrupar, seleccionar, aprobar,
   rechazar con motivo, notas); se añade que el cuestionario muestra secciones y valores
   humanizados.

## Criterios de aceptación / Casuística a cubrir

- [x] Lista con miniatura, avatar de iniciales, estado y carga escalonada.
- [x] Cuestionario en secciones con valores humanizados.
- [x] Cabecera con estado + referencia al animal; mensaje y notas en tarjetas.
- [x] Acciones aprobar/rechazar/completar con la misma lógica. Sin cambios de modelo/RLS.

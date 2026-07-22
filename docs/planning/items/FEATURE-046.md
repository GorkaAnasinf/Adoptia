---
id: FEATURE-046
tipo: feature
titulo: Layout del panel de la protectora a 2 columnas del wireframe Stitch
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

> **Cierre (2026-07-22):** hecho en `feature/FEATURE-046-panel-layout-wireframe`.
> Ajuste sobre FEATURE-045: el home del panel (`src/app/(shelter)/panel/page.tsx`)
> pasa del layout de coherencia (`1fr` + aside `20rem`) al **layout de 2 columnas
> anchas del wireframe de Stitch**. Izquierda: «Próximas citas» + «Solicitudes
> recientes» como **tabla** (Adoptante · Mascota · Fecha · Estado). Derecha (ancha):
> la rejilla grande de **«Tus animales»** (`grid-cols-2`). Motivo: tras ver
> FEATURE-045 en pantalla, el esqueleto se percibía «igual» porque solo cambiaban
> dos bloques dentro de la misma estructura; este cambio hace visible el rediseño y
> fiel al wireframe (los animales, activo principal de la protectora, ganan
> protagonismo). 4 claves i18n nuevas (cabeceras de tabla). Sin cambios de
> modelo/RLS. QA: suite 1048 verde, typecheck y lint limpios. **Pendiente:** despliegue.

# FEATURE-046 — Panel de la protectora a 2 columnas del wireframe

## Descripción

Cambiar la estructura del home del panel al layout de 2 columnas del wireframe de
Stitch. En FEATURE-045 se eligió mantener el esqueleto de coherencia (`1fr` + aside
`20rem`), lo que dejaba el panel visualmente casi idéntico. Se opta ahora por el
layout del wireframe para que el rediseño se note y los animales tengan el
protagonismo que muestra el diseño.

## Contexto / impacto

Afecta a la protectora. Los animales son su activo principal; el wireframe los pone
en una columna ancha a la derecha, con citas y solicitudes a la izquierda. La tabla
de solicitudes (Adoptante · Mascota · Fecha · Estado) aprovecha el ancho de columna.

## Plan de desarrollo

### Seguridad / Modelo / API

- **Sin cambios.** Solo reorganización de la vista; misma lectura de datos.

### Frontend

- Contenedor `lg:grid-cols-2 lg:items-start` (antes `lg:grid-cols-[1fr_20rem]`).
- **Izquierda**: «Próximas citas» (sin cambios) + «Solicitudes recientes» como
  **tabla** con cabeceras Adoptante · Mascota · Fecha · Estado y chip de estado.
- **Derecha (ancha)**: rejilla «Tus animales» a `grid-cols-2` (foto + estado +
  `raza · edad` + tarjeta «Añadir»).
- 4 claves i18n nuevas en `panel`: `colAdopter`, `colAnimal`, `colDate`, `colStatus`.

### Tareas TDD

1. `panel/page.test.tsx`: la tabla de solicitudes expone las cabeceras
   (Adoptante · Mascota · Fecha · Estado) además del contenido de la fila.
2. Verificación: suite del panel + `tsc` + lint + suite completa.

## Criterios de aceptación / Casuística a cubrir

- [x] Layout de 2 columnas anchas (izquierda citas+solicitudes, derecha animales).
- [x] «Solicitudes recientes» como tabla con las 4 cabeceras del wireframe.
- [x] «Tus animales» ocupa la columna derecha ancha en rejilla. Sin cambios de modelo/RLS.

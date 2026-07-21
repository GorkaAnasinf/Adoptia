---
id: FEATURE-045
tipo: feature
titulo: Rediseño del panel de la protectora (dashboard) al patrón Stitch
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-21
actualizado: 2026-07-21
---

> **Cierre (2026-07-21):** hecho en `feature/FEATURE-045-panel-protectora-reskin`.
> El home del panel (`src/app/(shelter)/panel/page.tsx`) se alinea con el wireframe
> de Stitch (`assets/wireframes/protectoradashboard/`) manteniendo coherencia con el
> dashboard de adoptante. Dos cambios: **«Tus animales»** pasa de lista plana a
> **rejilla de tarjetas** (foto `aspect-square` + `AnimalStatusBadge` superpuesto +
> `raza · edad`) con tarjeta punteada «Añadir nueva mascota»; **«Solicitudes recientes»**
> se enriquece (mascota + adoptante + fecha + chip de estado real, 5 más recientes de
> cualquier estado) resolviendo el nombre del adoptante con el mismo bypass acotado de
> `createAdminClient()` que ya usaba el fichero para las citas. Layout `1fr`+aside `20rem`
> y stat-cards sin tocar. Se descartan del wireframe el banner promocional (sin datos) y
> las etiquetas de modalidad de cita (sin campo en BD). Reutiliza `edadAproximada`,
> `AnimalStatusBadge` y las claves i18n de `busqueda`/`solicitudesPanel`. Una clave nueva
> (`panel.addAnimalCard`). Sin cambios de modelo/RLS. QA: suite 1048 verde, typecheck y
> lint limpios; revisión de rama completa sin incidencias bloqueantes. **Pendiente:** despliegue.

# FEATURE-045 — Panel de la protectora al patrón Stitch

## Descripción

Aplicar al home del panel de la protectora el wireframe de Stitch
(`assets/wireframes/protectoradashboard/`), tomando como base de coherencia visual el
dashboard del adoptante ya existente. El panel ya cubría ~80 % del wireframe (cabecera,
stat-cards, próximas citas), así que el trabajo son mejoras dentro de bloques existentes,
no una pantalla nueva.

## Contexto / impacto

Afecta a la protectora. Los animales son su activo principal: mostrarlos como rejilla de
tarjetas con foto y estado (en vez de una lista plana) es más útil y coherente con la
rejilla de favoritos del adoptante. Las solicitudes recientes pasaban solo el nombre del
animal con un chip estático; ahora dan contexto real (quién, cuándo, en qué estado).

## Plan de desarrollo

### Seguridad / Modelo / API

- **Sin cambios de esquema.** El nombre del adoptante vive en `profiles` (RLS: solo su
  dueño) y se resuelve con el **mismo** `createAdminClient()` acotado que el fichero ya
  usaba para las próximas citas —un único lookup que agrega los ids de citas y solicitudes—.

### Frontend

- **«Tus animales» → rejilla de tarjetas** (sustituye la lista «Animales recientes»):
  foto `aspect-square` con `AnimalStatusBadge` superpuesto, nombre + `raza · edad`, y
  tarjeta punteada «Añadir nueva mascota». Reutiliza `edadAproximada` y las claves
  `busqueda.edadAnios/edadMeses`. Amplía la query de `animals` con `breed,birth_date_approx`.
- **«Solicitudes recientes» enriquecidas** (aside `20rem`): filas con mascota + adoptante +
  fecha corta + chip de estado real (colores/labels de `solicitudesPanel`, patrón de
  `SolicitudesPanel`). Se dejan de filtrar solo las `pending`: 5 más recientes de cualquier
  estado.
- **Layout** `1fr` + aside `20rem` y **stat-cards** sin cambios.
- Una clave i18n nueva: `panel.addAnimalCard`. Se elimina la clave muerta
  `panel.requestPending`.

### Descartado del wireframe

- Banner «Campaña de Invierno» (marketing, sin fuente de datos).
- Etiquetas de modalidad de cita (Entrevista presencial / Videollamada): no hay campo en
  `appointments`.

### Tareas TDD

1. `panel/page.test.tsx`: «Solicitudes recientes» muestra mascota, adoptante, fecha y chip
   de estado (via admin lookup reutilizado).
2. `panel/page.test.tsx`: «Tus animales» pinta tarjetas con foto, badge de estado, raza y
   la tarjeta de añadir.
3. Verificación: suite del panel + `tsc` + lint + revisión de rama.

### Dependencias

- Reutiliza `edadAproximada` (`@/lib/animal-search`), `AnimalStatusBadge` y las claves
  i18n de `busqueda`/`solicitudesPanel`.

## Criterios de aceptación / Casuística a cubrir

- [x] «Tus animales» como rejilla de tarjetas con foto, estado, `raza · edad` y tarjeta de
  añadir; enlaza a la ficha del panel.
- [x] «Solicitudes recientes» con mascota + adoptante + fecha + chip de estado real (5 más
  recientes de cualquier estado).
- [x] Nombre del adoptante solo vía el bypass acotado ya existente; sin segundo admin call.
- [x] Layout `1fr`+aside `20rem` y stat-cards intactos. Sin cambios de modelo/RLS.

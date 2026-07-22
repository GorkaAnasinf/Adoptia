# Rediseño de "Mis animales" (rejilla de la protectora) — Diseño

**Fecha:** 2026-07-22
**Objetivo visual:** pantallazo aportado por el usuario (sin wireframe) + coherencia con las pantallas ya creadas (dashboard del panel, `AnimalCard`, `AnimalStatusBadge`).
**Ficheros:** `src/app/(shelter)/panel/animales/page.tsx`, nuevo `src/components/panel/AnimalesGrid.tsx`, nuevo `src/app/api/animales/[id]/route.ts`, `messages/es.json`, tests.

## Objetivo

Sustituir la tabla actual de `/panel/animales` (tabla en escritorio + lista en móvil)
por una **rejilla de tarjetas** con **búsqueda** y **filtros instantáneos**, y añadir
**acciones a nivel de lista** (publicar/despublicar/eliminar) en un menú por tarjeta.

## Decisiones de diseño

- **Layout:** rejilla de tarjetas (`grid-cols-2/3`), tarjeta punteada "Nueva mascota"
  al final. Mismo lenguaje que la rejilla "Tus animales" del dashboard.
- **Búsqueda + filtros en cliente** (instantáneos), sobre los animales ya cargados por
  el servidor. Se elimina el filtrado por `?estado=` en la URL.
- **Descartado del pantallazo:** chip "Urgentes" y badge "Caso urgente" — no existe
  campo de urgencia en `animals` (solo en `shelter_needs`); no se inventa esquema.
- **Estados:** los chips reutilizan los labels existentes (`animales.status*`):
  Todos · En adopción · Reservado · En acogida · Adoptado · No listado.

## Componentes

### Página servidor — `page.tsx`

- Mantiene: auth, lookup de `shelter` (id + **status** para saber si está verificada),
  avisos de moderación (server), cabecera "Mis animales" + subtítulo + botón
  "Nueva ficha".
- Carga **todos** los animales de la protectora con los campos que la tarjeta necesita:
  `id, name, slug, species, sex, breed, birth_date_approx, status, published_at,
  moderation_note, animal_media(url,is_cover,sort_order)`. Sin filtro server-side.
- Renderiza `<AnimalesGrid animals={...} shelterVerified={shelter.status === "verified"} />`.

### Cliente — `AnimalesGrid.tsx` (`"use client"`)

- **Estado:** texto de búsqueda + chip de estado activo (`"all" | AnimalStatus`).
- **Búsqueda:** filtra por `name`/`breed` (normalizada, sin acentos, case-insensitive).
- **Filtros:** chips Todos + `ESTADOS`. Búsqueda y filtro se combinan (AND).
- **Tarjeta** (una por animal):
  - Foto `aspect-square` (o 4/3) con `next/image`; placeholder `PawPrint` si no hay.
  - `AnimalStatusBadge status onImage` superpuesto (variante legible sobre foto).
  - Chip **"Borrador"** si `published_at == null`.
  - Nombre + icono de sexo (Mars/Venus, como `AnimalCard`) + `raza · edad`
    (`edadAproximada` + claves `busqueda.edadAnios/edadMeses`).
  - Acciones: **Editar** (`/panel/animales/[id]`), **Ver ficha**
    (`/animales/[slug]`, **solo si publicado**) y menú **⋮**.
  - **Menú ⋮:**
    - Publicado → **Despublicar**.
    - Borrador → **Publicar** (la API valida; si la ficha está incompleta responde
      422 y la tarjeta muestra "Completa la ficha para publicar" enlazando a editar).
    - Siempre → **Eliminar** (con `window.confirm`).
    - Al completar una acción: `router.refresh()`.
  - Errores de acción: mensaje inline en la tarjeta.
- Tarjeta punteada final **"Nueva mascota"** → `/panel/animales/nueva`.
- **Estado vacío:** si el filtro/búsqueda no da resultados, mensaje ("Sin resultados");
  si la protectora no tiene animales, el vacío existente (icono + CTA).

### API — `src/app/api/animales/[id]/route.ts`

Patrón de `src/app/api/solicitudes/[id]/route.ts` (Route Handler, cliente con la sesión
del usuario → RLS restringe a los animales de su protectora). Validación con zod.

- **`PATCH`** body `{ accion: "publish" | "unpublish" }` (schema zod):
  - `unpublish` → `update animals set published_at = null where id`. Devuelve `{ ok }`.
  - `publish`:
    1. Carga el animal (RLS dueño) con los campos de `animalPublishSchema` + cuenta de
       fotos (`animal_media` type photo).
    2. Si la protectora **no está verificada** → 403.
    3. `validarPublicacion(row, numFotos)` → si `!ok` → **422** `{ error, errores }`.
    4. `update animals set published_at = now()`. Devuelve `{ ok }`.
- **`DELETE`** → `delete from animals where id` (RLS dueño; `animal_media` cae por
  `on delete cascade`). Devuelve `{ ok }`.
- Respuestas de error: 400 (body inválido), 403 (no verificada), 404 (no existe / no es
  suya — RLS devuelve 0 filas), 422 (no publicable).

> **Nota storage:** el borrado no limpia los objetos de Storage (igual que el flujo
> actual de edición). Se deja fuera de alcance; los objetos quedan huérfanos sin
> impacto funcional. Registrar como deuda si molesta.

## i18n (nuevas claves en `animales` salvo indicación)

- `searchPlaceholder` ("Buscar por nombre o raza…"), `searchEmpty` ("Sin resultados").
- `viewProfile` ("Ver ficha"), `newAnimalCard` ("Nueva mascota"),
  `newAnimalCardHelp` ("Haz clic para añadir un nuevo animal al refugio.").
- `menuLabel` ("Acciones"), `publish` ("Publicar"), `unpublish` ("Despublicar"),
  `delete` ("Eliminar"), `deleteConfirm` ("¿Eliminar a {name}? Esta acción no se puede
  deshacer."), `publishIncomplete` ("Completa la ficha para publicar"),
  `actionError` ("No se pudo completar la acción.").
- Reutiliza: `draft` ("Borrador"), `status*`, `filterAll`, `edit`, `new`, `title`,
  `subtitle`, `sexMale`/`sexFemale`, y `busqueda.edadAnios/edadMeses`.

## Tests

- **`AnimalesGrid.test.tsx`** (cliente):
  - Búsqueda filtra por nombre y por raza.
  - Chip de estado filtra (p. ej. solo "Adoptado").
  - Borrador muestra chip "Borrador" y **no** muestra "Ver ficha".
  - Publicado muestra "Ver ficha" → `/animales/[slug]`.
  - Menú: "Eliminar" pide confirmación y hace `fetch(DELETE)`; "Despublicar" hace
    `fetch(PATCH unpublish)`. (fetch y confirm mockeados.)
  - Tarjeta "Nueva mascota" → `/panel/animales/nueva`.
- **`api/animales/[id]/route.test.ts`** (patrón de tests de route existentes):
  - `PATCH unpublish` pone `published_at=null`.
  - `PATCH publish` con protectora no verificada → 403.
  - `PATCH publish` con ficha incompleta → 422.
  - `PATCH publish` válido → `published_at` no nulo.
  - `DELETE` borra.
  - Body inválido → 400.
- **`page.test.tsx`**: la página monta `AnimalesGrid` con los animales cargados
  (smoke: cabecera + una tarjeta + "Nueva mascota").

## Fuera de alcance

- Limpieza de objetos de Storage al borrar.
- Campo/uso de "urgencia" en animals.
- Cambios en el formulario de alta/edición.
- Paginación (la protectora tiene pocos animales; se cargan todos).

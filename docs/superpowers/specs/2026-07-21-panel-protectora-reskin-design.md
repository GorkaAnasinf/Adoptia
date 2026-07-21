# Reskin del panel de la protectora — Diseño

**Fecha:** 2026-07-21
**Fichero afectado:** `src/app/(shelter)/panel/page.tsx` (+ `messages/es.json`, tests)
**Fuente de diseño:** `assets/wireframes/protectoradashboard/` (Stitch).
**Base de coherencia:** dashboard de adoptante `src/app/(adopter)/mi-cuenta/page.tsx`.

## Objetivo

Alinear el home del panel de la protectora con el wireframe de Stitch,
manteniendo coherencia visual con el dashboard de usuario. NO es una pantalla
nueva: el panel ya existe y cubre ~80 % del wireframe. Este trabajo son mejoras
visuales dentro de bloques existentes.

## Decisión de layout

- **Estructura de columnas: `1fr` + aside `20rem`** (sin cambios respecto al
  esqueleto actual; misma que el dashboard de adoptante). El wireframe pinta dos
  columnas anchas; se descarta por coherencia con el panel de usuario.
- Fila de 3 stat-cards (Solicitudes pendientes coral · Citas hoy teal · Perfiles
  activos crema) **ya coincide con el wireframe → sin cambios**.

## Cambios

### 1. Columna principal — "Tus animales" (rejilla de tarjetas)

Sustituye la lista plana actual "Animales recientes".

- Rejilla de tarjetas siguiendo el patrón de la rejilla *Favoritos* del
  dashboard de adoptante: foto `aspect-square` redondeada, `AnimalStatusBadge`
  superpuesto (esquina superior), y debajo `nombre` + `raza · edad`.
- Última celda: tarjeta punteada **"Añadir nueva mascota"** → `/panel/animales/nueva`.
- Cabecera: "Tus animales" + enlace "Gestionar todos" → `/panel/animales`.
- Muestra 4–6 animales activos (los ya usados en `activos`/avatares).
- **Datos:** ampliar la query de `animals` con `breed, birth_date_approx`.
  Reutilizar el helper de edad existente en el repo (localizar en el plan).
- **Fallback:** sin foto → placeholder `PawPrint` (como en adoptante). Sin
  raza/edad → omitir el segmento correspondiente sin dejar " · " colgando.

### 2. Columna principal — Próximas citas (se mantiene)

- Estilo caja-fecha actual sin cambios funcionales.
- **NO** se muestran etiquetas de modalidad ("Entrevista presencial",
  "Videollamada"): la tabla `appointments` no tiene campo de modalidad. No se
  añade columna nueva por un reskin (YAGNI).

### 3. Aside 20rem — Solicitudes recientes (enriquecidas)

- Filas compactas: mascota (negrita) + adoptante + fecha (mudo) + chip de estado.
- El wireframe lo pinta como tabla ancha (Adoptante│Mascota│Fecha│Estado); **no
  cabe en 20rem** → se resuelve con filas compactas al estilo de las filas de
  *Solicitudes* del dashboard de adoptante (coherencia).
- **Datos:** el nombre del adoptante vive en `profiles` (RLS: solo su dueño). Se
  resuelve con el **mismo bypass acotado con `createAdminClient()` que este
  fichero ya usa para las próximas citas** (lookup de `full_name` por lista de
  ids). Ampliar `recentRequests` para traer `adopter_id`.

## Descartado del wireframe

- Banner "Campaña de Invierno" (marketing, sin fuente de datos).
- Etiquetas de modalidad de cita (sin campo en BD).

## i18n

Claves nuevas bajo `panel` en `messages/es.json`:
- `tusAnimales`, `gestionarTodos`, `addAnimalCard` ("Añadir nueva mascota").
- Subtítulo `raza · edad`: componer con el helper de edad existente; sin clave
  nueva si ya hay formato reutilizable.
- Reutilizar claves existentes de estado de solicitud donde sea posible.

## Tests

- Actualizar `src/app/(shelter)/panel/page.test.tsx`:
  - Rejilla "Tus animales" renderiza tarjetas con badge de estado + tarjeta
    "Añadir".
  - Solicitudes recientes muestran nombre de adoptante + fecha + chip de estado.
- Mantener verde el resto de la suite del panel.

## Fuera de alcance

- Cambios de esquema en BD.
- Reordenar la navegación del sidebar (ya coincide con el wireframe).
- El banner promocional.

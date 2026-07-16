---
id: FEATURE-024
tipo: feature
titulo: Galería de fotos en los avisos de perdidos (hoy solo cabe una)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-15
actualizado: 2026-07-16
---

# FEATURE-024 — Galería de fotos en los avisos de perdidos

## Descripción

Un aviso admite **una sola foto** (`lost_found_posts.photo_url`). Para reconocer a un animal por la calle eso es poco: hace falta la de frente, la de perfil y la de la mancha del lomo. Las fichas de animales ya resuelven esto con `animal_media` (varias fotos, una portada, orden); los avisos deberían usar el mismo patrón.

Sale de **FEATURE-023**, que se troceó por tamaño: allí van los datos identificativos y los filtros; aquí, la galería.

## Contexto / impacto

Es la mitad visual del problema «con un aviso de "perro marrón" no lo reconoce nadie». Los datos estructurados (FEATURE-023) y las fotos se complementan: sin las dos cosas, el aviso sigue sin servir para identificar.

## Plan de desarrollo

### Alcance (decidido con el usuario)

- **Dentro**: subir varias fotos en el alta (la 1ª por orden es la portada) y verlas en una galería en la ficha.
- **Fuera**: gestionar las fotos de un aviso ya publicado (añadir/borrar/reordenar). Una vez publicado no se tocan, igual que hoy con la foto única. Si se quiere, item nuevo — no es esencial para que el aviso sirva para identificar, y añadir edición post-alta casi dobla el frontend.

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`animal_media` como patrón, `lost_found_posts`), [DECISIONS](../../technical/DECISIONS.md) (#36 reescrituras de SQL)
- Skills: `adoptia-database`, `adoptia-frontend`, `adoptia-testing`
- Precedentes a reusar, no reinventar:
  - **`animal_media`**: la forma de la tabla (`is_cover`, `sort_order`, índice único parcial de una portada, check «portada solo si es foto»). Aquí no hay vídeo, así que el check sobra.
  - **Subida en el alta**: `NuevoAvisoForm.subirFoto()` ya comprime y sube a `lost-found/${userId}/…`. La galería sube **varias** con el mismo patrón. Ojo: en avisos la carpeta es por `userId`, NO por `postId` — la foto se sube ANTES de que el aviso exista, así que el `post_id` no puede formar parte de la ruta (a diferencia de `animal_media`, que exige la ficha guardada).
  - `esImagenValida`, `comprimirFoto`, bucket `lost-found` (ya con políticas por carpeta de usuario).

### Seguridad

- **RLS de `lost_found_media` espejo de `lost_found_sightings`**: lectura pública solo si el aviso padre es `open`/`resolved` (o el autor/admin); inserta/borra solo el autor del aviso. Tests de acceso permitido y denegado, como toda tabla nueva.
- La foto se sube a `lost-found/${userId}/…` (política de Storage ya existente: la carpeta debe ser la del usuario). Sin cambios en las políticas del bucket.
- Ninguna galería sin dueño: `on delete cascade` desde `lost_found_posts`.

### Modelo de datos

Migración `20260716xxxxxx_feature024_lost_found_media.sql`:

```sql
create table public.lost_found_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lost_found_posts (id) on delete cascade,
  url text not null,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index lost_found_media_post_idx on public.lost_found_media (post_id, sort_order);
-- Una sola portada por aviso (índice único parcial, como animal_media).
create unique index lost_found_media_one_cover_idx
  on public.lost_found_media (post_id) where is_cover;

-- Backfill: cada aviso con foto pasa a tener una fila de media, que es su
-- portada. Así ninguna galería empieza vacía si ya había foto.
insert into public.lost_found_media (post_id, url, is_cover, sort_order)
select id, photo_url, true, 0
from public.lost_found_posts
where photo_url is not null;

alter table public.lost_found_posts drop column photo_url;
```

- **Se elimina `photo_url`**: dos fuentes para lo mismo divergen. La portada sale siempre de la tabla.
- **`lost_found_list` deja de devolver `photo_url` y pasa a devolver `cover_url`** (subconsulta a `lost_found_media`, la portada). **Reescritura de función SQL → Decisión #36**: el test que la protege se ejecuta antes de darla por buena. Y **la lección de BUG-006 en carne propia**: la subconsulta de portada tiene que estar blindada por un test que muerda si alguien la cambia. Como en `lost_found_list` no hay vídeo, la portada es simplemente `order by is_cover desc, sort_order asc limit 1` — sin filtro de tipo, pero el test debe fijar el comportamiento igual.
- RPC nuevo `lost_found_media_list(p_post_id uuid)` → `security invoker`, devuelve `url`, `is_cover`, `sort_order` ordenados; para la galería de la ficha.
- Actualizar la tabla de `lost_found_posts` (quitar `photo_url`, mencionar la galería) y añadir `lost_found_media` en DATA_MODEL.md.

### API

- Sin endpoints nuevos: el alta sigue siendo insert directo con RLS desde el formulario. Tras insertar el aviso (que devuelve su `id`), se insertan las filas de `lost_found_media` con ese `post_id`. Todo cliente + RLS, como el resto de perdidos.

### Frontend

- **`NuevoAvisoForm`**: el campo «Foto» pasa a aceptar **varias** (input `multiple` o botón «añadir otra»). Se muestran las miniaturas seleccionadas con opción de quitar y de marcar cuál es la portada (default: la primera). Límite razonable (p. ej. 6) para no castigar el alta ni la cuota. Se comprimen y suben todas antes del insert; si una falla al subir, se avisa y no se publica a medias (patrón de `subirFoto`, que ya lanza).
- **Ficha `/perdidos-encontrados/[id]`**: la foto única pasa a **galería** — portada grande + tira de miniaturas; al pulsar una, cambia la principal. Con una sola foto se ve igual que hoy. Sin sesión/lectura pública: solo mirar.
- **Listado y mapa**: la tarjeta usa `cover_url` del RPC (antes `photo_url`). El popup del mapa, igual.
- Textos nuevos en `messages/es.json` bajo `perdidos.*`. Cero literales.
- Móvil primero: subir 3 fotos desde el móvil tiene que ser cómodo.

### Tareas TDD

1. **RLS `lost_found_media`** (`src/test/rls/perdidos-media.test.ts`): anon lee la media de un aviso `open`, no la de un `archived` ajeno; solo el autor del aviso inserta y borra; una sola portada por aviso (el índice único lo impide).
2. **Backfill + reescritura de `lost_found_list`**: los avisos con `photo_url` previo quedan con una fila de media que es su portada; `lost_found_list` devuelve esa `cover_url`. **Test que muerde** (BUG-006): un aviso con dos fotos devuelve la marcada como portada, no otra — y falla si se rompe el `order by`.
3. **RPC `lost_found_media_list`**: devuelve las fotos de un aviso ordenadas, portada primero.
4. **`NuevoAvisoForm`**: publica con varias fotos → se crean N filas de media, la marcada es portada; quitar una antes de enviar la excluye; el alta sin fotos sigue funcionando (galería vacía, no rota).
5. **`NuevoAvisoForm`**: si una foto falla al subir, error propio y no se publica a medias.
6. **Ficha**: con varias fotos, pulsar una miniatura cambia la principal; con una sola, se ve como antes; sin fotos, ni galería ni hueco.
7. **Listado**: la tarjeta pinta `cover_url`; un aviso sin fotos cae al placeholder 🐾 (no una imagen rota — es el bug que arregló BUG-006, aquí no se puede reintroducir).
8. **E2E** (`e2e/perdidos.spec.ts`): publicar un aviso con 3 fotos → la ficha muestra la galería y se puede cambiar de foto. *(La suite E2E ya corre en CI, BUG-008.)*

### Dependencias

- FEATURE-012, FEATURE-022, FEATURE-023 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] El alta admite varias fotos (hasta 6) y sigue completándose en <2 min; subir fotos es opcional (test: publica sin ninguna foto).
- [x] La primera foto es la portada por defecto; el autor puede marcar otra antes de publicar (test: marca la 2ª → `is_cover` en la de `sort_order` 0).
- [x] Una sola portada por aviso, garantizado por BD (índice único parcial), probado en RLS.
- [x] La ficha muestra la galería (portada + miniaturas); con una sola foto se ve como hoy; sin fotos no deja hueco (tests de `GaleriaAviso` y de la ficha).
- [x] El listado y el popup del mapa usan la portada; un aviso sin fotos cae al placeholder vía `esImagenValida(cover_url)`, **nunca** a una URL que no es imagen.
- [x] `lost_found_media` pública en `open`/`resolved`, oculta en `archived` ajenos; solo el autor inserta/borra (tests RLS).
- [x] Los avisos con `photo_url` previo conservan su foto como portada tras la migración (backfill; test RLS).
- [x] `photo_url` desaparece de `lost_found_posts` y nada en el código de avisos la lee (test RLS de la columna + grep de QA).
- [x] Si una foto no sube, el aviso no se publica a medias y se avisa (test del alta).
- [x] Borrar un aviso arrastra su media (cascade; test RLS).

## Cierre (2026-07-16)

- **BD**: migración `20260716120000`. Tabla `lost_found_media` espejo de `animal_media` (índice único parcial de una portada). Backfill de `photo_url` → fila portada, y **`photo_url` eliminada**. `lost_found_list` reescrita para devolver `cover_url` (subconsulta a la tabla) — Decisión #36 aplicada: hay un test que muerde si se rompe el `order by` de la portada (el fallo exacto de BUG-006), y los 139 tests de RLS siguieron en verde tras la reescritura. RPC nuevo `lost_found_media_list`.
- **UI**: `NuevoAvisoForm` sube varias fotos (miniaturas para quitar y elegir portada); `GaleriaAviso` en la ficha (portada grande + tira navegable), que **ordena por portada él mismo** en vez de confiar en el RPC. Listado y mapa a `cover_url`.
- **Alcance consciente**: sin edición de la galería tras publicar (decisión del usuario). Una vez publicado, las fotos no se tocan.
- **Tests**: 9 RLS + 4 de galería + 15 del alta (4 nuevos multi-foto) + 8 de la ficha (2 nuevos) + 1 E2E. Suite: **921 verdes** (venía de 903).
- **Dos falsos positivos del linter de i18n** por el camino: mi `.filter((f) => …)` y mi `.sort((a,b) => …)` tenían un `=>` seguido de una expresión con `<` de comparación, y el heurístico `>texto<` los leía como texto de UI. Se extrajeron `tieneUrlValida` y `compararFotos` a funciones con nombre.
- **Nota menor (no bloqueante)**: el uploader del alta usa `URL.createObjectURL` sin `revokeObjectURL`; leak trivial en un formulario que se desmonta al publicar. Candidato a limpieza si se retoca el componente.

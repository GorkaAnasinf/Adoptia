---
id: FEATURE-024
tipo: feature
titulo: Galería de fotos en los avisos de perdidos (hoy solo cabe una)
estado: recibido
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-15
actualizado: 2026-07-15
---

# FEATURE-024 — Galería de fotos en los avisos de perdidos

## Descripción

Un aviso admite **una sola foto** (`lost_found_posts.photo_url`). Para reconocer a un animal por la calle eso es poco: hace falta la de frente, la de perfil y la de la mancha del lomo. Las fichas de animales ya resuelven esto con `animal_media` (varias fotos, una portada, orden); los avisos deberían usar el mismo patrón.

Sale de **FEATURE-023**, que se troceó por tamaño: allí van los datos identificativos y los filtros; aquí, la galería.

## Contexto / impacto

Es la mitad visual del problema «con un aviso de "perro marrón" no lo reconoce nadie». Los datos estructurados (FEATURE-023) y las fotos se complementan: sin las dos cosas, el aviso sigue sin servir para identificar.

## Plan de desarrollo

_Pendiente de planificar (Snoopy), después de FEATURE-023._

Notas de partida:

1. Tabla `lost_found_media` espejo de `animal_media` (`post_id`, `url`, `is_cover`, `sort_order`), con índice único parcial de una portada por aviso. **No reinventar el patrón.**
2. **Migrar `photo_url` a la tabla** (backfill como portada) y eliminar la columna: dos fuentes para lo mismo acaban divergiendo.
3. RLS espejo de `lost_found_sightings`: lectura si el aviso padre es público, escritura solo del autor.
4. `lost_found_list` debe devolver la portada. **Ojo con la lección de BUG-006**: la subconsulta de portada tiene que quedar blindada por un test que muerda si alguien la reescribe.
5. Reusar `comprimirFoto` y el bucket `lost-found` (ya tiene políticas por carpeta de usuario).
6. Al borrar una fila de media, borrar el objeto de Storage (regla de la skill `adoptia-database`: no dejar huérfanos). El aviso ya cae en cascada.

## Criterios de aceptación / Casuística a cubrir

- [ ] Pendiente de planificar.

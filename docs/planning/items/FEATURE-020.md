---
id: FEATURE-020
tipo: feature
titulo: Vídeos en la ficha del animal (YouTube + MP4)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-14
actualizado: 2026-07-14
---

# FEATURE-020 — Vídeos en la ficha del animal (YouTube + MP4)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Las protectoras solo pueden subir fotos de un animal. Se quiere permitir añadir
**vídeos** al alta/edición del animal y mostrarlos en el **carrusel** de la ficha
pública, junto a las fotos. Dos vías de vídeo:

- **Enlace de YouTube** (embed) — sin coste de almacenamiento.
- **Fichero MP4 subido** al bucket existente — con tope de tamaño.

## Contexto / impacto

Un vídeo (el animal caminando, jugando, su carácter) convierte muchísimo más que
una foto estática. Afecta a **protectoras** (alta más rica) y **adoptantes**
(mejor decisión). Hoy el esquema ya lo soporta a medias pero el frontend no:
`AnimalMediaUploader` solo acepta `image/*` e inserta `type:'photo'`, y
`AnimalGallery` filtra por `esImagenValida` y solo pinta `<Image>`. La BD ya tiene
el enum `media_type ('photo','video','youtube')` y la tabla `animal_media`.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md` (componentes, next/image, i18n, carrusel).
- `.claude/commands/adoptia-database.md` (bucket, `file_size_limit`, migración).
- `.claude/commands/adoptia-security.md` (validación de URL/mime, superficie XSS del embed).
- `.claude/commands/adoptia-testing.md` (Vitest + Testing Library + RLS).
- Código actual: [AnimalMediaUploader.tsx](../../../src/components/animals/AnimalMediaUploader.tsx),
  [AnimalGallery.tsx](../../../src/components/animals/AnimalGallery.tsx),
  [lib/image.ts](../../../src/lib/image.ts), RPC `animals_search`
  ([migración](../../../supabase/migrations/20260709120000_feature005_animals_search.sql)).

### Seguridad

- **XSS del embed:** NO renderizar URL cruda en `src` de iframe. Extraer el
  `videoId` de YouTube con regex estricta y construir `https://www.youtube-nocookie.com/embed/<id>`.
  Guardar en BD la URL canónica ya normalizada; validar de nuevo al renderizar.
- **Validación MP4:** cliente comprueba `file.type === 'video/mp4'` y tamaño
  ≤ tope; el bucket refuerza con `file_size_limit`. Storage RLS por carpeta
  `shelterId/` ya cubre insert/update/delete de vídeos (misma política que fotos).
- **Sin lectura pública nueva:** `animal_media_public_read` ya existe; no cambia.
- Superficie nueva: un `<iframe>` de tercero (YouTube). Usar dominio `-nocookie`
  y `sandbox`/`allow` mínimos (`allow="encrypted-media; picture-in-picture"`).

### Modelo de datos

Migración nueva `..._feature020_animal_video.sql`:

- **Cap de tamaño del bucket:** `update storage.buckets set file_size_limit = <bytes>
  where id = 'animal-media';` (p.ej. 25 MB). Nota: aplica también a fotos (que van ≤300 KB, sin problema).
- **Portada solo foto:** reforzar que `is_cover` no pueda ser un vídeo. Opciones:
  índice/constraint que exija `type='photo'` cuando `is_cover` es true, o dejarlo
  a la UI. **Decisión:** añadir `check` vía trigger o parcial — al ser `is_cover`
  ya un índice único parcial, añadir constraint `animal_media_cover_is_photo`
  (`check (not is_cover or type = 'photo')`).
- El enum `media_type` **ya tiene** `'video'` y `'youtube'` → sin cambios de enum.

### API

- **Sin nuevos Route Handlers.** Alta/edición usa el cliente Supabase directo
  (mismo patrón que fotos). El conteo/lectura de la ficha ya trae `animal_media`.
- **RPC `animals_search`:** modificar el subquery de miniatura para filtrar
  `and m.type = 'photo'` (que la tarjeta nunca coja un vídeo como thumbnail).
  Migración incluida arriba.

### Frontend

1. **`lib/image.ts` / nuevo `lib/media.ts`:** helpers puros
   - `parseYoutubeId(url): string | null` (soporta `youtu.be/`, `watch?v=`, `/embed/`, `/shorts/`).
   - `youtubeEmbedUrl(id): string` → `youtube-nocookie.com/embed/<id>`.
   - `youtubeThumb(id): string` → `img.youtube.com/vi/<id>/hqdefault.jpg` (miniatura del carrusel).
   - `esVideoMp4(file): boolean`, `VIDEO_MAX_MB`.
   - `rutaVideo(shelterId, animalId, file)` (extensión `.mp4`).
2. **`AnimalMediaUploader.tsx`:** además de "Añadir fotos":
   - Botón "Añadir vídeo de YouTube" → input URL → valida `parseYoutubeId` →
     inserta fila `type:'youtube', url: canonical, is_cover:false`.
   - Botón "Subir vídeo (MP4)" → `accept="video/mp4"` → valida mime+tamaño →
     sube a bucket (sin comprimir) → fila `type:'video'`.
   - "Marcar portada" deshabilitado para vídeos (portada = foto).
   - La miniatura de la lista de gestión muestra póster (thumb YouTube / primer
     frame o icono ▶) para vídeos.
3. **`AnimalGallery.tsx`:** dejar de descartar vídeos. Render del slot principal
   según `type`: `photo`→`<Image>`, `youtube`→`<iframe>` embed, `video`→`<video controls>`.
   Miniaturas con overlay ▶ para los vídeos. Orden: portada (foto) primero, resto
   por `sort_order` con independencia del tipo.
4. **Selección de "portada" en consumidores de miniatura** — asegurar foto:
   [page.tsx `portada`](../../../src/app/(public)/animales/[slug]/page.tsx#L86),
   ruta OG y `animals_search` (ver API). `AnimalCard` usa la url del RPC → cubierto por el filtro.
5. **i18n `messages/es.json`** (namespace `animales` y `ficha`): `addYoutube`,
   `youtubeUrl`, `addVideo`, `errNotVideo`, `errVideoTooBig`, `errYoutubeUrl`,
   `videoLabel`, `playVideo`, etc.

### Tareas TDD

1. `lib/media` — test `parseYoutubeId` (formatos válidos + basura → null) → implementar.
2. `lib/media` — test `youtubeEmbedUrl`/`youtubeThumb`/`esVideoMp4`/`VIDEO_MAX_MB` → implementar.
3. `AnimalGallery` — test: con `type:'youtube'` pinta iframe nocookie con el id correcto → implementar.
4. `AnimalGallery` — test: con `type:'video'` pinta `<video>`; miniaturas con overlay ▶; foto sigue en `<Image>` → implementar.
5. `AnimalMediaUploader` — test: URL YouTube válida inserta fila `type:'youtube'`; URL inválida muestra error, sin insert → implementar.
6. `AnimalMediaUploader` — test: MP4 válido sube+inserta `type:'video'`; no-MP4 o >tope → error, sin insert; "portada" deshabilitada en vídeos → implementar.
7. Migración + test RLS/RPC: `animals_search` devuelve la **foto** como thumbnail aunque el vídeo tenga `sort_order` menor → implementar migración.
8. Migración: constraint `is_cover ⇒ type='photo'` + test (intento de marcar vídeo como portada falla) → implementar.
9. Ficha (`page.tsx`) — test: `portada`/OG usan una foto, no un vídeo → ajustar selección.
10. i18n — comprobar que no quedan textos hardcodeados (todas las claves nuevas en `es.json`).

> ⚠️ 10 tareas: en el límite. **Opción de entrega por fases** si se prefiere reducir
> riesgo: **Fase A = solo YouTube** (tareas 1,3,5,7,9,10 + parte migración) y
> **Fase B = MP4 subido** (2,4,6,8 + `file_size_limit`). YouTube es coste 0 € y
> menor superficie; se puede cerrar y desplegar antes. Decidir en aprobación.

### Dependencias

- Ninguna. Trabaja sobre `animal_media` y el bucket `animal-media` ya existentes
  (FEATURE-003). Coexiste con IMPROVEMENT-020 (rediseño de ficha ya integrado).

## Estado de entrega

- **Fase A (YouTube) — HECHA.** El alta de YouTube ya existía (`lib/youtube.ts`,
  campo en `AnimalForm`) pero la ficha lo pintaba roto (`<Image>` con URL de
  vídeo). Arreglado: `AnimalGallery` distingue por `type` y pinta embed
  `-nocookie`; la ficha/OG/`animals_search` traen `type` y garantizan
  miniatura solo-foto; constraint BD `is_cover ⇒ type='photo'`.
- **Fase B (MP4 subido) — HECHA.** `AnimalMediaUploader` con botón "Subir vídeo
  (MP4)", validación `esVideoMp4` + cap 25 MB (`lib/video.ts`) + `file_size_limit`
  del bucket; `<video controls>` en el carrusel y preview en la lista de gestión;
  "portada" deshabilitada en vídeos; la edición carga fotos+vídeos y el mínimo de
  publicación cuenta solo fotos.

## Criterios de aceptación / Casuística a cubrir

- [x] Alta/edición: la protectora puede añadir un vídeo de YouTube pegando la URL.
- [x] Alta/edición: la protectora puede subir vídeo MP4 (≤ 25 MB); mime/tamaño inválidos se rechazan con mensaje claro y sin dejar fila ni fichero huérfano.
- [x] Ficha: el carrusel muestra fotos y vídeos mezclados; YouTube como embed `-nocookie`, MP4 con controles nativos; miniaturas de vídeo con overlay ▶.
- [x] La **portada** (tarjetas, OG, schema.org, `animals_search`) es **siempre una foto**, nunca un vídeo, aunque el vídeo tenga menor `sort_order`.
- [x] Intentar marcar un vídeo como portada está bloqueado en UI y rechazado por la BD (constraint).
- [x] Estado vacío (0 media) y solo-vídeo (0 fotos): la ficha no rompe; portada/OG caen a placeholder de pata.
- [x] Seguridad: URL de YouTube no se inyecta cruda; solo se renderiza el embed derivado de un `videoId` validado. Sin XSS.
- [x] RLS Storage: solo la protectora dueña sube/borra sus vídeos MP4 (misma política de carpeta que fotos, ya probada en FEATURE-003); lectura pública igual que fotos.
- [x] Sin textos hardcodeados: todo en `messages/es.json`.
- [x] Borrar un vídeo MP4 elimina fichero y fila; borrar la portada asciende la siguiente **foto**.

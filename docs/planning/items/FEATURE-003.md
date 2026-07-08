---
id: FEATURE-003
tipo: feature
titulo: Gestión de animales con fotos y vídeo (panel protectora)
estado: hecho
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-07
---

# FEATURE-003 — Gestión de animales con fotos y vídeo

## Descripción

La protectora da de alta y mantiene fichas completas de sus animales: datos básicos, carácter (con estado "no sabemos"), salud, historia, fotos con portada y orden, vídeo corto o enlace de YouTube. Puede guardar borrador, publicar, duplicar y cambiar estado (en adopción → reservado → adoptado). (Ref: P3, P4, P8)

## Contexto / impacto

Es el contenido de la plataforma. La calidad de las fichas determina las adopciones; el flujo debe ser cómodo para voluntarios no técnicos desde el móvil.

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`animals`, `animal_media`), prompts Stitch §2.3-2.4, skills `adoptia-frontend`, `adoptia-database`

### Seguridad

- RLS: solo el `owner` del shelter escribe sus animales/media.
- Storage: bucket `animal-media`, política por carpeta `shelter_id/`; validar MIME y tamaño (foto ≤300 KB tras compresión, vídeo ≤50 MB).
- URLs de YouTube: validar patrón y renderizar solo embed sandbox.

### Modelo de datos

- `animals` + `animal_media` de baseline. Slug generado `nombre-hash6`.

### API

- Sin handlers: supabase-js directo con RLS (subida a Storage incluida).

### Frontend

- Listado gestión (Stitch 2.3): tabla desktop / cards móvil, filtros por estado, acciones fila.
- Formulario por secciones (Stitch 2.4): uploader drag&drop con compresión cliente (browser-image-compression), portada con estrella, reordenación, campo YouTube.
- Toggles tri-estado (Sí/No/No sabemos) para compatibilidades.

### Tareas TDD

1. Test esquema Zod ficha (borrador permite campos vacíos; publicar exige mínimos).
2. Test compresión: imagen 5 MB → ≤300 KB antes de subir.
3. Test: borrador (`published_at null`) invisible en público; publicar lo hace visible.
4. Test estados: transiciones válidas e histórico.
5. Test duplicar: copia todo menos slug, fotos y estado (nuevo borrador).
6. E2E: alta completa con 3 fotos + portada + publicar.

### Dependencias

- FEATURE-002 (solo protectoras verificadas publican).

## Criterios de aceptación / Casuística a cubrir

- [x] Alta completa desde móvil con fotos de cámara; compresión automática en cliente.
- [x] Guardar borrador con solo el nombre; publicar exige: especie, sexo, tamaño, ≥1 foto, descripción.
- [x] Portada marcable y orden de fotos persistente; borrar foto de Storage al quitarla.
- [x] Enlace YouTube inválido rechazado con mensaje claro.
- [x] Protectora A no puede editar animales de protectora B (RLS, probado por test).
- [x] Cambio a "adoptado" pide confirmación; el animal deja de aparecer en búsquedas (el filtro de búsqueda ya exige `status='available'`; la búsqueda pública llega en FEATURE-005).
- [x] Protectora no verificada puede preparar borradores pero NO publicar.
- [x] Subida que falla a mitad no deja media huérfana referenciada (Storage antes que la fila).

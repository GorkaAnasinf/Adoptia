# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-020 hecho** — vídeos en la ficha del animal: YouTube (embed `youtube-nocookie` en el carrusel, antes se pintaba roto) + MP4 subido (≤ 25 MB) con reproductor nativo; miniaturas de vídeo con ▶; la miniatura de tarjeta/OG/schema es siempre foto (`animals_search`/OG filtran `type='photo'`); constraint `is_cover ⇒ type='photo'` y `file_size_limit` del bucket. Antes: IMPROVEMENT-020 (ficha), 019 (listado), 018 (home).
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista o se detecte probando la plataforma.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** aplicar en producción las migraciones `20260713140000_improvement020_contar_interesados.sql`, `20260714120000_feature020_video_thumbnails.sql` y `20260714130000_feature020_video_bucket_limit.sql` (`supabase db push`).
- **Follow-ups abiertos:** re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Última actualización:** 2026-07-14 (cierre de FEATURE-020 — vídeos en la ficha del animal).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
_No hay items abiertos._
<!-- RENDER:END -->

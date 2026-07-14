# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **IMPROVEMENT-021 hecha** — el buscador de la cabecera filtra de verdad por texto (nombre/raza): el RPC `animals_search` gana `p_query` (`ilike` sobre `name`/`breed`), el listado suma campo de texto y el término viaja en la URL. Antes: FEATURE-021 (menú por rol + rediseño de la cabecera pública).
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista o se detecte probando.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — la migración `20260714150000_improvement021_animals_search_query` (nuevo `p_query` en `animals_search`) **aplicada en producción el 2026-07-14** (`supabase db push`; verificada en local con `db reset` + los 11 tests RLS de `animal-search` en verde).
- **Follow-ups abiertos:** re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Última actualización:** 2026-07-14 (IMPROVEMENT-021 cerrada — búsqueda de texto por nombre/raza en el listado; pendiente `supabase db push` en producción).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
_No hay items abiertos._
<!-- RENDER:END -->

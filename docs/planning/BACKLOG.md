# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **IMPROVEMENT-018 hecho** — rediseño de la home pública según mockup: buscador en el hero (especie + ciudad geocodificada + GPS), recién llegados con badge y CTA, pasos con «Concierta una cita», banda teal de stats reales y CTA de protectoras con foto. Antes, IMPROVEMENT-017 (dashboard de protectora).
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista o se detecte probando la plataforma.
- **Bloqueos:** ninguno. Migraciones y secrets de crons aplicados (confirmado 2026-07-12).
- **Follow-ups abiertos:** re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas.
- **Última actualización:** 2026-07-13 (cierre de IMPROVEMENT-018 — rediseño de la home pública).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [IMPROVEMENT-019](items/IMPROVEMENT-019.md) | Rediseño del listado /animales (filtros horizontales, tarjetas con favorito y paginación numerada) | media | 0.5 |
<!-- RENDER:END -->

# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **IMPROVEMENT-020 hecho** — rediseño de la ficha /animales/[slug]: sidebar de acción sticky («¿Te has enamorado?» con CTA + «Guardar para luego» + contador real y anónimo de interesados), tarjeta verde «Proceso de adopción», rasgos inline con iconos, compatibilidad en pills de color y salud con checks. Nuevo RPC `contar_interesados`. Antes: IMPROVEMENT-019 (listado), 018 (home), 017 (dashboard).
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista o se detecte probando la plataforma.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** aplicar en producción la migración `20260713140000_improvement020_contar_interesados.sql` (`supabase db push`).
- **Follow-ups abiertos:** re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Última actualización:** 2026-07-13 (cierre de IMPROVEMENT-020 — rediseño de la ficha de animal).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
_No hay items abiertos._
<!-- RENDER:END -->

# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **IMPROVEMENT-016 hecho** — redirección post-login según rol (detectado probando: la protectora caía en la home): helper `destinoPostLogin`, aplicado en login con contraseña y callback OAuth; shelter → `/panel`, admin → `/admin`, adoptante → `/`, con `?redirect` interno respetado.
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista o se detecte probando la plataforma.
- **Bloqueos:** ninguno. Migraciones y secrets de crons aplicados (confirmado 2026-07-12).
- **Follow-ups abiertos:** re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012).
- **Última actualización:** 2026-07-13 (cierre de IMPROVEMENT-016 — redirección post-login por rol).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [IMPROVEMENT-017](items/IMPROVEMENT-017.md) | Rediseño del dashboard de protectora (tarjetas de color y próximas citas) | media | 0.5 |
<!-- RENDER:END -->

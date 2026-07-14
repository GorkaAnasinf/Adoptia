# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-021 hecha (fases 1 y 2)** — menú del avatar adaptado al rol (protectora → «Panel de protectora», adoptante → favoritos/solicitudes/citas, admin → su panel; rol leído en servidor, acceso real en el middleware) **y** rediseño de la cabecera pública (marca con huella, nav con estado activo, buscador pill, fila de breadcrumbs y menú móvil en drawer). Antes: BUG-004 hecho + rediseño del cuestionario de alta.
- **Siguiente:** nada en cola. Candidato listo: **IMPROVEMENT-021** — buscador de texto/raza real en `animals_search` (hoy el buscador de la cabecera solo enlaza a `/animales`).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — FEATURE-021 es solo frontend/lectura, sin migraciones. Todas las migraciones hasta `20260714140000_bug004` aplicadas en producción el 2026-07-14 (`supabase db push`).
- **Follow-ups abiertos:** re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Última actualización:** 2026-07-14 (FEATURE-021 cerrada — menú por rol + rediseño de la cabecera pública; abierto follow-up IMPROVEMENT-021 para el buscador de texto real).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [IMPROVEMENT-021](items/IMPROVEMENT-021.md) | Búsqueda por texto/raza en el listado de animales | baja | — |
<!-- RENDER:END -->

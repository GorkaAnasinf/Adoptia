# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-021 fase 1 hecha** (item aún en desarrollo) — el menú del avatar ahora se adapta al rol: la protectora ve «Panel de protectora» (→ `/panel`), el adoptante sus accesos (favoritos/solicitudes/citas) y el admin su panel. Rol leído en servidor (`profiles.role`); acceso real sigue en el middleware. Antes: BUG-004 hecho («Reservar cita» ya no da 404) + rediseño del cuestionario de alta.
- **Siguiente:** **FEATURE-021 fase 2** — rediseño visual del top bar público (buscador «Buscar raza…», fila de breadcrumbs, menú móvil), a la espera de mockups de Stitch.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — sin migraciones nuevas en FEATURE-021 (cambio solo de frontend/lectura). Todas las migraciones hasta `20260714140000_bug004` aplicadas en producción el 2026-07-14 (`supabase db push`).
- **Follow-ups abiertos:** re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Última actualización:** 2026-07-14 (FEATURE-021 fase 1 — acceso al panel por rol desde el menú del avatar; item sigue abierto para la fase 2 de rediseño visual).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 🔨 En desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-021](items/FEATURE-021.md) | Rediseño de la cabecera superior con menú de usuario por rol | media | 0.5 |
<!-- RENDER:END -->

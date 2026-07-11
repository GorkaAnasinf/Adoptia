# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.2 — MVP (en dos bloques: 🐕 protectora → 🧑 persona; ver "Orden de trabajo" en ROADMAP)
- **Progreso:** Bloque A (protectora) completo. Bloque B: FEATURE-005, 006 y 007 hechos, y **FEATURE-008 hecho** (SEO: og:image/JSON-LD/sitemap/robots; páginas de error y textos legales; contadores reales en home; seed de demo con 4 protectoras y 23 animales validado con `supabase db reset`). **Hito 0.2 (MVP) completo.**
- **Siguiente:** FEATURE-009 (citas con calendario, hito 0.3).
- **En curso:** nada.
- **Bloqueos:** ⚠️ pendiente de ejecutar a mano `npx supabase db push` (migración del slug de IMPROVEMENT-001 al Supabase remoto; bloqueada al agente por permisos).
- **Follow-ups abiertos:** re-medir Lighthouse de la ficha y LCP del listado en producción cuando haya animales publicados reales (hoy solo hay rutas estáticas; ver cierre de IMPROVEMENT-012). "Próximas citas" del dashboard llega con FEATURE-009.
- **Última actualización:** 2026-07-11 (cierre de IMPROVEMENT-012 — umbral de funciones de vuelta a 70; Lighthouse prod OK).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (8)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-009](items/FEATURE-009.md) | Citas con calendario y agenda de disponibilidad | alta | 0.3 |
| [FEATURE-010](items/FEATURE-010.md) | Área personal del adoptante — solicitudes, favoritos y alertas | media | 0.3 |
| [FEATURE-011](items/FEATURE-011.md) | Moderación de contenido y cuentas (admin) | media | 0.3 |
| [FEATURE-012](items/FEATURE-012.md) | Animales perdidos y encontrados | media | 0.4 |
| [FEATURE-013](items/FEATURE-013.md) | Apadrinamiento y donaciones | baja | 0.4 |
| [FEATURE-014](items/FEATURE-014.md) | Estadísticas para protectoras y difusión en redes | baja | 0.4 |
| [FEATURE-015](items/FEATURE-015.md) | Contenido educativo sobre adopción responsable | baja | 0.4 |
| [FEATURE-016](items/FEATURE-016.md) | Registro de casas de acogida | baja | 0.4 |
<!-- RENDER:END -->

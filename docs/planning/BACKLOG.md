# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.2 — MVP (en dos bloques: 🐕 protectora → 🧑 persona; ver "Orden de trabajo" en ROADMAP)
- **Progreso:** Bloque A (protectora) completo. Bloque B: FEATURE-005, 006 y 007 hechos, y **FEATURE-008 hecho** (SEO: og:image/JSON-LD/sitemap/robots; páginas de error y textos legales; contadores reales en home; seed de demo con 4 protectoras y 23 animales validado con `supabase db reset`). **Hito 0.2 (MVP) completo.**
- **Siguiente:** FEATURE-014 (estadísticas para protectoras y difusión en redes).
- **En curso:** nada.
- **Bloqueos (operación manual pendiente):** ⚠️ `npx supabase db push` (6 migraciones pendientes: slug, citas, favoritos/alertas, moderación, perdidos/encontrados y apadrinamiento; bloqueado al agente por permisos) y ⚠️ secrets de GitHub Actions `SITE_URL` + `CRON_SECRET` (más `CRON_SECRET` en Vercel) para activar los crons.
- **Follow-ups abiertos:** re-medir Lighthouse de la ficha y LCP del listado en producción cuando haya animales publicados reales (ver cierre de IMPROVEMENT-012).
- **Última actualización:** 2026-07-11 (cierre de FEATURE-013 — apadrinamiento y donaciones).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (3)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-014](items/FEATURE-014.md) | Estadísticas para protectoras y difusión en redes | baja | 0.4 |
| [FEATURE-015](items/FEATURE-015.md) | Contenido educativo sobre adopción responsable | baja | 0.4 |
| [FEATURE-016](items/FEATURE-016.md) | Registro de casas de acogida | baja | 0.4 |
<!-- RENDER:END -->

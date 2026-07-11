# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.2 — MVP (en dos bloques: 🐕 protectora → 🧑 persona; ver "Orden de trabajo" en ROADMAP)
- **Progreso:** Bloque A (protectora) completo. Bloque B: FEATURE-005, 006 y 007 hechos, y **FEATURE-008 hecho** (SEO: og:image/JSON-LD/sitemap/robots; páginas de error y textos legales; contadores reales en home; seed de demo con 4 protectoras y 23 animales validado con `supabase db reset`). **Hito 0.2 (MVP) completo.**
- **🎉 BACKLOG DE FEATURES COMPLETO:** los hitos 0.2, 0.3 y 0.4 están cerrados al completo (FEATURE-005…016 + BUG-001 + IMPROVEMENT-001/012/013).
- **Siguiente:** IMPROVEMENT-014 (flaky ocasional de tests RLS por concurrencia; prioridad baja) y lo que entre por la pasarela del analista.
- **Bloqueos (operación manual pendiente):** ⚠️ `npx supabase db push` (**8 migraciones** pendientes: slug, citas, favoritos/alertas, moderación, perdidos/encontrados, apadrinamiento, estadísticas y acogida; bloqueado al agente por permisos) y ⚠️ secrets de GitHub Actions `SITE_URL` + `CRON_SECRET` (más `CRON_SECRET` en Vercel) para activar los crons.
- **Follow-ups abiertos:** re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012).
- **Última actualización:** 2026-07-11 (cierre de FEATURE-016 — casas de acogida; fin del backlog de features).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [IMPROVEMENT-014](items/IMPROVEMENT-014.md) | Tests RLS ocasionalmente flaky por concurrencia entre ficheros | baja | — |
<!-- RENDER:END -->

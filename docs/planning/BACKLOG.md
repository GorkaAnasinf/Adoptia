# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.2 — MVP (en dos bloques: 🐕 protectora → 🧑 persona; ver "Orden de trabajo" en ROADMAP)
- **Progreso:** Bloque A (protectora) completo. Bloque B: FEATURE-005, 006 y 007 hechos, y **FEATURE-008 hecho** (SEO: og:image/JSON-LD/sitemap/robots; páginas de error y textos legales; contadores reales en home; seed de demo con 4 protectoras y 23 animales validado con `supabase db reset`). **Hito 0.2 (MVP) completo.**
- **🎉 BACKLOG DE FEATURES COMPLETO:** los hitos 0.2, 0.3 y 0.4 están cerrados al completo (FEATURE-005…016 + BUG-001 + IMPROVEMENT-001/012/013).
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista. **CI de main verde de nuevo** (IMPROVEMENT-014: llevaba en rojo desde 0.0.29 por cobertura; regla nueva: el QA corre siempre con `--coverage`).
- **Bloqueos:** ninguno. ✅ Migraciones aplicadas con `npx supabase db push` (las 8 pendientes: slug, citas, favoritos/alertas, moderación, perdidos/encontrados, apadrinamiento, estadísticas y acogida) y ✅ secrets configurados (`SITE_URL` + `CRON_SECRET` en GitHub Actions y `CRON_SECRET` en Vercel) — crons activos. (Confirmado 2026-07-12.)
- **Follow-ups abiertos:** re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012).
- **Última actualización:** 2026-07-12 (cierre de IMPROVEMENT-015 — README reescrito y manual de usuario nuevo en `docs/manual/MANUAL_USUARIO.md` para la entrega del TFM; además, confirmadas las operaciones manuales: migraciones aplicadas y secrets de crons configurados).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
_No hay items abiertos._
<!-- RENDER:END -->

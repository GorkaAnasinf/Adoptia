# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-024 hecha** — los avisos de perdidos admiten varias fotos: galería en el alta (elegir portada, quitar) y en la ficha (miniaturas navegables). Espeja `animal_media`; se migra `photo_url` a `lost_found_media` y se retira la columna. Suite: **921 verdes**. Antes, en esta racha de la sección perdidos: BUG-008 (suite E2E de 8/28 a 28/28 y activa en CI, + 2 bugs del mapa), FEATURE-023 (señas y fecha del suceso), FEATURE-022 (contacto y avistamientos), y la tanda de infra BUG-005/006/007 + IMPROVEMENT-022/023.
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista o se detecte probando.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — la migración `20260716120000_feature024_lost_found_media` **aplicada en producción el 2026-07-16**, verificada antes en local y en CI (921/921, E2E de galería), confirmada con `migration list --linked`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-16 (FEATURE-024 cerrada — galería multi-foto en los avisos; pendiente `db push` de su migración).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
_No hay items abiertos._
<!-- RENDER:END -->

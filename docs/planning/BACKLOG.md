# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-025/026/027 hechas** — rediseño de las tres pantallas de perdidos según mockups del usuario: listado (tarjetas verticales, «Más filtros» colapsable, «Ver todos»), ficha (dos columnas, compartir, consejos de seguridad, breadcrumbs) y alta (tarjetas de sección, dropzone, «Cancelar y volver»). Solo presentación: sin cambios de BD ni API. Entregadas en tanda en `feature/FEATURE-025-rediseno-perdidos` con la suite completa **una sola vez al final** (decisión del usuario): verde, cobertura 81,3 % global / 96,6 % `src/lib`. Antes: FEATURE-024 (galería multi-foto, migración ya aplicada en producción), BUG-008, FEATURE-023, FEATURE-022.
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista o se detecte probando.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — la migración `20260716120000_feature024_lost_found_media` **aplicada en producción el 2026-07-16**, verificada antes en local y en CI (921/921, E2E de galería), confirmada con `migration list --linked`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-16 (FEATURE-025/026/027 cerradas y **liberadas a producción** — rediseño de la sección perdidos; CI verde completo, incl. RLS y E2E; pendiente probar en real).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-028](items/FEATURE-028.md) | Rediseño del perfil público de protectora (mockup nuevo) | alta | 0.5 |
<!-- RENDER:END -->

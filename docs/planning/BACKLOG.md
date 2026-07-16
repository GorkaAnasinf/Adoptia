# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **BUG-008 hecho** — la suite E2E vuelve a funcionar: de **8 verdes de 28 a 28**, y CI la ejecuta **en cada push**. No estaba rota la app: los tests se quedaron atrás porque nadie los corría (BUG-007). De paso aparecieron **dos bugs de producto del mapa** (seleccionar en la lista no mostraba nada si el marcador estaba agrupado, ni si el mapa no había montado). Antes: **FEATURE-023** — los avisos ya describen al animal y dicen cuándo pasó, con filtros de especie/tamaño/fecha. Suite unitaria+RLS: **903 verdes**. Antes, en la misma sesión: IMPROVEMENT-022 (E2E con guard anti-skip y job listo, troceada → BUG-008), IMPROVEMENT-023 (CI en Node 24), BUG-007 (CI ejecuta los 123 tests de RLS), BUG-006 (portada solo de fotos), BUG-005 (cobertura en Windows) y FEATURE-022 (contacto por relay y avistamientos).
- **Siguiente:** FEATURE-024 (galería multi-foto en los avisos, troceada de FEATURE-023) — `recibido`, le falta el plan de Snoopy.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — la migración `20260715180000_feature023_avisos_datos_identificativos` **aplicada en producción el 2026-07-15**, verificada antes en local (903/903 con `db reset`) y confirmada con `migration list --linked`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-16 (BUG-008 cerrado — suite E2E verde 28/28 y activa en CI; 2 bugs del mapa arreglados).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-024](items/FEATURE-024.md) | Galería de fotos en los avisos de perdidos (hoy solo cabe una) | media | 0.5 |
<!-- RENDER:END -->

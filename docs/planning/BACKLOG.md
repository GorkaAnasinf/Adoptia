# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **BUG-007 hecho** — CI ejecuta por fin los **123 tests de RLS** (job `rls` con Postgres real; verificado en CI: run `29420675687`, `18 passed (18)`, cero `skipped`, 3 min). El salto deja de ser silencioso: con `CI=true` y sin variables la suite falla en vez de saltarse. Comprobado abriendo una policy a propósito: CI en rojo. Era el agujero por el que BUG-006 llegó a producción. Antes: BUG-006 (portada solo de fotos), BUG-005 (cobertura en Windows) y **FEATURE-022** (contacto por relay y avistamientos en los avisos de perdidos).
- **Siguiente:** FEATURE-023 (ficha identificativa del aviso: raza/sexo/tamaño/chip booleano, `lost_at`, galería y filtros), IMPROVEMENT-022 (los E2E tampoco corren en CI — misma trampa que BUG-007, y el job `rls` ya levanta el stack) e IMPROVEMENT-023 (CI en Node 20, ya deprecado; el job de RLS tuvo que subir a 22). Los tres `recibido`, les falta el plan de Snoopy.
- **Bloqueos:** ninguno. FEATURE-022 quedó verificada el 2026-07-15 (`db reset` limpio, 9/9 RLS y 3/3 E2E; el trigger de redondeo engancha, así que producción no guarda ubicaciones exactas). Se desplegó antes de verificar y salió bien, pero fue una apuesta. **Pendiente de despliegue:** nada — la migración `20260715160000_bug006_cover_url_solo_fotos` **aplicada en producción el 2026-07-15**, esta vez verificada ANTES (`db reset` + 882/882 en verde) y confirmada con `migration list --linked`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Última actualización:** 2026-07-15 (BUG-007 cerrado — CI ejecuta los 123 tests de RLS; IMPROVEMENT-022 abierta para los E2E).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (3)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-023](items/FEATURE-023.md) | Avisos de perdidos — ficha identificativa completa, galería y filtros | media | 0.5 |
| [IMPROVEMENT-022](items/IMPROVEMENT-022.md) | Ejecutar los E2E de Playwright en CI, aprovechando el stack que ya levanta el job de RLS | media | 0.5 |
| [IMPROVEMENT-023](items/IMPROVEMENT-023.md) | Subir CI y el runtime a Node 22+ (hoy el job de la app va en Node 20, ya deprecado) | media | 0.5 |
<!-- RENDER:END -->

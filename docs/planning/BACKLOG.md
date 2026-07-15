# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-023 hecha** — los avisos de perdidos ya describen al animal (raza, color, sexo, tamaño, collar, microchip sí/no) y dicen **cuándo pasó**, no solo cuándo se publicaron; el listado gana filtros de especie, tamaño y fecha. Todo opcional: el alta sigue cabiendo en <2 min. Suite: **903 verdes**. Antes, en la misma sesión: IMPROVEMENT-022 (E2E con guard anti-skip y job listo, troceada → BUG-008), IMPROVEMENT-023 (CI en Node 24), BUG-007 (CI ejecuta los 123 tests de RLS), BUG-006 (portada solo de fotos), BUG-005 (cobertura en Windows) y FEATURE-022 (contacto por relay y avistamientos).
- **Siguiente:** **BUG-008** (alta — sanear la suite E2E: 14 fallos de 26; hasta entonces el job `e2e` no se activa en cada push) y FEATURE-024 (galería multi-foto en los avisos, troceada de FEATURE-023). Ambos `recibido`, les falta el plan de Snoopy.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** ⚠️ migración `20260715180000_feature023_avisos_datos_identificativos` — verificada en local (903/903), **sin aplicar en producción** todavía.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Aviso para quien trabaje en local:** correr los E2E deja el stack inservible para la suite de RLS (9 fallos después), y `supabase db reset` **no basta** — hace falta `supabase stop --no-backup` + `start`. Es parte de BUG-008.
- **Última actualización:** 2026-07-15 (FEATURE-023 cerrada — señas, fecha del suceso y filtros; pendiente `db push` de su migración).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (2)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [BUG-008](items/BUG-008.md) | La suite E2E está podrida — 14 de 26 fallan al ejecutarla entera | alta | 0.5 |
| [FEATURE-024](items/FEATURE-024.md) | Galería de fotos en los avisos de perdidos (hoy solo cabe una) | media | 0.5 |
<!-- RENDER:END -->

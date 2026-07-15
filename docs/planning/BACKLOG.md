# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **IMPROVEMENT-022 hecha (troceada)** — los E2E ya no pueden saltarse en silencio (`e2e/entorno.ts` aborta en CI) y el job `e2e` está listo, aunque **solo lanzable a mano**: al correr la suite entera por primera vez salieron **14 fallos de 26** — los tests están podridos, no la app → **BUG-008**. Antes: IMPROVEMENT-023 (CI en Node 24, el de producción) y BUG-007 (CI ejecuta los 123 tests de RLS). Antes: BUG-006 (portada solo de fotos), BUG-005 (cobertura en Windows) y **FEATURE-022** (contacto por relay y avistamientos en los avisos de perdidos).
- **Siguiente:** **BUG-008** (alta — sanear la suite E2E: 14 fallos de 26; hasta entonces el job `e2e` no se activa en cada push) y FEATURE-023 (ficha identificativa del aviso: raza/sexo/tamaño/chip booleano, `lost_at`, galería y filtros). Ambos `recibido`, les falta el plan de Snoopy.
- **Bloqueos:** ninguno. FEATURE-022 quedó verificada el 2026-07-15 (`db reset` limpio, 9/9 RLS y 3/3 E2E; el trigger de redondeo engancha, así que producción no guarda ubicaciones exactas). Se desplegó antes de verificar y salió bien, pero fue una apuesta. **Pendiente de despliegue:** nada — la migración `20260715160000_bug006_cover_url_solo_fotos` **aplicada en producción el 2026-07-15**, esta vez verificada ANTES (`db reset` + 882/882 en verde) y confirmada con `migration list --linked`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Aviso para quien trabaje en local:** correr los E2E deja el stack inservible para la suite de RLS (9 fallos después), y `supabase db reset` **no basta** — hace falta `supabase stop --no-backup` + `start`. Es parte de BUG-008.
- **Última actualización:** 2026-07-15 (IMPROVEMENT-022 cerrada y troceada; BUG-008 abierto — la suite E2E está podrida).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (2)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [BUG-008](items/BUG-008.md) | La suite E2E está podrida — 14 de 26 fallan al ejecutarla entera | alta | 0.5 |
| [FEATURE-023](items/FEATURE-023.md) | Avisos de perdidos — ficha identificativa completa, galería y filtros | media | 0.5 |
<!-- RENDER:END -->

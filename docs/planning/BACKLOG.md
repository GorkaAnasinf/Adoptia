# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-031 hecha** (rama `feature/FEATURE-031-tablon-necesidades`) — tablón de necesidades: `shelter_needs` (RLS deny-by-default: escribe solo dueña verificada, público solo abiertas de verificadas, historial reabrible) + RPC `shelter_needs_nearby` (urgentes primero + cercanía), handler «Puedo ayudar» (relay con Reply-To, 5/h), `/panel/necesidades` con entrada en sidebar, tablón público `/necesidades` (filtros + ciudad vía helper `buscarCiudad`) y sección «Necesitamos» en el perfil público. QA Scooby 6/6; suite **1059/1059 con RLS**, cobertura 82,4 % / 96,6 % `src/lib`. Antes: FEATURE-030 (relevo, en producción).
- **Siguiente:** FEATURE-033 (alertas de búsqueda guardada, favorita del usuario) o FEATURE-032 (donaciones de particulares). Probar en real el tablón con las cuentas de prueba.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — la migración `20260718100000_feature031_shelter_needs.sql` **aplicada en producción el 2026-07-18** (dry-run previo, confirmada) y el release `2091ba0` desplegado en Vercel (READY).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-18 (FEATURE-031 **liberada a producción** — tablón de necesidades. Antes el mismo día: FEATURE-030 liberada. El 17: IMPROVEMENT-026 + backfill, FEATURE-029 e IMPROVEMENT-024/025 liberadas).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (2)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-032](items/FEATURE-032.md) | Ofertas de donación de particulares (material para protectoras) | media | — |
| [FEATURE-033](items/FEATURE-033.md) | Alertas de búsqueda guardada (avisos de nuevos animales) | media | — |
<!-- RENDER:END -->

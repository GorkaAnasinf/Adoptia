# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-029 hecha** (rama `feature/FEATURE-029-propuestas-acogida`) — propuestas de acogida estructuradas: tabla `foster_proposals` (cascada desde la baja del acogedor —decisión #40—, índice único parcial de propuesta abierta —#41—), handler con formulario obligatorio (animal opcional propio, duración, mensaje) y email ampliado, chip de estado + historial con acciones en `/panel/acogida`, y bloque «Propuestas recibidas» en `/acogida` y `/mi-cuenta/acogida`. QA Scooby 7/7; suite **1009/1009 con RLS**, cobertura 82,4 % / 96,7 % `src/lib`. Antes el mismo día: IMPROVEMENT-025 (acogidas en la navegación, **en producción**) y captura de FEATURE-029..033.
- **Siguiente:** elegir entre los capturados — candidatos: FEATURE-030 (relevo de acogida, ya desbloqueado por FEATURE-029), FEATURE-031 (tablón de necesidades) o FEATURE-033 (alertas de búsqueda guardada, favorita del usuario).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** IMPROVEMENT-026 — **`supabase db push` de la migración `20260717180000` ANTES del release** (dry-run primero). FEATURE-029 ya en producción (migración `20260717150000` aplicada, release `cdf53bf` READY).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-17 (IMPROVEMENT-026 cerrada — trigger que sincroniza el estado del animal con su acogida; **migración pendiente de producción**. Antes el mismo día: FEATURE-029 liberada a producción, IMPROVEMENT-024/025 liberadas, FEATURE-029..033 capturadas).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (4)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-030](items/FEATURE-030.md) | Relevo de acogida (emergencias del acogedor) | media | — |
| [FEATURE-031](items/FEATURE-031.md) | Tablón de necesidades de protectoras (pedir ayuda material) | media | — |
| [FEATURE-032](items/FEATURE-032.md) | Ofertas de donación de particulares (material para protectoras) | media | — |
| [FEATURE-033](items/FEATURE-033.md) | Alertas de búsqueda guardada (avisos de nuevos animales) | media | — |
<!-- RENDER:END -->

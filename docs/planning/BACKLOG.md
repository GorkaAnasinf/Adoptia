# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **IMPROVEMENT-025 hecha** (rama `feature/IMPROVEMENT-025-acogidas-navegacion`) — «Acogidas» en el sidebar de `/mi-cuenta` y en el menú del avatar, con página nueva `/mi-cuenta/acogida` que reutiliza `AcogidaForm` (alta, estado, pausa, baja); la pública `/acogida` intacta. QA Scooby 6/6; suite 836 passed (RLS skipped, sin cambios de RLS), cobertura 82,0 % / 96,7 % `src/lib`. Mismo día: capturados **FEATURE-029..033** (propuestas de acogida con trazabilidad, relevo de acogida, tablón de necesidades, donaciones de particulares, alertas de búsqueda guardada) tras la revisión del flujo de acogidas con el usuario. Antes: FEATURE-028 (perfil público, en producción), IMPROVEMENT-024.
- **Siguiente:** decidir cuál de los capturados se promueve — candidato natural **FEATURE-029** (arregla el reenvío infinito de avisos de acogida y da trazabilidad; FEATURE-030 depende de él). IMPROVEMENT-024 e IMPROVEMENT-025 (ambas solo UI, sin migración) **pendientes de liberar a producción**.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — la migración `20260717090000_feature028_perfil_publico.sql` **aplicada en producción el 2026-07-17** (dry-run previo, confirmada con `migration list --linked`) y el release `0aface2` desplegado en Vercel (READY) y verificado en real sobre `/protectoras/<slug>`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-17 (IMPROVEMENT-025 cerrada — acogidas visibles en la navegación del adoptante; capturados FEATURE-029..033. Antes el mismo día: IMPROVEMENT-024 cerrada y FEATURE-028 liberada a producción y verificada en real).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-029](items/FEATURE-029.md) | Propuestas de acogida estructuradas con trazabilidad | media | 0.5 |

### 📥 Recibido (4)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-030](items/FEATURE-030.md) | Relevo de acogida (emergencias del acogedor) | media | — |
| [FEATURE-031](items/FEATURE-031.md) | Tablón de necesidades de protectoras (pedir ayuda material) | media | — |
| [FEATURE-032](items/FEATURE-032.md) | Ofertas de donación de particulares (material para protectoras) | media | — |
| [FEATURE-033](items/FEATURE-033.md) | Alertas de búsqueda guardada (avisos de nuevos animales) | media | — |
<!-- RENDER:END -->

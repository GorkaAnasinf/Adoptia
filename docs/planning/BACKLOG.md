# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-038 hecha** (rama `feature/FEATURE-038-perdidos-rediseno`) — /perdidos-encontrados alineada al wireframe Stitch (quinta pantalla): hero terracota con CTA granate, chips tonales, panel «Más filtros» tonal, nota de privacidad como overlay del mapa, tarjetas aspect-square con badge granate/teal y enlace extendido, fecha absoluta del **suceso** (semántica de FEATURE-023 intacta), contador de avisos `aria-live` y marcadores del mapa alineados a granate/teal (`COLOR_AVISO` compartido). De regalo: el token `surface-container-highest` que faltaba en `globals.css` (hover de MapaFiltros era no-op). QA: suite **1138/1138 con RLS**, E2E perdidos + área pública 11/11. Antes: IMPROVEMENT-028, FEATURE-037/036/034 e IMPROVEMENT-027 (en producción).
- **Siguiente:** siguiente pantalla de la tanda (con wireframe en `assets/wireframes/<pantalla>/` o instrucción directa como el mapa).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** FEATURE-038 pendiente de liberar (merge a develop/main y verificación en producción; sin migraciones).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-19 (FEATURE-038 — rediseño de perdidos y encontrados, quinta pantalla de la tanda).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->

# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **IMPROVEMENT-028 hecha** (rama `feature/IMPROVEMENT-028-mapa-orden`) — el mapa /mapa alineado con la tanda (sin wireframe): panel y bottom sheet tonales, chips estilo tanda, tarjetas de lista con nombre terracota/distancia/chip de animales, y popup rico (`popup.ts` testeable: nombre, ciudad + distancia, animales, CTA granate; escape anti-XSS con test). Mecánica del mapa intacta (BUG-008). QA: suite **1133/1133 con RLS**, E2E mapa + área pública verdes. Antes: FEATURE-037/036/034 e IMPROVEMENT-027 (en producción).
- **Siguiente:** siguiente pantalla de la tanda (con wireframe en `assets/wireframes/<pantalla>/` o instrucción directa como el mapa).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** IMPROVEMENT-028 — merge y release en curso (sin migraciones).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-19 (IMPROVEMENT-028 — orden visual del mapa de protectoras, cuarta pantalla de la tanda).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->

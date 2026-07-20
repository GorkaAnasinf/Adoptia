# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **IMPROVEMENT-029 hecha** (rama `feature/IMPROVEMENT-029-popup-perdidos`) — el popup de los pines del mapa de perdidos pasa al lenguaje de IMPROVEMENT-028: título terracota (nombre o tipo si no hay), línea ciudad·fecha del suceso, chip tonal granate/teal y CTA «Ver aviso» granate a todo el ancho, en un componente puro (`PopupAviso`) reutilizable y testeable. Pedido por el usuario tras liberar FEATURE-038 al notar la diferencia con el popup rico del mapa de protectoras. QA: suite **1144/1144 con RLS**, E2E perdidos 4/4 en chromium (un flaky inicial en la pasada multi-proyecto resultó ser contaminación de datos de ejecuciones previas, patrón ya conocido de BUG-008 — no relacionado con este cambio). Antes: FEATURE-038, IMPROVEMENT-028, FEATURE-037/036/034 e IMPROVEMENT-027 (en producción).
- **Siguiente:** siguiente pantalla de la tanda (con wireframe en `assets/wireframes/<pantalla>/` o instrucción directa como el mapa).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — IMPROVEMENT-029 **liberada a producción el 2026-07-20** (release `74f4112`, verificado en `adoptia-eight.vercel.app/perdidos-encontrados`; sin migraciones).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-20 (IMPROVEMENT-029 — popup rico en el mapa de perdidos, coherencia con el mapa de protectoras).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->

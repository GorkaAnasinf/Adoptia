# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-041 hecha** (rama `feature/FEATURE-041-crear-alerta-listado`) — mejora del sistema de alertas detectada al cerrar FEATURE-040: crear una alerta ya no está escondido en el estado vacío del listado. `CrearAlertaButton` se refactoriza a `search: AnimalSearch` + `variant` (bloque/compacto); la cabecera de `/animales` estrena un botón teal **«Crear alerta»** siempre visible junto a «Ordenar por», **deshabilitado con pista** si no hay filtros guardables (especie/tamaño/sexo/distancia; texto/edad/flags no cuentan), y el nombre pasa a un **resumen de filtros** («Perro · Mediano · a 30 km») que casa con los chips de `AlertaCard`. Formato de `filters` sin cambios → cron y FEATURE-040 intactos. QA: suite **1033 verde**, typecheck y lint limpios; sin migraciones. Follow-up: guardar varios tamaños/sexos por alerta. Antes: **FEATURE-040** (mis alertas, release `4bd0cc7` 2026-07-20), FEATURE-039, IMPROVEMENT-029, FEATURE-038/037/036, IMPROVEMENT-028 (en producción).
- **Siguiente:** desplegar FEATURE-041 y luego siguiente pantalla de la tanda. **Verificación visual pendiente** de FEATURE-040/041 (dev local autenticado).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** **FEATURE-041** (sin migraciones). FEATURE-040 liberada el 2026-07-20 (release `4bd0cc7`). Antes: IMPROVEMENT-029 (release `74f4112`, verificada en `adoptia-eight.vercel.app/perdidos-encontrados`).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019); **buscador global en la cabecera del área privada** y **alineación de las seis subpáginas de `/mi-cuenta`** con el lenguaje del dashboard (ambos vistos en FEATURE-039).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-21 (FEATURE-041 — crear alerta desde la cabecera del listado, con resumen de filtros).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->

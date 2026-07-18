# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **IMPROVEMENT-027 hecha** (rama `feature/IMPROVEMENT-027-microinteracciones`) — vida en la home: cursor pointer restaurado globalmente (Tailwind v4 lo quitó de su preflight), `CountUp`/`Reveal`/`Parallax`/`PawTrail`/`HeaderScrollEffect` como componentes reutilizables (todos con `prefers-reduced-motion` y fallbacks defensivos), y sección «Historias felices» **con datos demo** (FEATURE-035 la hará real). QA: suite **1112/1112 con RLS**, E2E área pública 4/4, lint y tsc limpios. Antes el mismo día: FEATURE-034 (rediseño de la home, en producción).
- **Siguiente:** siguiente wireframe de la tanda de rediseño (el usuario los trae uno a uno; los deja en `assets/wireframes/<pantalla>/` con `code.html` + `DESIGN.md` + `screen.png`). Componentes de efectos listos para reutilizar en el resto de pantallas.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — IMPROVEMENT-027 **liberada a producción el 2026-07-18** (release `ddb512e`, verificado en `adoptia-eight.vercel.app`: historias demo y efectos servidos; sin migraciones).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-18 (IMPROVEMENT-027 — micro-interacciones y historias demo en la home. Antes el mismo día: FEATURE-034 liberada a producción).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->

# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-034 hecha** (rama `feature/FEATURE-034-rediseno-home`) — rediseño de la home según wireframe: hero con foto ambiente + degradado, buscador restylado con labels accesibles, chip «Recién llegado» sobre la foto, header glassmorphism, footer con marca y tagline, tokens `surface-container-*`/`shadow-soft` en `globals.css`. A11y reforzada (petición explícita del usuario: público con discapacidad — labels, foco visible, `motion-safe`, alt correctos). QA: suite **1101/1101 con RLS**, cobertura 82,4 % / 96,6 % `src/lib`, lint y tsc limpios, E2E área pública 4/4. Antes: FEATURE-032 (donaciones de particulares, en producción).
- **Siguiente:** siguiente wireframe de la tanda de rediseño (el usuario los trae uno a uno; los deja en `assets/wireframes/<pantalla>/` con `code.html` + `DESIGN.md` + `screen.png`). Componentes compartidos ya alineados al lenguaje nuevo: header, footer, AnimalCard.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — FEATURE-034 **liberada a producción el 2026-07-18** (release `de11ce2`, deploy READY en Vercel, rediseño verificado en `adoptia-eight.vercel.app`; sin migraciones).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-18 (FEATURE-034 — rediseño de la home, primera pantalla de la tanda Stitch. Antes el mismo día: FEATURE-032 liberada a producción).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
_No hay items abiertos._
<!-- RENDER:END -->

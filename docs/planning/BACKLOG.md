# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-055 hecha** (misma rama `feature/FEATURE-053-agenda-mensual`, circuito Manada completo) — **vistas anual y diaria (F3)**: segmented control mensual/anual/diaria; `VistaAnual` (12 mini-meses heatmap, click → mensual), `VistaDiaria` (timeline de citas del día con detalle vía admin acotado) y `ResumenAgenda` (capacidad del RPC `appointment_free_slots`, citas pendientes hoy, próxima disponibilidad). **Sin migración.** QA: **suite 1176 verde**. **🎉 Con esto queda completo el rediseño entero de la agenda de la protectora (F1→F3): calendario mensual + excepciones + utilidades masivas + vistas.** Antes en la misma rama: **FEATURE-057** (F2c plantillas, tabla `availability_templates`), **FEATURE-056** (F2b festivos + copiar/pegar), **FEATURE-054** (F2a pintar/rangos, Decisión #49), **FEATURE-053** (F1, Decisiones #46-48). Antes: FEATURE-044 y la tanda previa (038–052) en producción.
- **Siguiente:** único item abierto del backlog: **FEATURE-035** (historias felices, prioridad baja). Opcional: verificación visual en dev local autenticado de la agenda y de las pantallas rediseñadas de la tanda.
- **Bloqueos:** ninguno. **Todo lo anterior desplegado:** la agenda completa (FEATURE-053+054+055+056+057, release `555969b`, con sus dos migraciones `availability_overrides` y `availability_templates` ya aplicadas), FEATURE-044 y el rediseño de la gestión de acogidas (FEATURE-058, `94868a5`, sin migración) están en `main` y en producción. **Nota gitflow:** `develop` está ~83 commits por detrás de `main` (la tanda se libera directa a `main`); las ramas se crean **desde `main`**, no desde `develop`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019); **buscador global en la cabecera del área privada** y **alineación de las seis subpáginas de `/mi-cuenta`** con el lenguaje del dashboard (ambos vistos en FEATURE-039).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-22 (FEATURE-058 — rediseño de la gestión de acogidas de la protectora: tabs recibidas/enviadas, sidebar de filtros client-side, cards con avatar de iniciales, estados y efectos Reveal + hover-lift; sin migración. Suite 1181 verde. El mini-mapa "Puntos de acogida cercanos" del wireframe se omitió (necesitaría exponer coords aproximadas + decisión de privacidad)).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->

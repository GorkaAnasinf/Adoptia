# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-057 hecha** (misma rama `feature/FEATURE-053-agenda-mensual`, circuito Manada completo) — **plantillas de horario (F2c)**: nueva tabla `availability_templates` (**privada de la dueña**, RLS sin lectura pública), «Guardar como plantilla» en el editor de día, `PlantillasPicker` (aplicar/borrar) y `plantillaSchema`. Aplicar = mismo `upsert` de array sobre overrides. **Con migración** (2ª de la rama). QA: **suite 1160 verde**. **Con esto se cierra toda la tanda de utilidades de la agenda (F1+F2a+F2b+F2c).** Antes: **FEATURE-056** (F2b festivos + copiar/pegar), **FEATURE-054** (F2a pintar/rangos, Decisión #49), **FEATURE-053** (F1 calendario + `availability_overrides` + RPC, Decisiones #46-48). Único item de agenda pendiente: **F3 vistas anual/diaria = FEATURE-055** (`recibido`). Antes: FEATURE-044 y la tanda previa (038–052) en producción.
- **Siguiente:** desplegar la agenda (**F1+F2a+F2b+F2c juntas**, misma rama; **dos migraciones** → `supabase db push` aplica `availability_overrides` y `availability_templates`) y arrancar **FEATURE-055** (F3). **Verificación visual pendiente** de la agenda nueva y de FEATURE-040/041/042/043/044 (dev local autenticado).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** **FEATURE-053 + FEATURE-054 + FEATURE-056 + FEATURE-057** (misma rama; ⚠️ **dos migraciones**: `availability_overrides` de F1 y `availability_templates` de F2c — aplicar antes/junto al deploy) y FEATURE-044 (sin migraciones). **Nota gitflow:** `develop` está ~83 commits por detrás de `main` (la tanda se libera directa a `main`); esta rama se creó **desde `main`**, no desde `develop`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019); **buscador global en la cabecera del área privada** y **alineación de las seis subpáginas de `/mi-cuenta`** con el lenguaje del dashboard (ambos vistos en FEATURE-039).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-22 (FEATURE-057 — agenda F2c: plantillas de horario; cierra la tanda de utilidades de la agenda).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (2)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-055](items/FEATURE-055.md) | Agenda de la protectora F3 — vistas anual (heatmap) y diaria (timeline) | media | 0.5 |
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->

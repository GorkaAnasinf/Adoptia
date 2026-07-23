# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-055 hecha** (misma rama `feature/FEATURE-053-agenda-mensual`, circuito Manada completo) — **vistas anual y diaria (F3)**: segmented control mensual/anual/diaria; `VistaAnual` (12 mini-meses heatmap, click → mensual), `VistaDiaria` (timeline de citas del día con detalle vía admin acotado) y `ResumenAgenda` (capacidad del RPC `appointment_free_slots`, citas pendientes hoy, próxima disponibilidad). **Sin migración.** QA: **suite 1176 verde**. **🎉 Con esto queda completo el rediseño entero de la agenda de la protectora (F1→F3): calendario mensual + excepciones + utilidades masivas + vistas.** Antes en la misma rama: **FEATURE-057** (F2c plantillas, tabla `availability_templates`), **FEATURE-056** (F2b festivos + copiar/pegar), **FEATURE-054** (F2a pintar/rangos, Decisión #49), **FEATURE-053** (F1, Decisiones #46-48). Antes: FEATURE-044 y la tanda previa (038–052) en producción.
- **Siguiente:** un item en `recibido` (2026-07-23, sin planificar): **IMPROVEMENT-032** (alinear las 6 subpáginas de `/mi-cuenta` con el dashboard). **A cargo del usuario (no de la Manada):** borrado de datos de prueba (ver follow-ups) y verificación visual en dev local de las pantallas rediseñadas.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** **FEATURE-060** (badge «Urgente») ⚠️ **una migración** → `supabase db push` aplica `20260723180000_feature060_urgent` (columna `animals.urgent` + recrea `animals_search` con `p_urgent` y orden urgentes-primero en recientes). **FEATURE-061** (buscador global, `AppHeader` + `/api/buscar`) **sin migración**. Ya en `main` y en producción con migraciones aplicadas: agenda completa (FEATURE-053+054+055+056+057, `555969b`), FEATURE-044, gestión de acogidas (FEATURE-058, `94868a5`), cards de enviadas (IMPROVEMENT-030, `f7adc7f`), historias felices Nivel 1 (FEATURE-035, `8d0a5e1`), filtro «Apto para piso» (IMPROVEMENT-031) e historias felices Nivel 2 (FEATURE-059, `0e4dc54`). **Nota gitflow:** `develop` está ~83 commits por detrás de `main` (la tanda se libera directa a `main`); las ramas se crean **desde `main`**, no desde `develop`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). **Datos de prueba masivos** (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — **borrarlos (a cargo del usuario)**; ahora más urgente porque la sección «Ya están en casa» (FEATURE-035) muestra en prod cualquier adoptado con foto, incluidos los de prueba. Follow-up futuro de FEATURE-060: caducidad/límite del flag urgente (hoy es manual). Candidatos ya convertidos en items: buscador global (FEATURE-061) y alineación de `/mi-cuenta` (IMPROVEMENT-032).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-23 (FEATURE-061 hecha — buscador global del área privada: command palette con ⌘K/Ctrl+K en `AppHeader`, secciones por rol + `/api/buscar` role-aware (RLS); sin migración. Suite 1209 verde. Antes hoy: FEATURE-060 badge «Urgente», FEATURE-059, IMPROVEMENT-031, captura de 5 items, FEATURE-035 Nivel 1, IMPROVEMENT-030, FEATURE-058).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [IMPROVEMENT-032](items/IMPROVEMENT-032.md) | Alinear las subpáginas de /mi-cuenta con el lenguaje del dashboard | baja | — |
<!-- RENDER:END -->

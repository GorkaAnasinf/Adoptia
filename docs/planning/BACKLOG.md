# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-055 hecha** (misma rama `feature/FEATURE-053-agenda-mensual`, circuito Manada completo) — **vistas anual y diaria (F3)**: segmented control mensual/anual/diaria; `VistaAnual` (12 mini-meses heatmap, click → mensual), `VistaDiaria` (timeline de citas del día con detalle vía admin acotado) y `ResumenAgenda` (capacidad del RPC `appointment_free_slots`, citas pendientes hoy, próxima disponibilidad). **Sin migración.** QA: **suite 1176 verde**. **🎉 Con esto queda completo el rediseño entero de la agenda de la protectora (F1→F3): calendario mensual + excepciones + utilidades masivas + vistas.** Antes en la misma rama: **FEATURE-057** (F2c plantillas, tabla `availability_templates`), **FEATURE-056** (F2b festivos + copiar/pegar), **FEATURE-054** (F2a pintar/rangos, Decisión #49), **FEATURE-053** (F1, Decisiones #46-48). Antes: FEATURE-044 y la tanda previa (038–052) en producción.
- **Siguiente:** cinco items en `recibido` (2026-07-23, sin planificar): **FEATURE-059** (historias felices Nivel 2 — testimonios del adoptante, RGPD + moderación), **FEATURE-060** (badge «Urgente», requiere campo en BD), **FEATURE-061** (buscador global en la cabecera del área privada), **IMPROVEMENT-031** (filtro «Apto para piso» en `animals_search`, cambio pequeño) e **IMPROVEMENT-032** (alinear las 6 subpáginas de `/mi-cuenta` con el dashboard). Candidato de arranque rápido: IMPROVEMENT-031. **A cargo del usuario (no de la Manada):** borrado de datos de prueba (ver follow-ups) y verificación visual en dev local de las pantallas rediseñadas.
- **Bloqueos:** ninguno. **Nada pendiente de despliegue:** todo en `main` y en producción, y **todas las migraciones aplicadas en remoto** (verificado 2026-07-23 con `supabase migration list`: la última es `20260723100000_feature035_adopted_recent`). En prod: agenda completa (FEATURE-053+054+055+056+057, `555969b`, con `availability_overrides`+`availability_templates`), FEATURE-044, gestión de acogidas (FEATURE-058, `94868a5`), cards de enviadas (IMPROVEMENT-030, `f7adc7f`) e historias felices Nivel 1 (FEATURE-035, `8d0a5e1`). **Nota gitflow:** `develop` está ~83 commits por detrás de `main` (la tanda se libera directa a `main`); las ramas se crean **desde `main`**, no desde `develop`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). **Datos de prueba masivos** (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — **borrarlos (a cargo del usuario)**; ahora más urgente porque la sección «Ya están en casa» (FEATURE-035) muestra en prod cualquier adoptado con foto, incluidos los de prueba. Los antiguos «candidatos a item» ya son items en `recibido`: badge «Urgente» (FEATURE-060), filtro «Apto para piso» (IMPROVEMENT-031), buscador global (FEATURE-061) y alineación de `/mi-cuenta` (IMPROVEMENT-032).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-23 (capturados 5 items en `recibido`: FEATURE-059/060/061, IMPROVEMENT-031/032. Migración de FEATURE-035 verificada aplicada en remoto. Antes hoy: FEATURE-035 Nivel 1 «Ya están en casa», IMPROVEMENT-030 y FEATURE-058).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (5)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-059](items/FEATURE-059.md) | Historias felices Nivel 2 — testimonios reales del adoptante | media | — |
| [FEATURE-060](items/FEATURE-060.md) | Badge «Urgente» en fichas y listado de animales | media | — |
| [FEATURE-061](items/FEATURE-061.md) | Buscador global en la cabecera del área privada | media | — |
| [IMPROVEMENT-031](items/IMPROVEMENT-031.md) | Filtro «Apto para piso» en la búsqueda de animales | baja | — |
| [IMPROVEMENT-032](items/IMPROVEMENT-032.md) | Alinear las subpáginas de /mi-cuenta con el lenguaje del dashboard | baja | — |
<!-- RENDER:END -->

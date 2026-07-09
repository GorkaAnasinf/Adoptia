# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.2 — MVP (en dos bloques: 🐕 protectora → 🧑 persona; ver "Orden de trabajo" en ROADMAP)
- **Progreso:** FEATURE-001, FEATURE-002 y FEATURE-003 (gestión de animales) hechos; app shell autenticado (FEATURE-018), rediseño del wizard (IMPROVEMENT-002), pulido del chrome (IMPROVEMENT-003/004), edición del alta en revisión (IMPROVEMENT-005) y sidebar del adoptante (IMPROVEMENT-006) en producción; correcciones de confirmación de email y mapa (BUG-001/002/003).
- **Siguiente (Bloque A — protectora):** FEATURE-004 (dashboard + perfil público de la protectora).
- **Luego (Bloque B — persona):** FEATURE-005 → 006 → 007 → 008.
- **En curso:** nada (IMPROVEMENT-011 en rama `feature/IMPROVEMENT-011-wizard-combo-titulo`, pendiente de merge a `develop`).
- **Bloqueos:** ninguno.
- **Follow-ups abiertos:** IMPROVEMENT-001 (de-duplicar slug de protectora), sin planificar.
- **Última actualización:** 2026-07-09 (cierre de IMPROVEMENT-011 — combo provincia, autocompletado al teclear, título lateral).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 🔨 En desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [BUG-001](items/BUG-001.md) | Tras confirmar el correo, la protectora no entra al onboarding; falta pantalla de "correo verificado | alta | 0.2 |

### ✅ Listo para desarrollo (13)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-004](items/FEATURE-004.md) | Panel de protectora — dashboard y perfil público | alta | 0.2 |
| [FEATURE-005](items/FEATURE-005.md) | Área pública — home, búsqueda de animales y fichas | alta | 0.2 |
| [FEATURE-006](items/FEATURE-006.md) | Mapa de protectoras con búsqueda por proximidad | alta | 0.2 |
| [FEATURE-007](items/FEATURE-007.md) | Solicitud "Me interesa" con cuestionario y bandeja de la protectora | alta | 0.2 |
| [FEATURE-009](items/FEATURE-009.md) | Citas con calendario y agenda de disponibilidad | alta | 0.3 |
| [FEATURE-008](items/FEATURE-008.md) | SEO, datos de demo y pulido del MVP | media | 0.2 |
| [FEATURE-010](items/FEATURE-010.md) | Área personal del adoptante — solicitudes, favoritos y alertas | media | 0.3 |
| [FEATURE-011](items/FEATURE-011.md) | Moderación de contenido y cuentas (admin) | media | 0.3 |
| [FEATURE-012](items/FEATURE-012.md) | Animales perdidos y encontrados | media | 0.4 |
| [FEATURE-013](items/FEATURE-013.md) | Apadrinamiento y donaciones | baja | 0.4 |
| [FEATURE-014](items/FEATURE-014.md) | Estadísticas para protectoras y difusión en redes | baja | 0.4 |
| [FEATURE-015](items/FEATURE-015.md) | Contenido educativo sobre adopción responsable | baja | 0.4 |
| [FEATURE-016](items/FEATURE-016.md) | Registro de casas de acogida | baja | 0.4 |

### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [IMPROVEMENT-001](items/IMPROVEMENT-001.md) | De-duplicar el slug de protectora (nombres repetidos) | media | — |
<!-- RENDER:END -->

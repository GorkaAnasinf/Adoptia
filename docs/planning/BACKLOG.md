# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.2 — MVP (en dos bloques: 🐕 protectora → 🧑 persona; ver "Orden de trabajo" en ROADMAP)
- **Progreso:** Bloque A (protectora) **completo** — FEATURE-001/002/003/004 hechos, más app shell (FEATURE-018) y pulidos del wizard (IMPROVEMENT-002/003/004/005/007/008/009/010/011) y sidebar del adoptante (IMPROVEMENT-006) en producción; correcciones de email y mapa (BUG-001/002/003).
- **Siguiente (Bloque B — persona):** FEATURE-005 (área pública: home, búsqueda y fichas) → 006 → 007 → 008.
- **En curso:** nada (FEATURE-004 en rama `feature/FEATURE-004-panel-dashboard`, pendiente de merge; requiere migración del bucket `shelter-media` en prod).
- **Bloqueos:** ninguno.
- **Follow-ups abiertos:** IMPROVEMENT-001 (de-duplicar slug de protectora), sin planificar. "Próximas citas" del dashboard pospuesto a FEATURE-009.
- **Última actualización:** 2026-07-09 (cierre de FEATURE-004 — dashboard + perfil público, 3 ciclos; cierra el Bloque A).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 🔨 En desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [BUG-001](items/BUG-001.md) | Tras confirmar el correo, la protectora no entra al onboarding; falta pantalla de "correo verificado | alta | 0.2 |

### ✅ Listo para desarrollo (12)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
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

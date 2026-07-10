# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.2 — MVP (en dos bloques: 🐕 protectora → 🧑 persona; ver "Orden de trabajo" en ROADMAP)
- **Progreso:** Bloque A (protectora) completo. Bloque B en marcha: FEATURE-005 hecho (área pública) y **FEATURE-006 hecho** (mapa de protectoras: RPC `shelters_nearby` con filtros y clustering, `/api/geocode` público, pantalla `/mapa` con lista lateral/bottom sheet deslizable, E2E completo incl. clustering a 220 protectoras).
- **Siguiente (Bloque B — persona):** FEATURE-007 → 008.
- **En curso:** nada (FEATURE-006 en rama `feature/FEATURE-006-mapa-protectoras`, pendiente de merge a develop; requiere `supabase db push` en prod para el RPC `shelters_nearby` actualizado).
- **Bloqueos:** ninguno.
- **Follow-ups abiertos:** IMPROVEMENT-001 (de-duplicar slug de protectora), IMPROVEMENT-012 (deuda de cobertura de funciones + medir LCP móvil del listado tras deploy). "Próximas citas" del dashboard pospuesto a FEATURE-009.
- **Última actualización:** 2026-07-10 (cierre de FEATURE-006 — mapa de protectoras, 2 ciclos con QA; segundo item del Bloque B).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 🔨 En desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [BUG-001](items/BUG-001.md) | Tras confirmar el correo, la protectora no entra al onboarding; falta pantalla de "correo verificado | alta | 0.2 |

### ✅ Listo para desarrollo (10)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
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

### 📥 Recibido (2)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [IMPROVEMENT-001](items/IMPROVEMENT-001.md) | De-duplicar el slug de protectora (nombres repetidos) | media | — |
| [IMPROVEMENT-012](items/IMPROVEMENT-012.md) | Recuperar el umbral de cobertura de funciones (deuda de tests) | media | — |
<!-- RENDER:END -->

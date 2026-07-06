# Roadmap — Adoptia

> Las listas de items y % son **renderizados** (`python scripts/render_planning.py`) — no editar la zona RENDER.
> La narrativa de hitos (esta tabla) la mantiene Hachiko. El plan técnico de cada item vive EN el item, no aquí.

## Hitos

| Hito | Nombre | Objetivo | Criterio de salida |
|------|--------|----------|--------------------|
| **0.1** | Andamiaje | Proyecto funcionando de extremo a extremo | `next dev` sirve una página conectada a Supabase; CI verde; deploy preview en Vercel |
| **0.2** | MVP | Plataforma presentable a dirección | Una protectora real puede darse de alta, publicar animales y recibir solicitudes; demo con seed; SEO básico |
| **0.3** | Fase 2 | Ciclo de adopción completo | Citas con agenda funcionando; adoptante gestiona solicitudes/favoritos/alertas; moderación activa |
| **0.4** | Fase 3 | Ecosistema completo | Perdidos/encontrados, apadrinamiento, estadísticas, contenido educativo y acogidas según feedback del MVP |

## Items por hito

<!-- RENDER:START -->
### Hito 0.1 — 100% completado (2/2)

| Item | Título | Estado | Prioridad |
|------|--------|--------|-----------|
| [FEATURE-000](items/FEATURE-000.md) | Inicialización y andamiaje del proyecto | hecho | alta |
| [FEATURE-017](items/FEATURE-017.md) | Despliegue inicial — Supabase cloud y Vercel enlazados | hecho | alta |

### Hito 0.2 — 12% completado (1/8)

| Item | Título | Estado | Prioridad |
|------|--------|--------|-----------|
| [FEATURE-001](items/FEATURE-001.md) | Registro y login de adoptantes y protectoras | hecho | alta |
| [FEATURE-002](items/FEATURE-002.md) | Onboarding de protectoras y verificación por admin | desarrollo | alta |
| [FEATURE-003](items/FEATURE-003.md) | Gestión de animales con fotos y vídeo (panel protectora) | listo | alta |
| [FEATURE-005](items/FEATURE-005.md) | Área pública — home, búsqueda de animales y fichas | listo | alta |
| [FEATURE-006](items/FEATURE-006.md) | Mapa de protectoras con búsqueda por proximidad | listo | alta |
| [FEATURE-007](items/FEATURE-007.md) | Solicitud "Me interesa" con cuestionario y bandeja de la protectora | listo | alta |
| [FEATURE-004](items/FEATURE-004.md) | Panel de protectora — dashboard y perfil público | listo | media |
| [FEATURE-008](items/FEATURE-008.md) | SEO, datos de demo y pulido del MVP | listo | media |

### Hito 0.3 — 0% completado (0/3)

| Item | Título | Estado | Prioridad |
|------|--------|--------|-----------|
| [FEATURE-009](items/FEATURE-009.md) | Citas con calendario y agenda de disponibilidad | listo | alta |
| [FEATURE-010](items/FEATURE-010.md) | Área personal del adoptante — solicitudes, favoritos y alertas | listo | media |
| [FEATURE-011](items/FEATURE-011.md) | Moderación de contenido y cuentas (admin) | listo | media |

### Hito 0.4 — 0% completado (0/5)

| Item | Título | Estado | Prioridad |
|------|--------|--------|-----------|
| [FEATURE-012](items/FEATURE-012.md) | Animales perdidos y encontrados | listo | media |
| [FEATURE-013](items/FEATURE-013.md) | Apadrinamiento y donaciones | listo | baja |
| [FEATURE-014](items/FEATURE-014.md) | Estadísticas para protectoras y difusión en redes | listo | baja |
| [FEATURE-015](items/FEATURE-015.md) | Contenido educativo sobre adopción responsable | listo | baja |
| [FEATURE-016](items/FEATURE-016.md) | Registro de casas de acogida | listo | baja |

### Sin hito asignado (1)

_Capturas pendientes de promover — no forman parte del roadmap todavía._

- [IMPROVEMENT-001](items/IMPROVEMENT-001.md) — De-duplicar el slug de protectora (nombres repetidos) (recibido)
<!-- RENDER:END -->

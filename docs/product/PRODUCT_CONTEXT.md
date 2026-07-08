# Contexto de producto — Adoptia

> **Documento raíz del conocimiento del producto.** Si solo lees un documento, lee este.
> El catálogo de features de abajo se renderiza desde `../planning/items/` — no editar esa zona a mano.

## Qué es Adoptia

Adoptia conecta **protectoras de animales** con **personas que quieren adoptar**. Las protectoras publican sus animales con fichas completas y gestionan solicitudes y citas desde un panel; los adoptantes buscan animales cerca de su ubicación en un mapa, consultan fichas y piden conocerlos rellenando un cuestionario de pre-adopción que ahorra a las protectoras el filtro manual que hoy hacen por teléfono.

**Gratuito para ambos lados.** Sostenibilidad futura: patrocinios, donaciones, subvenciones.

## Quién lo usa

| Usuario | Necesidad |
|---------|-----------|
| **Adoptante** | Encontrar un animal compatible cerca de casa y arrancar la adopción sin llamadas ni redes sociales |
| **Protectora** | Visibilidad para sus animales y menos trabajo administrativo (filtro de solicitudes, citas) |
| **Admin (equipo Adoptia)** | Verificar protectoras y moderar contenido para mantener la confianza |

## Mapa del conocimiento

| Pregunta | Documento |
|----------|-----------|
| ¿Qué problema resuelve y qué es el MVP? | [PLAN.md](PLAN.md) |
| ¿Análisis funcional completo? | [analisis-funcional.md](analisis-funcional.md) |
| ¿Cómo está construido? | [ARCHITECTURE](../technical/ARCHITECTURE.md) · [biblia técnica](../technical/analisis-tecnico.md) |
| ¿Qué datos maneja? | [DATA_MODEL](../technical/DATA_MODEL.md) |
| ¿Cómo se ve? | [DESIGN](../technical/DESIGN.md) · [prompts Stitch](../technical/prompts-stitch.md) |
| ¿Por qué se decidió X? | [DECISIONS](../technical/DECISIONS.md) |
| ¿Dónde estamos ahora? | [BACKLOG](../planning/BACKLOG.md) (bloque 📍 ESTADO ACTUAL) |
| ¿Qué viene después? | [ROADMAP](../planning/ROADMAP.md) |
| ¿Cómo lo arranco? | [SETUP](../operations/SETUP.md) |
| ¿Datos personales? | [PRIVACY](../meta/PRIVACY.md) |

## Catálogo de funcionalidades

Estado de cada capacidad en lenguaje de usuario. Se regenera con `python scripts/render_planning.py`.

<!-- RENDER:START -->
#### ✅ Disponible

- El mapa del alta se ve en gris (la CSP bloquea las tiles de OpenStreetMap) ([BUG-003](../planning/items/BUG-003.md))
- Inicialización y andamiaje del proyecto ([FEATURE-000](../planning/items/FEATURE-000.md))
- Registro y login de adoptantes y protectoras ([FEATURE-001](../planning/items/FEATURE-001.md))
- Onboarding de protectoras y verificación por admin ([FEATURE-002](../planning/items/FEATURE-002.md))
- Gestión de animales con fotos y vídeo (panel protectora) ([FEATURE-003](../planning/items/FEATURE-003.md))
- Despliegue inicial — Supabase cloud y Vercel enlazados ([FEATURE-017](../planning/items/FEATURE-017.md))
- App shell autenticado — cabecera común, navegación por rol y breadcrumbs ([FEATURE-018](../planning/items/FEATURE-018.md))
- Rediseño UX del wizard de alta de protectora (+ fix del mapa gris) ([IMPROVEMENT-002](../planning/items/IMPROVEMENT-002.md))
- Pulido del shell chrome (sidebar + cabecera) hacia el mockup de Stitch ([IMPROVEMENT-003](../planning/items/IMPROVEMENT-003.md))
- Pulido del chrome (sidebar arena, cabecera) y estado vacío de Mi cuenta ([IMPROVEMENT-004](../planning/items/IMPROVEMENT-004.md))
- Editar los datos de la protectora mientras el alta está en revisión ([IMPROVEMENT-005](../planning/items/IMPROVEMENT-005.md))
- Completar el sidebar del adoptante con sus secciones (deshabilitadas) ([IMPROVEMENT-006](../planning/items/IMPROVEMENT-006.md))

#### 🚧 En camino (en desarrollo ahora)

- Tras confirmar el correo, la protectora no entra al onboarding; falta pantalla de "correo verificado ([BUG-001](../planning/items/BUG-001.md))

#### 🗓️ Previsto

- Panel de protectora — dashboard y perfil público — hito 0.2 ([FEATURE-004](../planning/items/FEATURE-004.md))
- Área pública — home, búsqueda de animales y fichas — hito 0.2 ([FEATURE-005](../planning/items/FEATURE-005.md))
- Mapa de protectoras con búsqueda por proximidad — hito 0.2 ([FEATURE-006](../planning/items/FEATURE-006.md))
- Solicitud "Me interesa" con cuestionario y bandeja de la protectora — hito 0.2 ([FEATURE-007](../planning/items/FEATURE-007.md))
- SEO, datos de demo y pulido del MVP — hito 0.2 ([FEATURE-008](../planning/items/FEATURE-008.md))
- Citas con calendario y agenda de disponibilidad — hito 0.3 ([FEATURE-009](../planning/items/FEATURE-009.md))
- Área personal del adoptante — solicitudes, favoritos y alertas — hito 0.3 ([FEATURE-010](../planning/items/FEATURE-010.md))
- Moderación de contenido y cuentas (admin) — hito 0.3 ([FEATURE-011](../planning/items/FEATURE-011.md))
- Animales perdidos y encontrados — hito 0.4 ([FEATURE-012](../planning/items/FEATURE-012.md))
- Apadrinamiento y donaciones — hito 0.4 ([FEATURE-013](../planning/items/FEATURE-013.md))
- Estadísticas para protectoras y difusión en redes — hito 0.4 ([FEATURE-014](../planning/items/FEATURE-014.md))
- Contenido educativo sobre adopción responsable — hito 0.4 ([FEATURE-015](../planning/items/FEATURE-015.md))
- Registro de casas de acogida — hito 0.4 ([FEATURE-016](../planning/items/FEATURE-016.md))
- De-duplicar el slug de protectora (nombres repetidos) — hito sin asignar ([IMPROVEMENT-001](../planning/items/IMPROVEMENT-001.md))
<!-- RENDER:END -->

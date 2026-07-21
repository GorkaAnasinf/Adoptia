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
| **0.5** | Post-MVP | Mantenimiento y mejoras detectadas en uso real | Bugs y features surgidos probando la plataforma en producción, sin criterio de cierre fijo |

## Orden de trabajo del hito 0.2 (por bloques)

Para centrar el desarrollo en un lado de la app cada vez, el 0.2 se aborda en dos bloques:

- **🐕 Bloque A — Ciclo protectora (primero):** FEATURE-003 (gestión de animales) →
  FEATURE-004 (dashboard + perfil público). Al cerrarlo, una protectora verificada publica,
  gestiona y se presenta de forma completa.
- **🧑 Bloque B — Ciclo persona (después):** FEATURE-005 (home/búsqueda/fichas) →
  FEATURE-006 (mapa) → FEATURE-007 ("Me interesa" + bandeja) → FEATURE-008 (SEO/demo/pulido).
  FEATURE-007 (y FEATURE-009 en 0.3) son **bisagra**: su mitad "protectora" solo cobra sentido
  cuando el adoptante puede enviar solicitudes, por eso viven aquí.

## Items por hito

<!-- RENDER:START -->
### Hito 0.1 — 100% completado (2/2)

| Item | Título | Estado | Prioridad |
|------|--------|--------|-----------|
| [FEATURE-000](items/FEATURE-000.md) | Inicialización y andamiaje del proyecto | hecho | alta |
| [FEATURE-017](items/FEATURE-017.md) | Despliegue inicial — Supabase cloud y Vercel enlazados | hecho | alta |

### Hito 0.2 — 100% completado (21/21)

| Item | Título | Estado | Prioridad |
|------|--------|--------|-----------|
| [BUG-001](items/BUG-001.md) | Tras confirmar el correo, la protectora no entra al onboarding; falta pantalla de "correo verificado | hecho | alta |
| [BUG-003](items/BUG-003.md) | El mapa del alta se ve en gris (la CSP bloquea las tiles de OpenStreetMap) | hecho | alta |
| [FEATURE-001](items/FEATURE-001.md) | Registro y login de adoptantes y protectoras | hecho | alta |
| [FEATURE-002](items/FEATURE-002.md) | Onboarding de protectoras y verificación por admin | hecho | alta |
| [FEATURE-003](items/FEATURE-003.md) | Gestión de animales con fotos y vídeo (panel protectora) | hecho | alta |
| [FEATURE-004](items/FEATURE-004.md) | Panel de protectora — dashboard y perfil público | hecho | alta |
| [FEATURE-005](items/FEATURE-005.md) | Área pública — home, búsqueda de animales y fichas | hecho | alta |
| [FEATURE-006](items/FEATURE-006.md) | Mapa de protectoras con búsqueda por proximidad | hecho | alta |
| [FEATURE-007](items/FEATURE-007.md) | Solicitud "Me interesa" con cuestionario y bandeja de la protectora | hecho | alta |
| [FEATURE-018](items/FEATURE-018.md) | App shell autenticado — cabecera común, navegación por rol y breadcrumbs | hecho | alta |
| [IMPROVEMENT-002](items/IMPROVEMENT-002.md) | Rediseño UX del wizard de alta de protectora (+ fix del mapa gris) | hecho | alta |
| [FEATURE-008](items/FEATURE-008.md) | SEO, datos de demo y pulido del MVP | hecho | media |
| [IMPROVEMENT-003](items/IMPROVEMENT-003.md) | Pulido del shell chrome (sidebar + cabecera) hacia el mockup de Stitch | hecho | media |
| [IMPROVEMENT-004](items/IMPROVEMENT-004.md) | Pulido del chrome (sidebar arena, cabecera) y estado vacío de Mi cuenta | hecho | media |
| [IMPROVEMENT-005](items/IMPROVEMENT-005.md) | Editar los datos de la protectora mientras el alta está en revisión | hecho | media |
| [IMPROVEMENT-007](items/IMPROVEMENT-007.md) | Pulido del wizard de alta — autocompletado de direcciones y layout | hecho | media |
| [IMPROVEMENT-008](items/IMPROVEMENT-008.md) | Paso de ubicación del wizard — combos, orden top-down y fixes | hecho | media |
| [IMPROVEMENT-009](items/IMPROVEMENT-009.md) | Wizard de alta — fix autocompletado y pulido de ubicación/perfil | hecho | media |
| [IMPROVEMENT-010](items/IMPROVEMENT-010.md) | Wizard de alta — autorrelleno de provincia y nombres OSM | hecho | media |
| [IMPROVEMENT-011](items/IMPROVEMENT-011.md) | Wizard de alta — combo de provincia, autocompletado solo al teclear y título lateral | hecho | media |
| [IMPROVEMENT-006](items/IMPROVEMENT-006.md) | Completar el sidebar del adoptante con sus secciones (deshabilitadas) | hecho | baja |

### Hito 0.3 — 75% completado (3/4)

| Item | Título | Estado | Prioridad |
|------|--------|--------|-----------|
| [FEATURE-009](items/FEATURE-009.md) | Citas con calendario y agenda de disponibilidad | hecho | alta |
| [FEATURE-010](items/FEATURE-010.md) | Área personal del adoptante — solicitudes, favoritos y alertas | hecho | media |
| [FEATURE-011](items/FEATURE-011.md) | Moderación de contenido y cuentas (admin) | hecho | media |
| [FEATURE-033](items/FEATURE-033.md) | Alertas de búsqueda guardada (avisos de nuevos animales) | descartado | media |

### Hito 0.4 — 100% completado (6/6)

| Item | Título | Estado | Prioridad |
|------|--------|--------|-----------|
| [IMPROVEMENT-015](items/IMPROVEMENT-015.md) | README de calidad y manual de usuario (entrega TFM) | hecho | alta |
| [FEATURE-012](items/FEATURE-012.md) | Animales perdidos y encontrados | hecho | media |
| [FEATURE-013](items/FEATURE-013.md) | Apadrinamiento y donaciones | hecho | baja |
| [FEATURE-014](items/FEATURE-014.md) | Estadísticas para protectoras y difusión en redes | hecho | baja |
| [FEATURE-015](items/FEATURE-015.md) | Contenido educativo sobre adopción responsable | hecho | baja |
| [FEATURE-016](items/FEATURE-016.md) | Registro de casas de acogida | hecho | baja |

### Hito 0.5 — 100% completado (43/43)

| Item | Título | Estado | Prioridad |
|------|--------|--------|-----------|
| [BUG-004](items/BUG-004.md) | Reservar cita" lleva a una página 404 | hecho | alta |
| [BUG-006](items/BUG-006.md) | El listado sirve la URL de YouTube como imagen de portada cuando el animal no tiene foto de portada | hecho | alta |
| [BUG-007](items/BUG-007.md) | CI no ejecuta ni un solo test de RLS — 122 tests se saltan en silencio en cada push | hecho | alta |
| [BUG-008](items/BUG-008.md) | La suite E2E está podrida — 14 de 26 fallan al ejecutarla entera | hecho | alta |
| [FEATURE-019](items/FEATURE-019.md) | Directorio público de protectoras (/protectoras) | hecho | alta |
| [FEATURE-022](items/FEATURE-022.md) | Avisos de perdidos — contacto sin exponer datos y avistamientos ciudadanos | hecho | alta |
| [FEATURE-025](items/FEATURE-025.md) | Rediseño del listado/mapa de Perdidos y encontrados (mockup nuevo) | hecho | alta |
| [FEATURE-026](items/FEATURE-026.md) | Rediseño de la ficha del aviso a dos columnas (mockup nuevo) | hecho | alta |
| [FEATURE-027](items/FEATURE-027.md) | Rediseño del alta de aviso en tarjetas de sección (mockup nuevo) | hecho | alta |
| [FEATURE-028](items/FEATURE-028.md) | Rediseño del perfil público de protectora (mockup nuevo) | hecho | alta |
| [FEATURE-034](items/FEATURE-034.md) | Rediseño de la home según wireframe Stitch (tanda de rediseño, pantalla 1) | hecho | alta |
| [FEATURE-036](items/FEATURE-036.md) | Rediseño del listado de animales según wireframe Stitch (tanda, pantalla 2) | hecho | alta |
| [FEATURE-037](items/FEATURE-037.md) | Rediseño del directorio de protectoras según wireframe Stitch (tanda, pantalla 3) | hecho | alta |
| [FEATURE-038](items/FEATURE-038.md) | Rediseño de Perdidos y encontrados según wireframe Stitch (tanda, pantalla 5) | hecho | alta |
| [FEATURE-039](items/FEATURE-039.md) | Rediseño de Mi cuenta como dashboard del adoptante (tanda, pantalla 6) | hecho | alta |
| [IMPROVEMENT-016](items/IMPROVEMENT-016.md) | Redirección post-login según rol (protectora al panel, admin a admin) | hecho | alta |
| [IMPROVEMENT-020](items/IMPROVEMENT-020.md) | Rediseño de la ficha pública de animal | hecho | alta |
| [IMPROVEMENT-027](items/IMPROVEMENT-027.md) | Vida y micro-interacciones en la web (cursor, count-up, reveal, header compacto, huellas) | hecho | alta |
| [IMPROVEMENT-028](items/IMPROVEMENT-028.md) | El mapa de protectoras se alinea con el lenguaje de la tanda (sin wireframe) | hecho | alta |
| [IMPROVEMENT-029](items/IMPROVEMENT-029.md) | Popup rico en los pines del mapa de perdidos (lenguaje de la tanda) | hecho | alta |
| [BUG-005](items/BUG-005.md) | npm run test -- --coverage revienta al parsear globals.css y las guías .md | hecho | media |
| [FEATURE-020](items/FEATURE-020.md) | Vídeos en la ficha del animal (YouTube + MP4) | hecho | media |
| [FEATURE-021](items/FEATURE-021.md) | Rediseño de la cabecera superior con menú de usuario por rol | hecho | media |
| [FEATURE-023](items/FEATURE-023.md) | Avisos de perdidos — datos identificativos, fecha real del suceso y filtros | hecho | media |
| [FEATURE-024](items/FEATURE-024.md) | Galería de fotos en los avisos de perdidos (hoy solo cabe una) | hecho | media |
| [FEATURE-029](items/FEATURE-029.md) | Propuestas de acogida estructuradas con trazabilidad | hecho | media |
| [FEATURE-030](items/FEATURE-030.md) | Relevo de acogida (emergencias del acogedor) | hecho | media |
| [FEATURE-031](items/FEATURE-031.md) | Tablón de necesidades de protectoras (pedir ayuda material) | hecho | media |
| [FEATURE-032](items/FEATURE-032.md) | Ofertas de donación de particulares (material para protectoras) | hecho | media |
| [FEATURE-040](items/FEATURE-040.md) | Rediseño de "Mis alertas" según wireframe Stitch (tanda, pantalla 7) | hecho | media |
| [FEATURE-041](items/FEATURE-041.md) | Crear alerta desde el listado con resultados (no solo en el estado vacío) | hecho | media |
| [FEATURE-042](items/FEATURE-042.md) | Rediseño de "Mis acogidas" en dos pestañas (registro / propuestas) | hecho | media |
| [FEATURE-043](items/FEATURE-043.md) | Rediseño del formulario de alta (patrón base) + ajustes de mis acogidas | hecho | media |
| [FEATURE-044](items/FEATURE-044.md) | Rediseño de "Mis donaciones" (patrón base) + edición con un solo formulario | hecho | media |
| [IMPROVEMENT-017](items/IMPROVEMENT-017.md) | Rediseño del dashboard de protectora (tarjetas de color y próximas citas) | hecho | media |
| [IMPROVEMENT-018](items/IMPROVEMENT-018.md) | Rediseño de la home pública (hero con buscador, recién llegados, banda de stats y CTA) | hecho | media |
| [IMPROVEMENT-019](items/IMPROVEMENT-019.md) | Rediseño del listado /animales (filtros horizontales, tarjetas con favorito y paginación numerada) | hecho | media |
| [IMPROVEMENT-022](items/IMPROVEMENT-022.md) | Ejecutar los E2E de Playwright en CI, aprovechando el stack que ya levanta el job de RLS | hecho | media |
| [IMPROVEMENT-023](items/IMPROVEMENT-023.md) | Subir CI y el runtime a Node 22+ (hoy el job de la app va en Node 20, ya deprecado) | hecho | media |
| [IMPROVEMENT-025](items/IMPROVEMENT-025.md) | Acogidas visibles en la navegación del usuario | hecho | media |
| [IMPROVEMENT-026](items/IMPROVEMENT-026.md) | Sincronizar el estado del animal con su propuesta de acogida | hecho | media |
| [IMPROVEMENT-021](items/IMPROVEMENT-021.md) | Búsqueda por texto/raza en el listado de animales | hecho | baja |
| [IMPROVEMENT-024](items/IMPROVEMENT-024.md) | Pulido menor del perfil público de protectora (fallbacks del hero y de las tarjetas) | hecho | baja |

### Sin hito asignado (1)

_Capturas pendientes de promover — no forman parte del roadmap todavía._

- [FEATURE-035](items/FEATURE-035.md) — Historias felices — social proof de adopciones en la home (recibido)
<!-- RENDER:END -->

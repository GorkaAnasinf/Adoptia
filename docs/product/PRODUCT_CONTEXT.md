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

- Tras confirmar el correo, la protectora no entra al onboarding; falta pantalla de "correo verificado ([BUG-001](../planning/items/BUG-001.md))
- El mapa del alta se ve en gris (la CSP bloquea las tiles de OpenStreetMap) ([BUG-003](../planning/items/BUG-003.md))
- Reservar cita" lleva a una página 404 ([BUG-004](../planning/items/BUG-004.md))
- npm run test -- --coverage revienta al parsear globals.css y las guías .md ([BUG-005](../planning/items/BUG-005.md))
- El listado sirve la URL de YouTube como imagen de portada cuando el animal no tiene foto de portada ([BUG-006](../planning/items/BUG-006.md))
- CI no ejecuta ni un solo test de RLS — 122 tests se saltan en silencio en cada push ([BUG-007](../planning/items/BUG-007.md))
- La suite E2E está podrida — 14 de 26 fallan al ejecutarla entera ([BUG-008](../planning/items/BUG-008.md))
- Inicialización y andamiaje del proyecto ([FEATURE-000](../planning/items/FEATURE-000.md))
- Registro y login de adoptantes y protectoras ([FEATURE-001](../planning/items/FEATURE-001.md))
- Onboarding de protectoras y verificación por admin ([FEATURE-002](../planning/items/FEATURE-002.md))
- Gestión de animales con fotos y vídeo (panel protectora) ([FEATURE-003](../planning/items/FEATURE-003.md))
- Panel de protectora — dashboard y perfil público ([FEATURE-004](../planning/items/FEATURE-004.md))
- Área pública — home, búsqueda de animales y fichas ([FEATURE-005](../planning/items/FEATURE-005.md))
- Mapa de protectoras con búsqueda por proximidad ([FEATURE-006](../planning/items/FEATURE-006.md))
- Solicitud "Me interesa" con cuestionario y bandeja de la protectora ([FEATURE-007](../planning/items/FEATURE-007.md))
- SEO, datos de demo y pulido del MVP ([FEATURE-008](../planning/items/FEATURE-008.md))
- Citas con calendario y agenda de disponibilidad ([FEATURE-009](../planning/items/FEATURE-009.md))
- Área personal del adoptante — solicitudes, favoritos y alertas ([FEATURE-010](../planning/items/FEATURE-010.md))
- Moderación de contenido y cuentas (admin) ([FEATURE-011](../planning/items/FEATURE-011.md))
- Animales perdidos y encontrados ([FEATURE-012](../planning/items/FEATURE-012.md))
- Apadrinamiento y donaciones ([FEATURE-013](../planning/items/FEATURE-013.md))
- Estadísticas para protectoras y difusión en redes ([FEATURE-014](../planning/items/FEATURE-014.md))
- Contenido educativo sobre adopción responsable ([FEATURE-015](../planning/items/FEATURE-015.md))
- Registro de casas de acogida ([FEATURE-016](../planning/items/FEATURE-016.md))
- Despliegue inicial — Supabase cloud y Vercel enlazados ([FEATURE-017](../planning/items/FEATURE-017.md))
- App shell autenticado — cabecera común, navegación por rol y breadcrumbs ([FEATURE-018](../planning/items/FEATURE-018.md))
- Directorio público de protectoras (/protectoras) ([FEATURE-019](../planning/items/FEATURE-019.md))
- Vídeos en la ficha del animal (YouTube + MP4) ([FEATURE-020](../planning/items/FEATURE-020.md))
- Rediseño de la cabecera superior con menú de usuario por rol ([FEATURE-021](../planning/items/FEATURE-021.md))
- Avisos de perdidos — contacto sin exponer datos y avistamientos ciudadanos ([FEATURE-022](../planning/items/FEATURE-022.md))
- Avisos de perdidos — datos identificativos, fecha real del suceso y filtros ([FEATURE-023](../planning/items/FEATURE-023.md))
- Galería de fotos en los avisos de perdidos (hoy solo cabe una) ([FEATURE-024](../planning/items/FEATURE-024.md))
- Rediseño del listado/mapa de Perdidos y encontrados (mockup nuevo) ([FEATURE-025](../planning/items/FEATURE-025.md))
- Rediseño de la ficha del aviso a dos columnas (mockup nuevo) ([FEATURE-026](../planning/items/FEATURE-026.md))
- Rediseño del alta de aviso en tarjetas de sección (mockup nuevo) ([FEATURE-027](../planning/items/FEATURE-027.md))
- Rediseño del perfil público de protectora (mockup nuevo) ([FEATURE-028](../planning/items/FEATURE-028.md))
- Propuestas de acogida estructuradas con trazabilidad ([FEATURE-029](../planning/items/FEATURE-029.md))
- Relevo de acogida (emergencias del acogedor) ([FEATURE-030](../planning/items/FEATURE-030.md))
- Tablón de necesidades de protectoras (pedir ayuda material) ([FEATURE-031](../planning/items/FEATURE-031.md))
- Ofertas de donación de particulares (material para protectoras) ([FEATURE-032](../planning/items/FEATURE-032.md))
- Rediseño de la home según wireframe Stitch (tanda de rediseño, pantalla 1) ([FEATURE-034](../planning/items/FEATURE-034.md))
- Historias felices — social proof de adopciones en la home ([FEATURE-035](../planning/items/FEATURE-035.md))
- Rediseño del listado de animales según wireframe Stitch (tanda, pantalla 2) ([FEATURE-036](../planning/items/FEATURE-036.md))
- Rediseño del directorio de protectoras según wireframe Stitch (tanda, pantalla 3) ([FEATURE-037](../planning/items/FEATURE-037.md))
- Rediseño de Perdidos y encontrados según wireframe Stitch (tanda, pantalla 5) ([FEATURE-038](../planning/items/FEATURE-038.md))
- Rediseño de Mi cuenta como dashboard del adoptante (tanda, pantalla 6) ([FEATURE-039](../planning/items/FEATURE-039.md))
- Rediseño de "Mis alertas" según wireframe Stitch (tanda, pantalla 7) ([FEATURE-040](../planning/items/FEATURE-040.md))
- Crear alerta desde el listado con resultados (no solo en el estado vacío) ([FEATURE-041](../planning/items/FEATURE-041.md))
- Rediseño de "Mis acogidas" en dos pestañas (registro / propuestas) ([FEATURE-042](../planning/items/FEATURE-042.md))
- Rediseño del formulario de alta (patrón base) + ajustes de mis acogidas ([FEATURE-043](../planning/items/FEATURE-043.md))
- Rediseño de "Mis donaciones" (patrón base) + edición con un solo formulario ([FEATURE-044](../planning/items/FEATURE-044.md))
- Rediseño del panel de la protectora (dashboard) al patrón Stitch ([FEATURE-045](../planning/items/FEATURE-045.md))
- Layout del panel de la protectora a 2 columnas del wireframe Stitch ([FEATURE-046](../planning/items/FEATURE-046.md))
- Solicitudes recientes clicables + badge de estado legible sobre foto ([FEATURE-047](../planning/items/FEATURE-047.md))
- Mis animales" de la protectora a rejilla de tarjetas con búsqueda y acciones ([FEATURE-048](../planning/items/FEATURE-048.md))
- Efectos del área de usuario en el panel (Reveal, carrusel de fotos, hover) ([FEATURE-049](../planning/items/FEATURE-049.md))
- Rediseño de "Solicitudes recibidas" (maestra/detalle) del panel ([FEATURE-050](../planning/items/FEATURE-050.md))
- Rediseño de "Citas" de la protectora (wireframe Stitch) ([FEATURE-051](../planning/items/FEATURE-051.md))
- Botón "Ver recursos" con el estilo primario relleno ([FEATURE-052](../planning/items/FEATURE-052.md))
- Agenda de la protectora F1 — calendario mensual con excepciones por día ([FEATURE-053](../planning/items/FEATURE-053.md))
- Agenda de la protectora F2a — pintar días y cerrar rangos (batch) ([FEATURE-054](../planning/items/FEATURE-054.md))
- Agenda de la protectora F3 — vistas anual (heatmap) y diaria (timeline) ([FEATURE-055](../planning/items/FEATURE-055.md))
- Agenda de la protectora F2b — festivos nacionales y copiar/pegar día ([FEATURE-056](../planning/items/FEATURE-056.md))
- Agenda de la protectora F2c — plantillas de horario ([FEATURE-057](../planning/items/FEATURE-057.md))
- Rediseño de la gestión de acogidas de la protectora ([FEATURE-058](../planning/items/FEATURE-058.md))
- De-duplicar el slug de protectora (nombres repetidos) ([IMPROVEMENT-001](../planning/items/IMPROVEMENT-001.md))
- Rediseño UX del wizard de alta de protectora (+ fix del mapa gris) ([IMPROVEMENT-002](../planning/items/IMPROVEMENT-002.md))
- Pulido del shell chrome (sidebar + cabecera) hacia el mockup de Stitch ([IMPROVEMENT-003](../planning/items/IMPROVEMENT-003.md))
- Pulido del chrome (sidebar arena, cabecera) y estado vacío de Mi cuenta ([IMPROVEMENT-004](../planning/items/IMPROVEMENT-004.md))
- Editar los datos de la protectora mientras el alta está en revisión ([IMPROVEMENT-005](../planning/items/IMPROVEMENT-005.md))
- Completar el sidebar del adoptante con sus secciones (deshabilitadas) ([IMPROVEMENT-006](../planning/items/IMPROVEMENT-006.md))
- Pulido del wizard de alta — autocompletado de direcciones y layout ([IMPROVEMENT-007](../planning/items/IMPROVEMENT-007.md))
- Paso de ubicación del wizard — combos, orden top-down y fixes ([IMPROVEMENT-008](../planning/items/IMPROVEMENT-008.md))
- Wizard de alta — fix autocompletado y pulido de ubicación/perfil ([IMPROVEMENT-009](../planning/items/IMPROVEMENT-009.md))
- Wizard de alta — autorrelleno de provincia y nombres OSM ([IMPROVEMENT-010](../planning/items/IMPROVEMENT-010.md))
- Wizard de alta — combo de provincia, autocompletado solo al teclear y título lateral ([IMPROVEMENT-011](../planning/items/IMPROVEMENT-011.md))
- Recuperar el umbral de cobertura de funciones (deuda de tests) ([IMPROVEMENT-012](../planning/items/IMPROVEMENT-012.md))
- Vista "mis solicitudes" del adoptante ([IMPROVEMENT-013](../planning/items/IMPROVEMENT-013.md))
- Tests RLS ocasionalmente flaky por concurrencia entre ficheros ([IMPROVEMENT-014](../planning/items/IMPROVEMENT-014.md))
- README de calidad y manual de usuario (entrega TFM) ([IMPROVEMENT-015](../planning/items/IMPROVEMENT-015.md))
- Redirección post-login según rol (protectora al panel, admin a admin) ([IMPROVEMENT-016](../planning/items/IMPROVEMENT-016.md))
- Rediseño del dashboard de protectora (tarjetas de color y próximas citas) ([IMPROVEMENT-017](../planning/items/IMPROVEMENT-017.md))
- Rediseño de la home pública (hero con buscador, recién llegados, banda de stats y CTA) ([IMPROVEMENT-018](../planning/items/IMPROVEMENT-018.md))
- Rediseño del listado /animales (filtros horizontales, tarjetas con favorito y paginación numerada) ([IMPROVEMENT-019](../planning/items/IMPROVEMENT-019.md))
- Rediseño de la ficha pública de animal ([IMPROVEMENT-020](../planning/items/IMPROVEMENT-020.md))
- Búsqueda por texto/raza en el listado de animales ([IMPROVEMENT-021](../planning/items/IMPROVEMENT-021.md))
- Ejecutar los E2E de Playwright en CI, aprovechando el stack que ya levanta el job de RLS ([IMPROVEMENT-022](../planning/items/IMPROVEMENT-022.md))
- Subir CI y el runtime a Node 22+ (hoy el job de la app va en Node 20, ya deprecado) ([IMPROVEMENT-023](../planning/items/IMPROVEMENT-023.md))
- Pulido menor del perfil público de protectora (fallbacks del hero y de las tarjetas) ([IMPROVEMENT-024](../planning/items/IMPROVEMENT-024.md))
- Acogidas visibles en la navegación del usuario ([IMPROVEMENT-025](../planning/items/IMPROVEMENT-025.md))
- Sincronizar el estado del animal con su propuesta de acogida ([IMPROVEMENT-026](../planning/items/IMPROVEMENT-026.md))
- Vida y micro-interacciones en la web (cursor, count-up, reveal, header compacto, huellas) ([IMPROVEMENT-027](../planning/items/IMPROVEMENT-027.md))
- El mapa de protectoras se alinea con el lenguaje de la tanda (sin wireframe) ([IMPROVEMENT-028](../planning/items/IMPROVEMENT-028.md))
- Popup rico en los pines del mapa de perdidos (lenguaje de la tanda) ([IMPROVEMENT-029](../planning/items/IMPROVEMENT-029.md))
- Cards ricas en la pestaña de propuestas enviadas de acogida ([IMPROVEMENT-030](../planning/items/IMPROVEMENT-030.md))
- Filtro «Apto para piso» en la búsqueda de animales ([IMPROVEMENT-031](../planning/items/IMPROVEMENT-031.md))

#### 🚧 En camino (en desarrollo ahora)

_Nada en desarrollo en este momento._

#### 🗓️ Previsto

- Historias felices Nivel 2 — testimonios reales del adoptante — hito sin asignar ([FEATURE-059](../planning/items/FEATURE-059.md))
- Badge «Urgente» en fichas y listado de animales — hito sin asignar ([FEATURE-060](../planning/items/FEATURE-060.md))
- Buscador global en la cabecera del área privada — hito sin asignar ([FEATURE-061](../planning/items/FEATURE-061.md))
- Alinear las subpáginas de /mi-cuenta con el lenguaje del dashboard — hito sin asignar ([IMPROVEMENT-032](../planning/items/IMPROVEMENT-032.md))
<!-- RENDER:END -->

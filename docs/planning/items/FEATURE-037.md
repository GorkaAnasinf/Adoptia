---
id: FEATURE-037
tipo: feature
titulo: Rediseño del directorio de protectoras según wireframe Stitch (tanda, pantalla 3)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-19
actualizado: 2026-07-19
---

# FEATURE-037 — Rediseño del directorio de protectoras (/protectoras)

## Descripción

Tercera pantalla de la tanda: wireframe en `assets/wireframes/protectoras/`. A diferencia del listado de animales, aquí la vista actual es mucho más pobre que el mock — tarjetas planas sin buscador, sin filtros, sin foto de cabecera, sin contadores ni paginación. El mock pide:

- **Cabecera centrada**: título grande «Nuestras protectoras colaboradoras» + subtítulo.
- **Buscador** por nombre, ciudad o provincia + botón teal **«Ver mapa»**.
- **Chips de filtro** (pastilla activa granate).
- **Tarjetas ricas**: foto de cabecera con badge «Verificada», logo circular solapado, nombre, ubicación con icono, contadores **ANIMALES / ADOPCIONES** en granate, CTA granate «Ver perfil →» a todo el ancho.
- **Paginación** «Página 1 de 8» con flechas.

## Contexto / impacto

Escaparate de las protectoras (su motivo para unirse a la plataforma). Instrucción del usuario para la tanda: coherencia con lo ya liberado (home, listado), A11y de serie, detalles en falta bienvenidos.

## Plan de desarrollo

### Alcance

- **Dentro**: solo presentación + una ampliación de la consulta de lectura (campos ya existentes). Sin migraciones.
- **Fidelidad con cabeza (datos reales mandan)**:
  - Foto de cabecera = `shelters.cover_url` (ya existe, se sube desde el panel); sin cover → cabecera tonal con icono (nunca imagen rota).
  - Contadores reales: ANIMALES = disponibles publicados (ya se calcula); **ADOPCIONES = agregado nuevo** en la misma consulta (embed con alias, sin migración).
  - Badge «Verificada»: el directorio ya solo lista verificadas — badge fiel al dato.
  - **Fuera** (el mock trae contenido sin soporte en BD): chips Voluntariado/Acogida/Urgente y filtros «Aceptan voluntarios»/«Centros de acogida» — no existe el campo; si algún día se añade, item aparte. Los chips de filtro quedan: **Todas / Con animales en adopción**.
  - Buscador y filtros en cliente sobre la lista ya cargada (pocas decenas de protectoras, ISR 1 h — cero coste extra).
  - Paginación en cliente, **12 por página** (coherencia con /animales), estilo «Página 1 de N» + flechas del mock.
- **Coherencia tanda**: header/footer/breadcrumbs reales; tokens (`surface-container-*`, `shadow-soft`); `Reveal` escalonado; `motion-safe`; botón «Ver mapa» teal (rol de mapa ya es teal en el design system).
- **A11y**: chips con `aria-pressed`, buscador con label, paginación con `aria-label` y estado «Página X de N» anunciable, contadores con texto accesible completo (no solo el número), foco visible en todo.
- **Detalle en falta (aportación)**: estado vacío específico para «tu búsqueda no encuentra protectoras» (distinto de «aún no hay protectoras»), con botón para limpiar la búsqueda.

### Documentación a consultar

- `assets/wireframes/protectoras/{code.html,DESIGN.md,screen.png}`, [DESIGN](../../technical/DESIGN.md), skills `adoptia-frontend`/`adoptia-testing`. Items FEATURE-034/036 (lenguaje fijado).

### Seguridad

- Sin superficie nueva: lectura pública ya permitida por RLS (shelters verificadas + animals publicados). El agregado de adopciones usa el mismo embed contado que ya existe.

### Modelo de datos / API

- Sin cambios de esquema. `cargarProtectorasDirectorio` amplía el select: `cover_url` + embeds con alias `disponibles:animals(count)` / `adopciones:animals(count)` filtrados por estado.

### Frontend

- `src/lib/shelters-directory.ts`: select ampliado (cover_url, adopted_count) — test primero.
- `src/components/shelters/ShelterDirectory.tsx`: pasa a client component — buscador, chips (Todas/Con animales), tarjetas nuevas, paginación 12 con «Página X de N», Reveal, estados vacíos (sin datos / búsqueda sin resultados).
- `src/app/(public)/protectoras/page.tsx`: cabecera centrada + «Ver mapa» teal con icono.
- `messages/es.json` (`protectorasDir.*`): claves nuevas (buscador, chips, contadores, paginación, vacío de búsqueda).

### Tareas TDD

1. `shelters-directory.test.ts`: la consulta devuelve `cover_url` y `adopted_count` (mock del select con alias); protectora sin adopciones → 0.
2. `ShelterDirectory.test.tsx`: buscador filtra por nombre, ciudad y provincia (insensible a mayúsculas); sin coincidencias → vacío de búsqueda con botón limpiar que restaura la lista.
3. Chip «Con animales en adopción» (`aria-pressed`) deja fuera las de 0 disponibles; «Todas» restaura.
4. Tarjeta: badge «Verificada», contadores accesibles (N animales / N adopciones), enlace «Ver perfil» al slug; sin cover → cabecera fallback sin `img` rota; adaptar tests existentes al layout nuevo.
5. Paginación: >12 protectoras → «Página 1 de N», flechas con `aria-label`, sin «anterior» en la 1.ª ni «siguiente» en la última; el buscador/chip resetean a página 1.
6. Revisión visual contra `screen.png` (desktop/móvil) + `prefers-reduced-motion`.

### Dependencias

- FEATURE-034, IMPROVEMENT-027, FEATURE-036 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Cabecera centrada con el copy del mock; «Ver mapa» teal con icono; SEO con clave propia `seoTitle`.
- [x] Buscador por nombre/ciudad/provincia (insensible a mayúsculas) con label accesible — test; vacío de búsqueda propio con «Limpiar búsqueda» que restaura — test.
- [x] Chips Todas/Con animales con `aria-pressed` y pastilla activa granate — test.
- [x] Tarjetas: cover o fallback tonal sin imagen rota — test; badge «Verificada» (salvia), logo solapado, ubicación con icono, contadores reales ANIMALES/ADOPCIONES (agregados con alias verificados contra PostgREST real), CTA «Ver perfil de {nombre}» — tests.
- [x] Paginación 12/página «Página X de N», flechas con `aria-label`, sin flechas sobrantes en extremos, filtros resetean a página 1 — 2 tests.
- [x] Reveal escalonado `motion-safe`, foco visible, `active:scale`, cursor global.
- [x] Estado vacío original intacto — test.
- [x] Cero literales (el linter i18n pilló un falso positivo del ternario de clases — ver cierre); 17 claves nuevas.
- [x] QA: suite **1128/1128 con RLS**, cobertura 82,7 %, E2E 4/4, lint y tsc limpios.

## Cierre (2026-07-19)

- Directorio reconstruido al wireframe con datos 100 % reales: `cover_url` de shelters (existía sin usarse en el directorio) y **adopciones contadas con un segundo embed con alias** en la misma consulta (`disponibles:animals(count)` / `adopciones:animals(count)`) — sin migración; verificado contra PostgREST local además del mock del test.
- Fuera por falta de datos (contenido de relleno del mock): chips Voluntariado/Acogida/Urgente y filtros de voluntariado/acogida. Los chips reales: Todas / Con animales en adopción.
- Detalle añadido: vacío de búsqueda propio (≠ sin protectoras) con limpiar.
- Lección (recaída de FEATURE-024/025 con forma nueva): el linter i18n casa `=> cn("…" ? "…" : "…")` — una arrow sin llaves tras `=>` parece texto JSX; darle cuerpo con llaves lo corta. 
- Incidencia de entorno: Docker Desktop se paró a mitad de sesión — la página mostraba el vacío por «no hay Supabase», no por bug; se relanzó y verificó. Síntoma a recordar: directorio vacío en dev = comprobar `docker ps` antes de tocar código.

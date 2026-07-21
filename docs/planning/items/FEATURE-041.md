---
id: FEATURE-041
tipo: feature
titulo: Crear alerta desde el listado con resultados (no solo en el estado vacío)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-21
actualizado: 2026-07-21
---

> **Cierre (2026-07-21):** hecho en `feature/FEATURE-041-crear-alerta-listado`.
> `CrearAlertaButton` refactorizado: recibe `search: AnimalSearch` + `variant`
> ("bloque" estado vacío / "compacto" cabecera). Botón compacto teal siempre
> visible junto a "Ordenar por" en `/animales`; deshabilitado con pista cuando no
> hay filtros **guardables** (especie/tamaño/sexo/distancia — `edad`/texto/flags no
> cuentan, no se casan). Nombre-resumen a partir de los filtros ("Perro · Mediano ·
> a 30 km"). Formato de `filters` sin cambios → cron y `AlertaCard` (FEATURE-040)
> intactos. QA: suite **1033 verde**, typecheck y lint limpios; sin migraciones.
> **Pendiente:** despliegue. Follow-up abierto: guardar varios tamaños/sexos por
> alerta (hoy solo el primero).

# FEATURE-041 — Crear alerta desde la cabecera del listado

## Descripción

Hoy una alerta (búsqueda guardada) **solo** se puede crear cuando el listado
`/animales` devuelve **cero resultados** (botón en `AnimalSearchEmpty`). Es
contraintuitivo: no puedes guardar una búsqueda que sí tiene animales, que es
justo el caso normal ("hay perros medianos en Madrid pero ninguno es *el* mío,
avísame cuando entre otro"). Detectado al rediseñar `/mi-cuenta/alertas`
(FEATURE-040), cuyos CTA "Crear nueva alerta" llevan al listado pero el botón de
crear no aparece si hay resultados.

## Contexto / impacto

Afecta al adoptante y al motor de retorno de la plataforma. Las alertas son la
vía de recaptación por email; esconder su creación tras un estado vacío las
infrautiliza. Cerrar el círculo con la pantalla recién rediseñada.

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md`, `.claude/commands/adoptia-testing.md`.
- FEATURE-040 (vista destino `/mi-cuenta/alertas`, formato de `filters`).
- FEATURE-010 (creación original de alertas en el estado vacío).

### Seguridad

- Sin cambios. Sigue siendo un `insert` en `saved_searches` bajo RLS (dueño =
  `auth.uid()`), con el tope de 5 por la constraint existente. Sin sesión →
  redirige a `/login`.

### Modelo de datos

- **Sin cambios.** Mismo `filters` que hoy: `especie`, `tamano`, `sexo`,
  `lat`/`lng`/`radio_km`. **Clave:** no se cambia el formato para que el cron de
  matching (RPC sobre esas claves) y las tarjetas de `/mi-cuenta/alertas`
  (`AlertaCard`) sigan funcionando sin tocarse.

### API

- Sin cambios.

### Frontend

- **Refactor de `CrearAlertaButton`**: pasa a recibir `search: AnimalSearch` (el
  objeto ya parseado del servidor, como `OrdenSelect`) en vez de leer
  `useSearchParams`, y un `variant`:
  - `"bloque"` — el layout actual centrado del estado vacío (sin cambios visibles).
  - `"compacto"` — píldora teal con icono `BellPlus` para la cabecera de resultados,
    coherente con el lenguaje (rounded-full, secondary/teal de CTA).
- **Cabecera del listado** (`animales/page.tsx`): añadir el botón `compacto` junto
  a `OrdenSelect`. Reagrupar en una fila de acciones para que respiren en móvil.
- **Sin filtros activos** (`contarFiltrosActivos(search) === 0`): botón
  **deshabilitado** con pista ("Aplica algún filtro para crear una alerta") — evita
  alertas de "cualquier animal" que spamean.
- **Nombre automático = resumen de filtros**: en vez de solo la especie, construir
  "Perros · Medianos · a 30 km" a partir de los filtros **guardados** (especie +
  primer tamaño + primer sexo + distancia) — así el nombre casa con los chips que
  muestra `AlertaCard`. Reutiliza etiquetas `animales.*`/`busqueda.*`.
- **Estados** (idle/creando/ok/límite/error/sin-sesión) se conservan; en variante
  compacta el "ok" muestra confirmación breve + enlace "Ver mis alertas", sin
  romper la fila.
- **Estado vacío**: sigue ofreciendo la creación (misma lógica, `variant="bloque"`);
  se le pasa `search` para alinear nombre y filtros.
- Formato guardado idéntico → coherencia garantizada con la vista de FEATURE-040.

### Tareas TDD

1. Ampliar el test de `CrearAlertaButton` (o nuevo por variante): con filtros
   activos crea con el nombre-resumen correcto y los `filters` esperados; sin
   filtros el botón está deshabilitado y no inserta; sin sesión redirige a
   `/login`; tope → mensaje de límite.
2. Test de la cabecera de `animales/page.tsx`: el botón compacto aparece siempre,
   deshabilitado sin filtros, habilitado con filtros.
3. Verificación visual contra el lenguaje del listado + `npx tsc --noEmit` + lint +
   suite.

### Dependencias

- Ninguna. (Consolida FEATURE-040.)

## Criterios de aceptación / Casuística a cubrir

- [ ] "Crear alerta" visible en la cabecera del listado tanto con resultados como sin ellos.
- [ ] Sin filtros activos: deshabilitado con pista; no crea nada.
- [ ] Con filtros: crea la alerta con `filters` correctos y nombre-resumen legible.
- [ ] La alerta creada aparece en `/mi-cuenta/alertas` con los chips correctos (coherencia FEATURE-040).
- [ ] Sin sesión: redirige a `/login`. Con 5 alertas: mensaje de tope, no crea.
- [ ] Diseño acorde al lenguaje del listado (teal CTA, rounded-full, icono).
- [ ] Formato de `filters` sin cambios (cron y AlertaCard intactos).

## Fuera de alcance / follow-up

- Guardar **varios** tamaños/sexos en una alerta (hoy se guarda solo el primero,
  como en FEATURE-010): requiere tocar cron + `AlertaCard`. Anotar como follow-up.
- Deduplicar alertas con filtros idénticos: no se aborda aquí.

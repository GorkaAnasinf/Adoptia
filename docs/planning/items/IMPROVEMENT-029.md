---
id: IMPROVEMENT-029
tipo: improvement
titulo: Popup rico en los pines del mapa de perdidos (lenguaje de la tanda)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-20
actualizado: 2026-07-20
---

# IMPROVEMENT-029 — Popup rico en los pines del mapa de perdidos

## Descripción

Petición del usuario tras liberar FEATURE-038: el popup de los pines del mapa de perdidos sigue siendo el plano anterior a la tanda (negrita + enlace subrayado), mientras el mapa de protectoras estrenó en IMPROVEMENT-028 el popup rico (nombre terracota, línea muted, chip tonal, CTA granate). Unificar: llevar ese mismo diseño al popup de los avisos. Dirección confirmada por el usuario (rico → perdidos).

## Contexto / impacto

Coherencia visual entre los dos mapas públicos. El globo (radios + sombra de marca) ya es común vía `globals.css` (IMPROVEMENT-028); solo cambia el contenido.

## Plan de desarrollo

### Alcance

- Solo el contenido del popup en `MapaAvisosInner`. Mecánica del mapa intacta.
- Diseño (calcado del popup de /mapa, adaptado al aviso):
  - Título en Montserrat terracota: nombre del animal, o «Perdido»/«Encontrado» si no hay nombre (mismo fallback que la tarjeta).
  - Línea muted: `ciudad · Perdido/Encontrado el {fecha del suceso}` (claves de FEATURE-038; semántica de FEATURE-023).
  - Chip tonal 🐾 con el tipo: granate suave para perdido, teal suave para encontrado (patrón del chip de animales de /mapa).
  - CTA botón granate a todo el ancho «Ver aviso» (sustituye al enlace subrayado).
- A diferencia de /mapa (HTML crudo + escape), aquí el popup es JSX de react-leaflet: se extrae un componente puro `PopupAviso` (testeable sin Leaflet) y `MapaAvisosInner` lo renderiza dentro de `<Popup>`.

### Documentación a consultar

- `src/components/map/popup.ts` (diseño de referencia), skills `adoptia-frontend`/`adoptia-testing`. Items IMPROVEMENT-028 y FEATURE-038.

### Seguridad

- Sin superficie nueva. JSX escapa solo (no hay HTML crudo).

### Modelo de datos / API

- Sin cambios.

### Frontend

- `src/components/perdidos/PopupAviso.tsx` (nuevo, puro): título, línea ciudad·fecha, chip, CTA.
- `src/components/perdidos/MapaAvisosInner.tsx`: renderiza `PopupAviso`; fuera el contenido plano.
- `messages/es.json`: sin claves nuevas previstas (reutiliza `perdidoEl`/`encontradoEl`/`verAviso`, `tipoLost`/`tipoFound`).

### Tareas TDD

1. `PopupAviso.test.tsx` — título terracota (`text-primary`) con nombre; sin nombre cae al tipo; línea `ciudad · Perdido el {fecha}`.
2. Chip tonal por tipo (clase granate suave / teal suave) y CTA «Ver aviso» como enlace granate a la ficha.
3. Integración en `MapaAvisosInner` (sin test unitario — react-leaflet; cubierto por E2E del mapa de perdidos y revisión visual).
4. Revisión visual del popup en dev (desktop) + suite.

### Dependencias

- IMPROVEMENT-028 y FEATURE-038 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Popup con título terracota; aviso sin nombre → «Perdido»/«Encontrado» — tests.
- [x] Línea muted `ciudad · {tipo} el {fecha del suceso}`; sin ciudad → solo la fecha — test.
- [x] Chip tonal 🐾 granate/teal según tipo — test.
- [x] CTA «Ver aviso» granate a todo el ancho enlazando a `/perdidos-encontrados/{id}` — test.
- [x] Mecánica del mapa intacta (E2E perdidos verdes).
- [x] Cero literales; suite completa con RLS, lint y tsc limpios.

## Cierre (2026-07-20)

- `PopupAviso` (componente puro, testeable sin Leaflet) sustituye al contenido plano del popup en `MapaAvisosInner`: mismo lenguaje que el popup de protectoras de IMPROVEMENT-028 (título terracota, línea muted, chip tonal, CTA granate a todo el ancho). El globo (radios + sombra) ya era compartido vía `globals.css`.
- Verificado visualmente en dev clicando un marcador: título, ciudad·fecha del suceso, chip granate y botón «Ver aviso» — idéntico al popup de /mapa.
- QA: suite **1144/1144 con RLS**, cobertura 82,79 %, E2E perdidos **4/4 en chromium** (un fallo/flaky inicial en la pasada con los 3 proyectos resultó ser contaminación de datos de ejecuciones E2E previas — patrón ya documentado de BUG-008/límite de 8 recientes —, no relacionado con este cambio; repetido en limpio y verde), lint y tsc limpios.

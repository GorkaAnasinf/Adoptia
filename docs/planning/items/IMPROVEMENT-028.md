---
id: IMPROVEMENT-028
tipo: improvement
titulo: El mapa de protectoras se alinea con el lenguaje de la tanda (sin wireframe)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-19
actualizado: 2026-07-19
---

# IMPROVEMENT-028 — Orden visual en el mapa de protectoras (/mapa)

## Descripción

Cuarta pantalla de la tanda, **sin wireframe** — instrucción del usuario: poner orden en los filtros de la izquierda y enriquecer la información de los popups del mapa, basándose en el lenguaje ya desarrollado (home, /animales, /protectoras). Estado actual: chips con borde y fondo blanco (estilo pre-tanda), tarjetas de lista planas con borde negro, popup de Leaflet crudo (texto gris + enlace subrayado).

## Contexto / impacto

El mapa es la vista geográfica del directorio; tras FEATURE-037 el contraste de estilo entre ambas es evidente. La funcionalidad (filtros por URL, geocoding, clusters, bottom sheet móvil, sincronía lista↔mapa) funciona y NO se toca — BUG-008 la estabilizó.

## Plan de desarrollo

### Alcance

- **Dentro**: solo presentación. Misma navegación por URL, mismo RPC `shelters_nearby`, misma lógica de clusters/popups/bottom sheet.
- **Panel lateral** (y bottom sheet móvil): superficie tonal `surface-container-low` con tarjetas blancas `shadow-soft` (patrón de paneles de la tanda).
- **Chips de filtro**: estilo FEATURE-037 — activo granate relleno, inactivo `surface-container-high`, `aria-pressed` (ya existe), foco visible, `motion-safe:active:scale-95`.
- **Ubicación y ciudad**: «Usar mi ubicación» como enlace terracota con icono (patrón HeroSearch/listado); buscador de ciudad con icono y botón «Buscar» granate.
- **Tarjetas de la lista**: nombre en terracota (patrón AnimalCard), ubicación+distancia con icono, contador de animales como chip con huella, «Ver protectora» con flecha; selección/hover con ring terracota (se conserva la sincronía con el mapa).
- **Popup del mapa** (lo «muy simple» del feedback): estructura rica — nombre en Montserrat, ciudad **+ distancia** (hoy no sale), contador de animales con huella, CTA «Ver protectora» como botón granate. Contenedor del popup redondeado con sombra suave vía CSS global de Leaflet (`.leaflet-popup-content-wrapper`).
- **Fuera**: cambiar los iconos de marcador/cluster de Leaflet (funcionan, BUG-008; personalizarlos es un item aparte si se quiere), y cualquier cambio de datos.

### Documentación a consultar

- [DESIGN](../../technical/DESIGN.md), skill `adoptia-frontend` (regla: Leaflet siempre `dynamic import`), items FEATURE-034/036/037.

### Seguridad

- Sin superficie nueva. El popup sigue pasando por `escapeHtml` (no se relaja).

### Modelo de datos / API

- Sin cambios.

### Frontend

- `MapaFiltros.tsx`: chips y buscador al estilo tanda (comportamiento intacto — tests existentes son la red).
- `ListaProtectoras.tsx`: tarjeta nueva (mismos handlers de selección/hover).
- `MapaProtectorasInner.tsx`: `popupHtml` enriquecido — se exporta para testearlo.
- `MapaShell.tsx`: superficies del aside y del bottom sheet.
- `globals.css`: estilos del contenedor de popup de Leaflet (redondeo + sombra suave + tipografía).

### Tareas TDD

1. `popupHtml` (export nuevo) — test primero: incluye nombre, ciudad, **distancia formateada** cuando existe (y no cuando es null), contador y enlace al slug; el HTML malicioso llega escapado.
2. Tests existentes de `MapaFiltros`/`ListaProtectoras`/`MapaShell` en verde tras el restyle (comportamiento intacto).
3. Revisión visual (dev + capturas desktop/móvil con bottom sheet) y `prefers-reduced-motion`.

### Dependencias

- FEATURE-037 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Panel y bottom sheet sobre `surface-container-low`; chips estilo tanda con `aria-pressed`, foco visible y `motion-safe:active:scale-95`.
- [x] Tarjetas de lista: nombre terracota, MapPin + ciudad·distancia, chip salvia con huella, «Ver protectora →»; selección/hover con `ring-primary` sincronizados (tests existentes adaptados: 1 aserción de clase).
- [x] Popup nuevo (`popup.ts`, módulo puro exportado): nombre Montserrat terracota, ciudad **+ distancia**, chip de animales, CTA granate; contenedor redondeado con sombra suave vía CSS de Leaflet — 5 tests, incluido escape anti-XSS.
- [x] Leaflet sigue con `dynamic import`; marcadores/clusters intactos (BUG-008 respetado).
- [x] Cero literales — de propina se cazó un literal preexistente: el `aria-label` del aside estaba hardcodeado (ahora `mapa.panelLabel`).
- [x] QA: suite **1133/1133 con RLS**, E2E mapa + área pública 5/5 (1 skip por diseño: variante móvil del flujo de escritorio), lint y tsc limpios.

## Cierre (2026-07-19)

- Mapa alineado con la tanda sin tocar su mecánica (filtros por URL, geocoding, clusters, bottom sheet, sincronía lista↔mapa). `popupHtml` extraído a `src/components/map/popup.ts` para testearlo sin cargar Leaflet en jsdom.
- El popup gana la distancia (antes no salía) y CTA de botón; el globo de Leaflet se estiliza global en `globals.css` (`.leaflet-popup-content-wrapper`).
- Capturas desktop (popup abierto) y móvil (bottom sheet) revisadas.

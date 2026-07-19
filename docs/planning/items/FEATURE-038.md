---
id: FEATURE-038
tipo: feature
titulo: Rediseño de Perdidos y encontrados según wireframe Stitch (tanda, pantalla 5)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-19
actualizado: 2026-07-19
---

# FEATURE-038 — Rediseño del listado de Perdidos y encontrados (/perdidos-encontrados)

## Descripción

Quinta pantalla de la tanda: wireframe en `assets/wireframes/animalesperdidos/`. La vista ya fue rediseñada una vez (FEATURE-025, mockup viejo) y es funcionalmente rica (chips, «Más filtros», mapa, 8 recientes + ver todos); el trabajo es alinearla con el lenguaje Stitch fijado en la tanda. El mock pide:

- **Breadcrumbs** Inicio → Perdidos y encontrados + **hero**: H1 grande terracota, subtítulo cálido, CTA granate **«Publicar aviso»** con icono y sombra.
- **Chips** Todos/Perdidos/Encontrados: activa pastilla granate rellena, inactivas tonales (`surface-container-high`, sin borde).
- **Mapa** 400px `rounded-xl` con sombra ambiente y la **nota de privacidad como overlay dentro del mapa** (abajo-izquierda, `surface/90` + blur).
- **Tarjetas**: imagen cuadrada, **badge «Perdido» granate / «Encontrado» teal** sobre la foto, nombre en Montserrat, ciudad con icono, fecha, hover elevado. Sin botón «Ver detalles» (tarjeta clicable).
- **«Ver más avisos»** como botón outline granate centrado.

## Contexto / impacto

Pantalla comunitaria con más tráfico potencial de no-registrados. Instrucción de la tanda: coherencia con lo liberado (home, /animales, /protectoras, /mapa), A11y de serie, detalles en falta bienvenidos. Cadencia confirmada: circuito completo y liberación por pantalla.

## Plan de desarrollo

### Alcance

- **Dentro**: solo presentación. Mismo RPC `lost_found_list`, mismo filtrado en cliente, misma mecánica del mapa.
- **Fidelidad con cabeza (datos y funcionalidad reales mandan)**:
  - **Se conserva todo lo que el mock no dibuja pero existe**: «Más filtros» (especie/tamaño/fecha de FEATURE-023) — pasa a panel tonal estilo /animales; vacíos diferenciados (sin avisos / filtros sin resultados); límite 8 recientes + «Ver todos» (el «Ver más avisos» del mock es ese mismo botón, restilado); raza·color en tarjeta.
  - **Fecha de tarjeta**: el mock dice «Publicado el 13 de julio», pero FEATURE-023 fijó que manda la fecha del **suceso** (`occurred_on`). Se mantiene la semántica con formato absoluto del mock: «Perdido el 13 de julio» / «Encontrado el 8 de julio» (reutiliza las claves de tipo). No se reintroduce el bug que arregló FEATURE-023.
  - **Badges** pasan de rose/emerald genéricos a los roles del design system: perdido = granate (`primary`), encontrado = teal (`secondary`), como el mock.
  - **Marcadores del mapa** (`MapaAvisosInner.COLOR`): hoy rojo `#dc2626` / verde `#059669`; se alinean a granate `#9f402d` / teal `#396662` para que badge y marcador cuenten la misma historia (mantiene la distinción perdido/encontrado de FEATURE-012).
  - **Tarjeta clicable entera** (patrón stretched-link accesible: un solo enlace en el nombre expandido con `after:absolute after:inset-0`), se retira el botón «Ver detalles». Foco visible sobre la tarjeta.
  - **Grid**: el mock baja a 1 columna en móvil; gana la tanda y la skill frontend (2 móvil / 4 desktop como /animales), con `aspect-square` del mock.
- **Coherencia tanda**: `Breadcrumbs` real, hero con H1 terracota + subtítulo (copy del mock), CTA granate con icono, tokens `surface-container-*` + `shadow-soft`, `Reveal` escalonado en tarjetas, `motion-safe:active:scale-95`, header/footer reales (no los del mock).
- **A11y**: chips mantienen `aria-pressed`; overlay de privacidad sigue siendo texto legible (no solo dentro del canvas del mapa: se mantiene también accesible — el overlay es un `<p>` posicionado); tarjeta con nombre como enlace único (sin enlaces duplicados al mismo destino); contraste AA de los badges rellenos (par granate/blanco y teal/blanco ya validados).
- **Detalle en falta (aportación)**: al filtrar, el número de avisos visibles se anuncia junto a los chips («N avisos», `aria-live="polite"`) — hoy el usuario de lector de pantalla no sabe que la lista cambió.

### Documentación a consultar

- `assets/wireframes/animalesperdidos/{code.html,DESIGN.md,screen.png}`, [DESIGN](../../technical/DESIGN.md), skills `adoptia-frontend`/`adoptia-testing`. Items FEATURE-034/036/037 e IMPROVEMENT-027/028 (lenguaje fijado).

### Seguridad

- Sin superficie nueva: lectura pública ya cubierta (RPC `lost_found_list` con ubicación redondeada). La nota de privacidad se conserva (RGPD — sigue visible como overlay).

### Modelo de datos

- Sin cambios.

### API

- Sin cambios.

### Frontend

- `src/app/(public)/perdidos-encontrados/page.tsx`: breadcrumbs + hero (H1 terracota, subtítulo, CTA granate con icono, layout del mock), `seoTitle` propio si el H1 comercial no sirve de título.
- `src/components/perdidos/PerdidosView.tsx`: chips tonales sin borde (activa granate), panel «Más filtros» tonal, mapa con overlay de privacidad, tarjetas nuevas (aspect-square, badges granate/teal, fecha absoluta del suceso, stretched-link, Reveal), contador `aria-live`, botón «Ver más avisos» outline granate.
- `src/components/perdidos/MapaAvisosInner.tsx`: constantes de color de marcador a granate/teal.
- `messages/es.json` (`perdidos.*`): claves nuevas (fecha del suceso con tipo, contador de avisos, seoTitle si aplica); sin literales.

### Tareas TDD

1. `PerdidosView.test.tsx` — tarjeta: badge con clase granate para `lost` y teal para `found`; fecha absoluta del suceso «{tipo} el {fecha}» (no relativa); adaptar tests existentes al layout nuevo.
2. Tarjeta clicable: el nombre es el único enlace a `/perdidos-encontrados/{id}` y no existe el botón «Ver detalles»; foco visible (clase presente).
3. Contador accesible: al activar un chip, el texto «N avisos» refleja los visibles y tiene `aria-live="polite"` — test con filtro que reduce la lista.
4. Overlay de privacidad: la nota se renderiza (texto de `avisoPrivacidad` presente) tras mover al overlay — adaptar test si existía.
5. `MapaAvisosInner`: COLOR exporta granate/teal (test de constantes o snapshot de `pathOptions`).
6. Restyle sin lógica (hero, chips tonales, panel tonal, Reveal, botón final) — cubierto por tests de comportamiento existentes (chips `aria-pressed`, filtros combinables, vacíos, ver todos) que deben seguir verdes.
7. Revisión visual contra `screen.png` (desktop/móvil) + `prefers-reduced-motion`.

### Dependencias

- FEATURE-034/036/037, IMPROVEMENT-027/028 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Breadcrumbs reales + hero del mock (H1 terracota, subtítulo, CTA granate con icono `motion-safe:active:scale-95`).
- [x] Chips Todos/Perdidos/Encontrados tonales, activa granate rellena, `aria-pressed` intacto — tests existentes verdes.
- [x] «Más filtros» conservado y funcional (especie/tamaño/fecha combinables) en panel tonal — tests existentes verdes.
- [x] Mapa: mecánica intacta, marcadores granate/teal, overlay de privacidad legible dentro del mapa — tests.
- [x] Tarjetas: aspect-square, badge granate/teal, nombre Montserrat como enlace único (stretched-link, foco visible), ciudad con icono, raza·color conservado, fecha absoluta del suceso con etiqueta de tipo — tests.
- [x] 8 recientes + «Ver más avisos» outline granate; con ≤8 no aparece — test existente adaptado.
- [x] Vacíos diferenciados intactos (sin avisos / filtros sin resultados) — tests existentes verdes.
- [x] Contador «N avisos» con `aria-live="polite"` actualizado al filtrar — test.
- [x] Reveal escalonado `motion-safe`; grid 2 móvil / 4 desktop.
- [x] Cero literales — claves nuevas en `perdidos.*`.
- [x] QA: suite completa con RLS verde, E2E área pública verdes, lint y tsc limpios; capturas comparadas con `screen.png`.

## Cierre (2026-07-19)

- Listado alineado al wireframe conservando toda la funcionalidad que el mock no dibuja: «Más filtros» (panel tonal), vacíos diferenciados, 8 recientes + «Ver más avisos», raza·color.
- La fecha de tarjeta pasa a absoluta con la semántica de FEATURE-023 intacta: «Perdido/Encontrado el {fecha del suceso}» — el copy del mock («Publicado el») habría reintroducido aquel bug.
- Badge y marcador del mapa comparten ahora `COLOR_AVISO` (granate/teal) — fuera el rojo/verde genérico de FEATURE-012, misma distinción con los roles del design system.
- Detalle añadido no pedido por el mock: contador «N avisos» con `aria-live="polite"` junto a los chips.
- Hallazgo colateral: el token `surface-container-highest` figuraba en `docs/technical/DESIGN.md` y lo usaba el hover de los chips del mapa (IMPROVEMENT-028), pero **no existía en `globals.css`** — hover no-op silencioso. Añadido el token; el hover de MapaFiltros funciona ahora sin tocar su código.
- QA: suite **1138/1138 con RLS**, cobertura 82,7 %, E2E perdidos + área pública **11/11** (+1 skip conocido del arrastre táctil), lint y tsc limpios. Capturas desktop/móvil contra `screen.png`.
- Lección de verificación visual: una captura `fullPage` sin scroll deja las tarjetas con `Reveal` en blanco (el IntersectionObserver nunca dispara) — hay que scrollear antes de capturar; no es un bug de la página.

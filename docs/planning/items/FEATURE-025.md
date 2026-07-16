---
id: FEATURE-025
tipo: feature
titulo: Rediseño del listado/mapa de Perdidos y encontrados (mockup nuevo)
estado: listo
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-16
actualizado: 2026-07-16
---

# FEATURE-025 — Rediseño del listado/mapa de Perdidos y encontrados

## Descripción

El usuario aporta un mockup nuevo de la pantalla `/perdidos-encontrados`. Cambios frente al diseño actual:

- **Filtros**: los chips Todos/Perdidos/Encontrados se mantienen; los selects de especie/tamaño/fecha se esconden tras un botón **«Más filtros»** (colapsados por defecto — hoy ocupan media pantalla).
- **Tarjetas verticales**: foto grande arriba con el badge PERDIDO/ENCONTRADO superpuesto sobre la foto, nombre, tiempo relativo («Hace 2 días»), ciudad y botón **«Ver detalles»** (outline). Hoy son filas horizontales con foto 80px.
- **Sección «Avisos recientes»** con enlace «Ver todos»: se muestran los N más recientes y el resto se despliega bajo demanda.
- Grid 2 col móvil / 4 desktop (patrón de listados del design system).

Forma parte de una tanda de 3 rediseños (con FEATURE-026 ficha y FEATURE-027 alta) que se entregan juntos.

## Contexto / impacto

Es la puerta de entrada de la sección perdidos. El diseño actual es funcional pero plano; el mockup alinea la pantalla con el resto del producto (tarjetas de animales en adopción ya son verticales con foto protagonista).

## Plan de desarrollo

### Alcance (decidido con el usuario)

- **Dentro**: solo presentación — mismos datos, mismo RPC, mismos filtros.
- **Fuera**: distancia «a 2 km» del mockup (exige geolocalización del visitante — item aparte si se quiere); búsqueda por texto sobre el mapa; cambios en marcadores/popups del mapa (ya funcionan y BUG-008 los estabilizó).
- **Cadencia de pruebas (decisión del usuario)**: la suite completa se pasa **una sola vez al final de los 3 items de la tanda**; durante cada item, solo los tests de los componentes tocados. Los 3 items van en la misma rama `feature/FEATURE-025-rediseno-perdidos`.

### Documentación a consultar

- [DESIGN](../../technical/DESIGN.md) (tokens, tarjetas, estados vacíos), skill `adoptia-frontend`, `adoptia-testing`.

### Seguridad

- Sin superficie nueva: sin cambios de datos ni de auth. Solo presentación.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios (`lost_found_list` se queda como está).

### Frontend

- `PerdidosView.tsx`: botón «Más filtros» (aria-expanded) que colapsa/expande los 3 selects; tarjetas verticales (foto `aspect-4/3` + badge superpuesto + `Ver detalles`); encabezado «Avisos recientes» + «Ver todos» (muestra 8, despliega el resto); tiempo relativo con `format.relativeTime`.
- `page.tsx` del listado: sin cambios estructurales (header ya coincide con el mockup).
- Textos nuevos en `messages/es.json` bajo `perdidos.*`.

### Tareas TDD

1. `PerdidosView.test.tsx`: «Más filtros» colapsado por defecto (selects no visibles), al pulsar aparecen y filtran igual que hoy.
2. Tarjeta vertical: badge sobre la foto, nombre, tiempo relativo, ciudad y enlace «Ver detalles» a la ficha; sin foto cae al placeholder 🐾.
3. «Avisos recientes»: con >8 avisos se ven 8 y el botón «Ver todos»; al pulsarlo se ven todos; con ≤8 no hay botón.
4. Estados vacíos intactos (sin avisos / filtros sin resultado).

### Dependencias

- FEATURE-024 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [ ] Chips de tipo funcionan igual; selects tras «Más filtros», colapsados por defecto, accesibles (aria-expanded, teclado).
- [ ] Tarjeta vertical: foto grande con badge superpuesto, nombre, «Hace X», ciudad, botón «Ver detalles» (target ≥44px).
- [ ] Aviso sin foto → placeholder 🐾, nunca imagen rota (no reintroducir BUG-006).
- [ ] «Ver todos» solo si hay más de 8; al pulsar, muestra todos.
- [ ] Estados vacíos distinguen «no hay avisos» de «los filtros no dejan ver ninguno».
- [ ] Cero literales: todo en `messages/es.json`.
- [ ] El mapa y sus filtros siguen sincronizados con la lista (mismo `visibles`).

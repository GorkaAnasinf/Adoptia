---
id: IMPROVEMENT-019
tipo: improvement
titulo: Rediseño del listado /animales (filtros horizontales, tarjetas con favorito y paginación numerada)
estado: desarrollo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-13
actualizado: 2026-07-13
---

# IMPROVEMENT-019 — Rediseño del listado público /animales

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Según mockup del usuario:

1. **Barra de filtros horizontal** arriba (sustituye al sidebar): combos Especie / Tamaño / Edad / Sexo, slider de distancia, checkboxes «Bueno con niños», «Bueno con animales», «Apto para piso», botón «Limpiar filtros» y botón teal «Aplicar filtros» (los filtros dejan de aplicarse al vuelo: se editan en local y se aplican al pulsar).
2. **Cabecera de resultados**: «Peludos cerca de ti (N resultados)» + selector «Ordenar por: Más recientes/Más cercanos» a la derecha (aplica al cambiar).
3. **Tarjetas**: corazón de favorito arriba a la derecha (optimistic, sin sesión → login), badge «Recién llegado» sobre la foto (<14 días, ahora también en el listado), nombre en terracota con icono de sexo, línea «edad · tamaño · distancia», protectora con icono.
4. **Paginación numerada** (1 2 3 … N) con elipsis y enlace «Ver más resultados» a la página siguiente.

## Contexto / impacto

El listado es la pantalla más usada por adoptantes. El sidebar de chips consume ancho, los favoritos solo se pueden marcar desde la ficha y la paginación anterior/siguiente es pobre con muchos resultados. Nota: el badge «Urgente» del mockup queda fuera — no existe ese dato en el modelo (candidato a item futuro con campo en BD).

<!-- ============ PLANO 2: PLAN TÉCNICO ============ -->

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md`, `.claude/commands/adoptia-testing.md`, `docs/technical/DESIGN.md`

### Seguridad

- Sin superficie nueva. Favoritos reutiliza `FavoritoButton` (RLS `favorites_owner_all` ya testada); filtros siguen pasando por `parseAnimalSearch` (valores inválidos se ignoran).

### Modelo de datos

- Sin cambios.

### API

- Sin cambios.

### Frontend

- **`AnimalSearchFilters.tsx`** (rework): estado local (borrador) inicializado desde `search`; selects Especie/Tamaño/Edad/Sexo, slider distancia (25–500 km, activo solo con ubicación; chip «Usar mi ubicación» se mantiene), checkboxes de compatibilidad («Apto para piso» no existe como filtro del RPC — se mapea al filtro existente más cercano NO: se omite y se anota como limitación, el RPC no filtra por `apartment_suitable`)*. Botones «Limpiar filtros» y «Aplicar filtros» (teal `bg-secondary`). El campo orden sale del panel.
  - *Corrección: el mockup pide «Apto para piso»; el RPC `animals_search` no tiene ese parámetro → checkbox omitido en esta iteración (anotado como follow-up).
- **`AnimalesPage`**: layout a una columna (filtros arriba en tarjeta blanca, grid debajo a 4 col); h1 «Peludos cerca de ti» + «(N resultados)»; select «Ordenar por» (client, navega al cambiar); paginación numerada con elipsis (`1 … actual±1 … N`) + «Ver más resultados» → página siguiente.
- **`AnimalCard`**: badge «Recién llegado» pasa a mostrarse siempre (no solo con `conCta`); nueva prop `conFavorito` que superpone `FavoritoButton` (wrapper que corta la propagación para no navegar); nombre `text-primary` + icono de sexo; línea «edad · tamaño · distancia»; protectora con icono debajo.
- Textos nuevos en `messages/es.json` (`busqueda.*`).

### Tareas TDD

1. Test `AnimalSearchFilters`: cambiar selects NO navega hasta pulsar «Aplicar filtros» (query combinada correcta); «Limpiar filtros» navega a la ruta limpia → rework del componente.
2. Test selector de orden: cambiar a «Más cercanos» navega con `orden=cercanos` (deshabilitado sin ubicación) → componente `OrdenSelect`.
3. Test `AnimalCard`: badge «Recién llegado» sin `conCta`; `conFavorito` renderiza el corazón y su clic no dispara la navegación de la tarjeta; nombre+sexo+tamaño+protectora visibles → implementar.
4. Test paginación: con 12 páginas y actual=1 renderiza 1, 2, 3, elipsis y 12 con hrefs correctos; «Ver más resultados» apunta a página 2; en la última página no aparece → helper `paginasVisibles` + render.
5. Test página: h1 con recuento y filtros arriba (sin sidebar) → layout.

### Dependencias

- Ninguna.

## Criterios de aceptación / Casuística a cubrir

- [ ] Filtros en barra horizontal con borrador local y botón «Aplicar filtros» teal; «Limpiar filtros» resetea todo.
- [ ] Slider de distancia solo activo con ubicación; «Usar mi ubicación» disponible; error de permiso mostrado.
- [ ] Cabecera «Peludos cerca de ti (N resultados)» y «Ordenar por» funcional (cercanos requiere ubicación).
- [ ] Tarjeta: corazón de favorito (optimistic; sin sesión → /login; clic no navega a la ficha), badge «Recién llegado» <14 días, nombre terracota + icono sexo, «edad · tamaño · distancia», protectora con icono.
- [ ] Paginación numerada con elipsis + «Ver más resultados»; estados: 1 página (sin paginación), página intermedia, última página.
- [ ] Estado vacío de búsqueda se conserva.
- [ ] Móvil: filtros colapsables (details) se mantienen; grid 2 col.
- [ ] Textos en `messages/es.json`; lint, tsc y suite en verde.

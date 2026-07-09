---
id: FEATURE-005
tipo: feature
titulo: Área pública — home, búsqueda de animales y fichas
estado: desarrollo
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-09
---

# FEATURE-005 — Área pública: home, búsqueda de animales y fichas

## Descripción

Cualquier visitante (sin cuenta) puede: ver la home con buscador rápido y animales recientes; buscar animales con filtros (especie, tamaño, edad, sexo, distancia, compatibilidades) y ordenación; y consultar la ficha completa de cada animal y de cada protectora. (Ref: U1, U3, U4, U5)

## Contexto / impacto

Es la cara de la plataforma y la fuente de tráfico orgánico (SEO). Las fichas indexadas en Google son el canal de captación principal.

## Plan de desarrollo

### Documentación a consultar

- Prompts Stitch §1.1, 1.3, 1.4 y ficha protectora, [DESIGN](../../technical/DESIGN.md), [DATA_MODEL](../../technical/DATA_MODEL.md), skill `adoptia-frontend`

### Seguridad

- Todo lectura pública vía RLS (solo publicado+verificado). Sin datos personales expuestos.

### Modelo de datos

- Sin cambios. Query de proximidad de DATA_MODEL para orden por distancia.

### API

- Sin handlers: Server Components consultan Supabase directamente.

### Frontend

- Home (Stitch 1.1): hero + buscador (especie+ubicación), fila de recientes, "cómo funciona", contadores, CTA protectoras, footer legal.
- Listado (Stitch 1.3): grid 2/4 columnas, chips de filtro, slider distancia, orden cercanos/recientes, paginación, estado vacío con CTA de alerta (deshabilitado hasta FEATURE-010).
- Ficha animal (Stitch 1.4): galería, chips compatibilidad, salud, historia, tarjeta protectora con mini-mapa, barra sticky "Me interesa" + compartir WhatsApp.
- Ficha protectora: info, instalaciones, mapa, sus animales, cómo colaborar.
- SSR/ISR con revalidación; `generateMetadata` por ficha.

### Tareas TDD

1. Test query de listado con filtros combinados (unit sobre builder).
2. Test orden por distancia con seed geolocalizado.
3. Test: animal reservado muestra badge y sin botón "Me interesa".
4. Test estados vacíos (sin resultados, protectora sin animales).
5. E2E: home → filtrar → ficha → volver conservando filtros.

### Dependencias

- FEATURE-003 (contenido), FEATURE-002 (protectoras verificadas).

## Criterios de aceptación / Casuística a cubrir

- [ ] Navegación completa sin cuenta; "Me interesa" pide login solo al pulsarlo.
- [ ] Filtros combinables y reflejados en URL (compartible, back correcto).
- [ ] Sin ubicación concedida: orden por recientes y aviso no intrusivo.
- [ ] Distancia mostrada solo si hay ubicación del usuario.
- [ ] Animal despublicado/adoptado: su URL devuelve página amable con sugerencias, no 404 seco.
- [ ] LCP <2.5 s móvil en listado con imágenes optimizadas (`next/image`).
- [ ] Accesibilidad AA: fotos con alt, navegación por teclado en galería y filtros.

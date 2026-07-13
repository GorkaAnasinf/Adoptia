---
id: IMPROVEMENT-018
tipo: improvement
titulo: Rediseño de la home pública (hero con buscador, recién llegados, banda de stats y CTA)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-13
actualizado: 2026-07-13
---

# IMPROVEMENT-018 — Rediseño de la home pública

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Reorganizar la home según mockup del usuario:

1. **Hero** con «Encuentra a tu nuevo mejor amigo», subtítulo y **buscador**: combo de especie + campo «Ciudad o código postal» + botón «Buscar» (coral) + enlace «Usar mi ubicación».
2. **Recién llegados** justo bajo el hero: tarjetas de animales (foto, nombre, ciudad/distancia, edad + raza, rasgos, botón «Adoptar» y badge «Recién llegado») + «Ver todos →».
3. **¿Cómo funciona Adoptia?**: 3 tarjetas-paso (Busca cerca de ti / Conoce a tu match / Concierta una cita) con iconos.
4. **Banda teal de estadísticas** reales: protectoras registradas, animales disponibles, adopciones completadas.
5. **CTA protectoras** a dos columnas: overline «Para refugios y protectoras», «¿Eres una protectora? Únete gratis», texto, botón coral «Registrar mi protectora» y foto.

## Contexto / impacto

La home actual dispersa la información (stats grises arriba, CTA duplicado en el hero) y no tiene buscador directo: el mockup prioriza la acción principal (buscar animal cerca) y da identidad visual. Afecta a todos los visitantes; es la puerta de entrada y primera impresión.

<!-- ============ PLANO 2: PLAN TÉCNICO ============ -->

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md` (tokens, mobile-first, estados vacíos)
- `.claude/commands/adoptia-testing.md`
- `docs/technical/DESIGN.md`

### Seguridad

- Sin superficie nueva: el buscador reutiliza `GET /api/geocode` (ya validado con Zod y rate-limited) y navega a `/animales` con params ya parseados/validados por `parseAnimalSearch`.
- Geolocalización solo bajo gesto del usuario (clic en «Usar mi ubicación»).

### Modelo de datos

- Sin cambios.

### API

- Sin cambios (reutiliza `/api/geocode` y RPC `animals_search`).

### Frontend

- **Nuevo** `src/components/home/HeroSearch.tsx` (client): select de especie (todas/perro/gato/otros), input ciudad/CP, botón Buscar primary, enlace «Usar mi ubicación» con `navigator.geolocation`. Navegación:
  - sin ciudad → `/animales?especie=X`
  - con ciudad → `fetch /api/geocode?q=` → `/animales?especie=X&lat&lng&orden=cercanos`; si no se encuentra, mensaje de error accesible inline
  - «Usar mi ubicación» → coords del navegador → misma URL con lat/lng
- **`AnimalCard`**: prop opcional `conCta` — pinta botón visual «Adoptar» (span estilizado, la tarjeta ya es Link) y badge «Recién llegado» si `published_at` < 14 días. `/animales` no cambia (prop off).
- **`src/app/(public)/page.tsx`** reordenada: hero crema con buscador → Recién llegados (RPC `p_limit: 4`, tarjetas con CTA) → Cómo funciona (3 tarjetas blancas con icono en cuadrado suave; 3er paso pasa a «Concierta una cita») → banda `bg-secondary` con las 3 stats en blanco → bloque guías (se conserva) → CTA protectora a 2 columnas con foto (Unsplash, dominio permitido) y botón primary a `/registro`.
- Textos nuevos/cambiados en `messages/es.json` (`home.*`, `busqueda.*` si hace falta).

### Tareas TDD

1. Test `HeroSearch`: sin ciudad navega a `/animales?especie=dog`; con ciudad geocodifica y navega con `lat/lng&orden=cercanos`; ciudad no encontrada muestra error; «Usar mi ubicación» usa geolocation → implementar componente.
2. Test `AnimalCard`: con `conCta` muestra «Adoptar» y badge «Recién llegado» solo si publicado hace <14 días; sin prop, nada nuevo → implementar.
3. Test home: banda de stats con números reales sobre fondo teal; secciones en orden (recién llegados tras hero, cómo funciona con paso «Concierta una cita», CTA protectora con enlace `/registro`) → implementar page.
4. Test de regresión: home sin datos (BD caída) sigue renderizando hero + cómo funciona + CTA sin stats ni recientes → ajustar.

### Dependencias

- Ninguna.

## Criterios de aceptación / Casuística a cubrir

- [ ] Hero con buscador: especie + ciudad/CP + Buscar + «Usar mi ubicación».
- [ ] Buscar sin ciudad filtra solo por especie; con ciudad geocodifica y ordena por cercanía; ciudad inexistente → error inline accesible (no navega).
- [ ] Permiso de geolocalización denegado → mensaje amable, no rompe.
- [ ] Recién llegados con tarjetas (badge «Recién llegado» <14 días, botón «Adoptar») y «Ver todos».
- [ ] Cómo funciona con los 3 pasos del mockup (el 3º: concierta una cita).
- [ ] Banda teal con protectoras/animales/adopciones reales; si la BD falla, la sección no aparece y la home no rompe.
- [ ] CTA protectora con foto, overline, título y botón a `/registro`.
- [ ] Mobile-first: buscador apilado en móvil, grid 2 col móvil / 4 desktop en tarjetas.
- [ ] Textos 100% en `messages/es.json`; imágenes con `next/image`.
- [ ] `npm run lint`, `npx tsc --noEmit` y tests en verde.

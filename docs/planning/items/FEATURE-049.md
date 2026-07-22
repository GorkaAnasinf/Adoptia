---
id: FEATURE-049
tipo: feature
titulo: Efectos del área de usuario en el panel (Reveal, carrusel de fotos, hover)
estado: hecho
prioridad: baja
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

> **Cierre (2026-07-22):** hecho en `feature/FEATURE-049-efectos-panel`. Se llevan al
> panel de la protectora los efectos visuales del área de adoptante. **Carga escalonada**
> (`Reveal`) en el dashboard: stat-cards (0/80/160 ms), bloques «Próximas citas» y
> «Solicitudes recientes», y **cada tarjeta** de «Tus animales» en progresión; y en «Mis
> animales» cada tarjeta entra escalonada. **Carrusel de fotos** (`FotoCarrusel`) en las
> tarjetas de animal de ambas vistas —flechas para pasar las fotos sin entrar a la ficha,
> carga perezosa desde `animal_media` (RLS deja al dueño leer también borradores)—. Y
> **efecto hover** (elevación + zoom de la foto) en las tarjetas. Se mantiene toda la
> gestión (estado, Borrador, Editar/Ver ficha/⋮); sin corazón de favorito ni nombre de
> protectora (no aplican en el panel). Sin cambios de datos/RLS. QA: suite 1064 verde,
> typecheck y lint limpios. **Pendiente:** despliegue. **Nota:** preferencia registrada
> de aplicar estos efectos también en los formularios que se hagan en adelante.

# FEATURE-049 — Efectos del área de usuario en el panel

## Descripción

Aplicar en el panel de la protectora los mismos efectos del área de adoptante: carga
escalonada (`Reveal`), carrusel de fotos en la tarjeta de animal (`FotoCarrusel`) y
efecto hover (elevación + zoom). Petición del usuario tras el rediseño del panel, con la
indicación de mantener estos efectos en formularios futuros.

## Contexto / impacto

Afecta a la protectora. Coherencia visual con el área de usuario. Reutiliza componentes
ya existentes y probados. Sin backend.

## Plan de desarrollo

### Frontend

- **`Reveal`** en `panel/page.tsx`: stat-cards escalonadas; bloques «Próximas citas» y
  «Solicitudes recientes»; tarjetas de «Tus animales» escalonadas por índice.
- **`AnimalesGrid`**: cada tarjeta envuelta en `Reveal` (escalonado por índice).
- **`FotoCarrusel`** (con placeholder si no hay portada) en la tarjeta de animal de
  ambas vistas; efecto hover `motion-safe:hover:-translate-y-1` + `hover:shadow-md`
  (+ zoom de la foto que aporta el propio carrusel).

### Seguridad / Modelo

- **Sin cambios.** `FotoCarrusel` lee `animal_media` con la sesión; RLS
  `animal_media_public_read` permite al dueño leer las fotos de sus animales (incl.
  borradores).

### Tareas TDD

1. `AnimalesGrid.test.tsx`: caso con portada monta el carrusel (flechas presentes).
2. Suite del panel + `tsc` + lint + suite completa verdes.

## Criterios de aceptación / Casuística a cubrir

- [x] Carga escalonada en dashboard (stat-cards, bloques, tarjetas) y en «Mis animales».
- [x] Carrusel de fotos en las tarjetas de animal de ambas vistas (placeholder si no hay).
- [x] Efecto hover (elevación + zoom) en las tarjetas de animal.
- [x] Se mantiene la gestión; sin favorito ni nombre de protectora. Sin cambios de datos/RLS.

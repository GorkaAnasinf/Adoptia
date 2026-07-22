# Efectos del área de usuario en el panel de la protectora — Diseño

**Fecha:** 2026-07-22
**Ficheros:** `src/app/(shelter)/panel/page.tsx` (dashboard), `src/components/panel/AnimalesGrid.tsx`.
**Reutiliza:** `Reveal` (`src/components/ui/Reveal.tsx`), `FotoCarrusel` (`src/components/animals/FotoCarrusel.tsx`).

## Objetivo

Llevar al panel de la protectora los mismos efectos visuales del área de adoptante:
carga escalonada (`Reveal`), carrusel de fotos en la tarjeta de animal y efecto hover
(elevación + zoom). Coherencia visual entre ambas áreas. Sin cambios de datos/RLS.

## Alcance (aprobado)

`Reveal` en **todo el dashboard + rejillas**:
- Dashboard: 3 stat-cards escalonadas (0/80/160 ms, como en mi-cuenta); bloques
  "Próximas citas" y "Solicitudes recientes" con `Reveal`.
- Tarjetas de animal (dashboard "Tus animales" y "Mis animales"): **cada tarjeta** en
  progresión (`Reveal` con `delayMs` creciente y tope).

## Cambios

### Tarjeta de animal (dashboard "Tus animales" + `AnimalesGrid`)

Mantiene toda su gestión (badge de estado `onImage`, chip "Borrador", nombre + sexo +
`raza·edad`, Editar / Ver ficha / menú ⋮). Añade:
- **Foto → `FotoCarrusel`** cuando hay portada válida: `<FotoCarrusel animalId={a.id}
  coverUrl={foto} alt="" sizes="…" />`. Sin portada → placeholder `PawPrint` actual.
  Las flechas hacen `preventDefault`/`stopPropagation`, así que funcionan aunque la
  tarjeta (dashboard) sea un `<Link>`.
- **Hover**: la tarjeta gana `group` + `transition motion-safe:hover:-translate-y-1
  hover:shadow-md`; el zoom de la foto ya lo aporta `FotoCarrusel`
  (`group-hover:scale-105`).
- **`alt=""`**: la foto es decorativa (el nombre va al lado como texto), coherente con
  la decisión previa del dashboard.

> RLS: `animal_media_public_read` permite al **dueño** leer las fotos de sus animales
> (incluidos borradores), así que el carrusel funciona en el panel para cualquier estado.

### Dashboard — `page.tsx`

- Importa `Reveal`. Envuelve cada stat-card en `<Reveal delayMs={0|80|160}>`.
- Envuelve el bloque "Próximas citas" y el bloque "Solicitudes recientes" cada uno en
  `<Reveal>`.
- El bloque "Tus animales": **no** se envuelve como unidad; se escalona **por tarjeta**
  (`<Reveal delayMs={Math.min(i,8)*60}>` alrededor de cada `<li>` de animal). La tarjeta
  "Añadir" puede ir sin `Reveal` o con el último delay.

### `AnimalesGrid.tsx`

- Importa `Reveal` y `FotoCarrusel`.
- Cada tarjeta de animal envuelta en `<Reveal delayMs={Math.min(i,8)*60}>` (índice sobre
  `filtrados`). La tarjeta "Nueva mascota" sin `Reveal` (o con delay final).
- Foto de la tarjeta → `FotoCarrusel` (con placeholder si no hay portada) + hover.

> Nota re-animación al filtrar: `Reveal` solo anima al entrar en viewport la primera
> vez; las tarjetas que permanecen (misma `key={a.id}`) no re-animan. Las que reaparecen
> tras un filtro pueden re-animar sutilmente; es aceptable.

## i18n

- Ninguna clave nueva: `FotoCarrusel` usa `busqueda.fotoAnterior/fotoSiguiente` (ya
  existen). `Reveal` no tiene texto.

## Tests

- `AnimalesGrid.test.tsx`: sigue verde. Los animales de test tienen `animal_media: []`
  → placeholder (no se monta `FotoCarrusel`, no hace falta mockear supabase). Añadir un
  caso con portada que compruebe que se renderiza la imagen del carrusel (sin pulsar
  flechas, para no tocar red). `Reveal` no rompe queries (el contenido está siempre en el
  DOM).
- `panel/page.test.tsx`: sigue verde; `Reveal` es transparente al render (envuelve, no
  oculta del DOM). Verificar que las tarjetas y textos siguen encontrándose.

## Fuera de alcance

- Corazón de favorito / nombre de protectora en el panel (no aplican).
- Cambios en el área de adoptante (ya tiene los efectos).
- Cambios de datos, RLS o esquema.

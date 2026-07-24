---
id: IMPROVEMENT-033
tipo: improvement
titulo: Pulido de la cara pública — cabecera, pie y páginas de contenido
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-24
actualizado: 2026-07-24
---

# IMPROVEMENT-033 — Pulido de la cara pública

## Descripción

Lote de correcciones visuales detectadas en pruebas reales sobre la cara pública:

1. El logo de la cabecera debe llevar **siempre a la home pública** (`/`), también
   dentro del panel de la protectora (antes iba al inicio del rol).
2. Menos hueco muerto en la home entre la sección hero y «Recién llegados».
3. Pie de página rediseñado (estaba mal encajado y soso).
4. Mover **Casas de acogida** y **Necesidades** del pie al **menú principal**.
5. Mejorar las páginas de **Guías** y **legales** (Privacidad, Cookies, Aviso
   legal, Términos), demasiado sosas, y unificar su ancho al del panel de la
   protectora (`max-w-6xl`).

## Contexto / impacto

Puro frontend + i18n; sin BD/RLS/migraciones. Tanda de UI (una rama, suite al
final).

## Cierre (2026-07-24)

- **Logo → home**: `Marca` de `AppShell` y logo móvil de `AppHeader` enlazan a
  `/` (se retira `inicioDeRol` de ambos). La cabecera pública ya iba a `/`.
- **Menú principal**: `PublicNav` suma `Acogida` (`/acogida`) y `Necesidades`
  (`/necesidades`); nuevas claves `nav.acogida` / `nav.necesidades`. Se ajusta el
  `gap` del nav desktop para los 6 enlaces. El drawer móvil los hereda.
- **Pie rediseñado**: `Footer` a `max-w-6xl` con columna de marca (logo + tagline),
  columnas **Explorar** (Animales, Protectoras, Mapa, Perdidos, Guías) y **Legal**
  (Privacidad, Aviso legal, Cookies, Términos) y barra inferior con copyright +
  lema. **Casas de acogida** y **Necesidades** salen del pie (van al menú). Nuevas
  claves `footer.exploreTitle` / `footer.legalTitle` / `footer.copyright`.
- **Home**: se reduce `min-h` y el padding inferior del hero para pegar «Recién
  llegados».
- **Guías y legales**: contenedor `max-w-6xl` (ancho del panel) con columna de
  texto legible dentro. Cabeceras con acento de marca; el índice de guías estrena
  cards con hover; el artículo de guía lleva **TOC lateral pegajoso** en desktop;
  `LegalArticle` con cabecera de tarjeta y secciones con borde de acento.
- Tests actualizados (logo→`/`, nav con nuevos enlaces, pie sin acogida/necesidades).
  Suite verde salvo un fallo **preexistente** ajeno (`panel/agenda/page.test.tsx`,
  ya roto en `main`).

## Criterios de aceptación

- Logo (público y panel) → `/`. Acogida y Necesidades en el menú, no en el pie.
  Pie e páginas de contenido rediseñados al ancho del panel. Lint y suite (salvo
  el fallo preexistente de agenda) verdes.

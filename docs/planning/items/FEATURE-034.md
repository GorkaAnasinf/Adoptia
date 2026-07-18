---
id: FEATURE-034
tipo: feature
titulo: Rediseño de la home según wireframe Stitch (tanda de rediseño, pantalla 1)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-18
actualizado: 2026-07-18
---

# FEATURE-034 — Rediseño de la home según wireframe Stitch

## Descripción

El usuario inicia una **tanda de rediseño pantalla a pantalla** de toda la web con wireframes generados en Stitch. Esta es la primera: la home. Los artefactos viven en `assets/wireframes/inicio/` (`code.html` con Tailwind, `DESIGN.md` con tokens, `screen.png` de referencia). Hay que replicar el diseño **lo más fiel posible**.

La home actual ya comparte paleta (terracota/teal/crema) y secciones con el wireframe — el trabajo es afinado visual, no reconstrucción:

- **Hero**: añadir foto de fondo lifestyle (opacidad ~20 %, degradado inferior hacia el crema), alto ~716 px, titular `headline-xl` centrado.
- **Buscador del hero**: barra blanca `rounded-xl` con icono huella (especie) e icono ubicación (ciudad), iconos en terracota, botón Buscar `rounded-lg`; enlace «Usar mi ubicación» en terracota.
- **Recién llegados**: chip «RECIÉN LLEGADO» arriba-izquierda sobre la foto (`primary-container` + texto `on-primary-container`), tarjeta sobre `surface-container-low` (#f9f3eb), hover con elevación (-translate-y-1), «Ver todos» con chevron.
- **¿Cómo funciona?**: sección con fondo tintado (`surface-container-low/30`), tarjetas blancas con sombra suave, icono terracota en círculo `bg-primary/10` los tres (hoy cada paso lleva un color distinto).
- **Banda de números**: ya coincide (teal, 3 columnas con divisores).
- **Guías**: ya coincide en estructura; botón outline `rounded-lg`.
- **CTA protectoras**: contenedor `surface-container-low` con borde sutil, titular `headline-xl`, foto del wireframe.
- **Header** (compartido): glassmorphism (`bg-background/80 backdrop-blur`), logo solo texto terracota, enlace activo con subrayado terracota, botón «Registrarse» relleno terracota.
- **Footer** (compartido): tres bloques — logo + tagline, enlaces, copyright — sobre `surface-container`.

## Contexto / impacto

La home es el escaparate del producto. El wireframe fija además el lenguaje visual (DESIGN.md de Stitch coincide con `docs/technical/DESIGN.md`: mismos hex, Montserrat + Open Sans) que se irá aplicando al resto de pantallas de la tanda, así que lo que se decida aquí (header, footer, tarjeta de animal) arrastra al resto.

## Plan de desarrollo

### Alcance

- **Dentro**: solo presentación — mismos datos, mismos RPC, misma navegación y lógica de búsqueda.
- **UX (petición del usuario en la aprobación)**: aplicar mejoras de experiencia donde se detecten, sin salirse del lenguaje visual del wireframe.
- **A11y (requisito duro, petición del usuario)**: el público incluye muchas personas con discapacidad — todo adaptado: labels/roles/aria correctos, foco visible, navegación por teclado completa, contraste AA, `alt` descriptivos, touch targets ≥44 px, `prefers-reduced-motion` respetado en animaciones.
- **Fidelidad con cabeza** (el wireframe es un mock con contenido de relleno):
  - El header conserva `UserMenu` por rol, `PublicNav` con sus enlaces reales y breadcrumbs — se restyla, no se recorta.
  - El footer conserva los 7 enlaces actuales (legales incluidos — no se pierden aviso legal/cookies por fidelidad al mock) + añade logo y tagline **en español** vía `messages/es.json` (el mock lo trae en inglés).
  - El select de especies mantiene las opciones reales (dog/cat/other), no las del mock (Aves/Exóticos no existen).
  - Los contadores siguen siendo reales de BD.
- **Imágenes**: descargar la foto del hero y la del CTA protectoras desde las URLs del `code.html` de Stitch a `public/images/` (comprimidas ≤300 KB), servidas con `next/image`. Si las URLs de Stitch caducaran, sustituir por equivalentes de Unsplash (mismo brief: persona abrazando perro en salón cálido / perro negro con juguete de cuerda).
- **Cadencia de la tanda** (memoria `tandas-de-ui-suite-al-final`): rama única `feature/FEATURE-034-rediseno-home` para toda la tanda, un commit por pantalla/item, tests de componentes tocados durante el desarrollo y **suite completa + QA de Scooby una sola vez al final de la tanda**. TDD por componente no se salta.

### Documentación a consultar

- `assets/wireframes/inicio/{code.html,DESIGN.md,screen.png}` (fuente de verdad visual).
- [DESIGN](../../technical/DESIGN.md) (tokens actuales — coinciden con los de Stitch), skills `adoptia-frontend` y `adoptia-testing`.

### Seguridad

- Sin superficie nueva: sin cambios de datos, auth ni endpoints. Solo presentación.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios.

### Frontend

- `src/app/(public)/page.tsx`: hero con foto de fondo + degradado, ajustes de secciones (cómo funciona, guías, CTA protectoras).
- `src/components/home/HeroSearch.tsx`: restyle de la barra (iconos huella/ubicación en terracota, radios del wireframe). Lógica intacta.
- `src/components/animals/AnimalCard.tsx`: chip «Recién llegado» arriba-izquierda con colores `primary-container`/`on-primary-container`, fondo `surface-container-low`, hover con elevación. Afecta también a /animales (asumido: la tarjeta es una en todo el producto).
- `src/components/layout/Header.tsx` + `PublicNav`: glassmorphism, logo texto, subrayado activo. `UserMenu` intacto.
- `src/components/layout/Footer.tsx`: tres bloques, tagline nueva en `messages/es.json`.
- `src/app/globals.css`: añadir tokens que falten (`surface-container-low`, `surface-container`, sombra suave terracota) como variables, no hex sueltos.
- Assets nuevos: `public/images/hero-home.jpg`, `public/images/cta-protectoras.jpg`.

### Tareas TDD

1. Tokens: variables `--surface-container-low`/`--surface-container` + utilidad de sombra suave en `globals.css` (sin test — CSS puro; BUG-005 impide parsearlo en Vitest).
2. `Footer.test.tsx`: tagline y logo visibles, los 7 enlaces siguen presentes → restyle del footer.
3. Test de `Header`/`PublicNav`: enlaces reales + estado activo subrayado → restyle glassmorphism.
4. `HeroSearch.test.tsx`: lógica intacta (especie+ciudad→/animales con params, geolocalización, error de ciudad) tras el restyle.
5. `AnimalCard.test.tsx`: chip «Recién llegado» presente con animal reciente y ausente con antiguo (posición/colores nuevos), resto de contenido intacto.
6. `pages.test.tsx` (home): secciones y textos siguen renderizando; imagen de hero presente con alt.
7. Revisión visual contra `screen.png` (npm run dev) y ajuste fino de espaciados/radios.

### Dependencias

- Ninguna (FEATURE-021 header ya `hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Hero con foto de fondo tenue (opacidad 20 % + degradado al crema); texto legible (contraste AA se mantiene).
- [x] Buscador: mismas búsquedas que hoy (especie, ciudad geocodificada, «Usar mi ubicación», error de ciudad no encontrada) con el estilo nuevo — 7 tests verdes.
- [x] Recién llegados: chip nuevo solo en animales <14 días (arriba-izquierda, `primary-container`/`on-primary-container`); sin foto cae al placeholder (no reintroduce BUG-006); grid 1/2/4 columnas.
- [x] Home sin conexión a BD sigue renderizando (estadísticas y recientes ocultos, sin crash) — test verde.
- [x] Header: navegación y menú de usuario por rol funcionan igual; enlace activo subrayado terracota.
- [x] Footer: los 7 enlaces actuales presentes; tagline en español desde `messages/es.json` — test nuevo.
- [x] Cero literales de UI hardcodeados; claves nuevas: `footer.tagline`, `footer.navLabel`, `home.searchCityLabel`, `home.ctaSheltersImageAlt`.
- [x] Imágenes vía `next/image`, locales (`public/images/hero-home.jpg` 146 KB, `cta-protectoras.jpg` 134 KB).
- [x] Responsive fiel verificado con capturas: móvil (buscador apilado, tarjetas 2 col) y desktop (max-w 1200px).
- [x] Tests de componentes tocados verdes (54/54); lint y `tsc --noEmit` limpios. **Suite completa + QA de Scooby: pendiente al cierre de la tanda** (decisión del usuario, memoria aplicada).
- [x] A11y: labels accesibles en los dos campos del buscador (nuevo test), foco visible en enlaces/botones nuevos, imagen del hero decorativa (`alt=""` + `aria-hidden`), alt real en la foto del CTA, hover con elevación solo con `motion-safe`, targets ≥44 px.

## Cierre (2026-07-18)

- Home replicando el wireframe Stitch de `assets/wireframes/inicio`: hero con foto ambiente local y degradado, buscador restylado (iconos huella/ubicación terracota), chip «Recién llegado» sobre la foto, «Cómo funciona» sobre fondo tintado con iconos unificados, guías y CTA de protectoras sobre superficies tonales, header glassmorphism con activo subrayado, footer de tres bloques con tagline.
- Tokens nuevos en `globals.css` (`surface-container-*`, `on-primary-container`, `shadow-soft`); imágenes del wireframe descargadas a `public/images/` (146/134 KB).
- Fidelidad con cabeza: se conservaron los 7 enlaces del footer, el UserMenu por rol, los breadcrumbs y las especies reales del select (el mock traía contenido de relleno).
- A11y reforzada a petición del usuario: labels en ambos campos del buscador (test nuevo), `alt=""` en el fondo decorativo, `motion-safe` en las elevaciones.
- QA (cadencia nueva: circuito completo por pantalla): suite **1101/1101 con RLS**, cobertura 82,44 % / 96,64 % `src/lib`, lint y tsc limpios, E2E área pública 4/4. Capturas desktop/móvil comparadas contra `screen.png`.
- Cambio de cadencia de la tanda (decisión del usuario en este cierre): cada pantalla cierra circuito completo y se libera a `main`/producción antes de la siguiente.

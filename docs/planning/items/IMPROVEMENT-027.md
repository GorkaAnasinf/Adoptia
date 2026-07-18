---
id: IMPROVEMENT-027
tipo: improvement
titulo: Vida y micro-interacciones en la web (cursor, count-up, reveal, header compacto, huellas)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-18
actualizado: 2026-07-18
---

# IMPROVEMENT-027 — Vida y micro-interacciones en la web

## Descripción

Tras liberar el rediseño de la home (FEATURE-034), el usuario pide darle un «toque personal importante» y detectó un bug: en varios botones el ratón no muestra la mano (p. ej. «Buscar» del hero). Alcance acordado con el usuario:

1. **Bug cursor pointer** (global): Tailwind v4 eliminó `cursor: pointer` de los botones en su preflight — afecta a todos los `<button>` de la web. Arreglo global en `globals.css`.
2. **Count-up en la banda de números**: los contadores reales (protectoras/animales/adopciones) animan de 0 al valor al entrar en viewport.
3. **Reveal al scroll**: secciones y tarjetas aparecen con fade + subida sutil (~16 px) al entrar en pantalla. Componente reutilizable para toda la web.
4. **Header que se compacta al scroll**: reduce altura y gana sombra (venía en el JS del wireframe Stitch y no se replicó).
5. **`active:scale-95` en botones**: feedback táctil al pulsar (también del wireframe).
6. **Huellas separador** (toque de marca): SVG de huellas muy tenues (terracota ~8 %) cruzando entre secciones de la home; reutilizable en estados vacíos.
7. **Parallax suave del hero** (opcional, lo último): fondo a ~50 % de la velocidad del scroll, solo desktop.
8. **Sección «Historias felices» con datos de demostración** (petición del usuario 2026-07-18): para ver la home «al 100 %», se añade la sección con 3 historias inventadas (foto local + nombre + frase). Los textos van en `messages/es.json` y la sección queda marcada en código como demo — **FEATURE-035 la sustituirá por datos reales** (anotado allí).

## Contexto / impacto

La home rediseñada es fiel al wireframe pero estática. Estas micro-interacciones son el acabado que diferencia un «está bien» de un «está vivo», y el bug del cursor daña la percepción de que los botones son pulsables. Todo el movimiento queda tras `prefers-reduced-motion` (A11y: requisito duro del usuario — público con discapacidad).

## Plan de desarrollo

### Alcance

- **Dentro**: los 7 puntos de la descripción; efectos como componentes reutilizables (`src/components/ui/`) para aplicarlos al resto de pantallas de la tanda.
- **Fuera**: View Transitions entre páginas (experimental), vídeo en hero, sección «Historias felices» (capturada aparte en FEATURE-035).
- **A11y (transversal)**: `prefers-reduced-motion: reduce` desactiva count-up (muestra el valor final), reveal (contenido visible sin animación), parallax y scale. Los lectores de pantalla siempre reciben el valor/contenido final. Huellas con `aria-hidden`.

### Documentación a consultar

- [DESIGN](../../technical/DESIGN.md), skills `adoptia-frontend` y `adoptia-testing`. Item FEATURE-034 (contexto de la tanda).

### Seguridad

- Sin superficie nueva: presentación y JS de cliente sin datos.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios.

### Frontend

- `globals.css`: `@layer base` con `button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer }`.
- `src/components/ui/CountUp.tsx` (client): IntersectionObserver + rAF, ease-out ~1,2 s; con `reduced-motion` o sin IO pinta el valor final. `aria-label` con el valor final.
- `src/components/ui/Reveal.tsx` (client): wrapper con IO que añade clase de animación CSS (fade + translate-y); umbral bajo para móvil; una sola vez (no re-anima al re-entrar).
- `src/components/layout/HeaderScrollEffect` o equivalente (client, pequeño): a >20 px de scroll compacta el header (padding menor + sombra). El Header sigue siendo Server Component; el efecto va en un hijo client que togglea un atributo/clase.
- `src/components/ui/PawTrail.tsx`: SVG inline de huellas (sin request extra), `aria-hidden`, color `primary` con opacidad baja; usado como separador en la home.
- Botones: clase compartida o edición puntual con `active:scale-95 motion-safe:transition-transform` en los botones principales (hero, header, CTAs, tarjetas).
- Parallax hero (si da tiempo dentro del item): `transform: translateY` en scroll vía el mismo hook del header, `motion-safe` + solo `lg:`.
- Home (`page.tsx`): integrar CountUp en la banda de números, Reveal en secciones, PawTrail entre «Recién llegados» y «Cómo funciona» (y donde pida el ojo).
- Sección «Historias felices» (demo): 3 tarjetas con foto local (`public/images/story-*.jpg`, ≤300 KB), nombre, frase del adoptante ficticio y tiempo en su hogar; textos bajo `home.stories*` en `es.json`; comentario en código apuntando a FEATURE-035.

### Tareas TDD

1. `CountUp.test.tsx` (rojo primero): con `prefers-reduced-motion` muestra el valor final sin animar; sin él, tras la intersección acaba mostrando el valor final; `aria-label` correcto. Mock de `IntersectionObserver` y `matchMedia`.
2. `Reveal.test.tsx`: contenido presente en el DOM desde el primer render (SEO/SR); clase de animación solo tras intersección; con `reduced-motion` no hay clase de animación.
3. Test del efecto de scroll del header: a scroll 0 sin clase compacta; tras scroll >20 px la añade (evento scroll simulado).
4. `PawTrail.test.tsx`: renderiza con `aria-hidden="true"` y no aporta texto accesible.
5. Home: los contadores siguen accesibles con los valores reales (test existente de `home-stats` sigue verde con CountUp integrado).
6. Test de la sección «Historias felices»: renderiza las 3 historias desde `messages/es.json` con sus fotos (alt correcto) y el título de sección.
7. Cursor: sin test (CSS puro, BUG-005); verificación manual en la revisión visual.
8. Revisión visual completa (dev + capturas) incluida simulación de `prefers-reduced-motion`.

### Dependencias

- FEATURE-034 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Todos los `<button>` habilitados de la web muestran cursor mano (verificado con computed style en navegador real: `pointer`).
- [x] Banda de números: anima de 0 al valor real al entrar en viewport, una sola vez; con `reduced-motion` o sin `matchMedia` pinta el valor directo — 3 tests.
- [x] Reveal: contenido en el DOM desde el primer render; anima solo la primera vez; `reduced-motion` lo desactiva — 3 tests.
- [x] Header se compacta con scroll (`data-scrolled`, h-16→h-13 + sombra) y revierte arriba — test + captura.
- [x] Botones principales con `motion-safe:active:scale-95`.
- [x] Huellas `PawTrail`: `aria-hidden`, SVG inline, opacidad 10 % — test + captura.
- [x] Parallax del hero: solo desktop (`min-width: 1024px`) y `motion-safe`, con `transform` + rAF — 2 tests.
- [x] «Historias felices» con 3 historias demo (textos `home.stories*`, fotos locales 42-58 KB con alt, chip «Ya en casa» salvia); comentario en código apunta a FEATURE-035 — test.
- [x] Cero literales fuera de `messages/es.json` (20 claves nuevas `home.stories*`).
- [x] QA: suite **1112/1112 con RLS**, cobertura 82,5 % global, E2E área pública 4/4, lint y tsc limpios. Capturas: normal, header con scroll y `prefers-reduced-motion`.

## Cierre (2026-07-18)

- Componentes nuevos reutilizables en `src/components/ui/`: `CountUp`, `Reveal`, `Parallax`, `PawTrail` + `HeaderScrollEffect` en layout. Todos defensivos: sin `matchMedia`/`IntersectionObserver` (o con `prefers-reduced-motion`) muestran el estado final sin animar.
- Bug del cursor: causa raíz confirmada (preflight de Tailwind v4 sin `cursor:pointer` en botones); restaurado globalmente en `globals.css`.
- Historias felices demo integrada tras la banda de números; fotos de Luna y Simba se sustituyeron en revisión visual por tomas cálidas acordes a la paleta (las primeras chocaban: fondos amarillo/azul saturados).
- Lección de test: `getByRole(..., { name: undefined })` no filtra — el test de labels se endureció con `toHaveProperty` (patrón repetido de FEATURE-034).
- Trampa de verificación: el optimizador de imágenes de Next cachea por nombre de fichero — al reemplazar un asset con el mismo nombre hay que vaciar `.next/cache/images` para ver el cambio en dev.

### Remate (2026-07-18, feedback del usuario tras la liberación)

- El usuario percibió que el count-up «corría al cargar la página». Diagnóstico con muestreo en navegador real: la animación sí arrancaba al intersectar, pero **antes de intersectar el contador mostraba el valor final** (estado SSR), así que al asomar la banda se veía «31» estático un instante. Arreglo: en cliente, si va a haber animación, el contador baja a 0 nada más montar y anima al entrar (umbral 0,2). Test nuevo que lo fija.
- De paso se corrigió un bug de base de tiempos: `inicio` salía de `performance.now()` pero los frames usan el timestamp del rAF — ahora el inicio se toma del primer frame (t además acotado a [0,1]). Suite 1113/1113 con RLS.
- **Segundo remate (auditoría de prod a petición del usuario, zoom 50 %):** todos los detalles verificados funcionando en producción con navegador real (hero, cursor, count-up, header, parallax, historias, huellas). Dos ajustes de visibilidad: huellas de opacidad 10 %→20 % y h-10→h-12 (eran casi invisibles), y count-up a 2 s con pausa inicial de 350 ms — con zoom 50 % la banda es visible al cargar y la animación de 1,2 s se perdía entre el pintado de la página. Nota: el count-up es de un solo disparo; si el zoom se cambia después de cargar, la animación ya corrió.

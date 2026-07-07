---
id: IMPROVEMENT-003
tipo: improvement
titulo: Pulido del shell chrome (sidebar + cabecera) hacia el mockup de Stitch
estado: desarrollo
prioridad: media
hito: "0.2"
duplicado_de: null
creado: 2026-07-07
actualizado: 2026-07-07
---

# IMPROVEMENT-003 — Pulido del shell chrome (sidebar + cabecera)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

El app shell de [[FEATURE-018]] es funcional pero visualmente pobre frente al mockup de
Stitch (dashboard de protectora, `prompts-stitch.md` §2.2). Se pule **solo el chrome**
(sidebar + cabecera), sin tocar el contenido de las páginas (eso es [[FEATURE-004]] y
siguientes). Gaps a cerrar:

1. **Badges de conteo** en ítems de nav (p. ej. "Solicitudes · 4").
2. **Botón "Contactar soporte"**: pasar de outline gris deshabilitado a **botón teal
   sólido activo**.
3. **Ítem activo**: refinar a un **pill de tono salvia/menta** claro (hoy `bg-secondary/15`).
4. **Contraste del panel** sidebar vs fondo crema (que lea como panel diferenciado).
5. **Iconos de cabecera** (ayuda/campana) hoy `opacity-50` muertos → **campana con punto
   de notificación** (indicador).
6. **Avatar** con **foto** cuando exista (Google OAuth), con iniciales como fallback.

## Contexto / impacto

Es la primera pantalla que ve una protectora ya dentro de la plataforma. Un chrome cuidado
transmite confianza y da coherencia a todas las pantallas del panel (todas cuelgan del
shell). Al ser transversal, mejora la percepción de TODO el panel de un solo cambio.

## Referencia de diseño

- **Mockup:** `docs/technical/prompts-stitch.md` §2.2 (Dashboard) + pantallazo del dashboard.
- **Tokens:** `docs/technical/DESIGN.md` / `src/app/globals.css` (terracota `--primary`,
  teal `--secondary`, salvia `--tertiary`, crema `--background`, card blanco).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Frontera de alcance (importante)

Chrome-only. **NO** se cablean datos reales de conteo ni el dashboard:

- Los **badges** y el **punto de campana** son **prop-driven** y presentacionales. El
  número "4" del mockup es ilustrativo; la tabla `adoption_requests` es de [[FEATURE-007]]
  y no existe aún. Se construye el mecanismo; su alimentación con datos reales queda
  **diferida a [[FEATURE-007]] / [[FEATURE-004]]**. Por defecto `undefined`/`false` → no se
  renderiza badge ni punto (sin datos falsos en producción).
- El **avatar** SÍ se cablea ahora: `user_metadata.avatar_url` ya llega vía Google OAuth.
- **Soporte**: sin feature de tickets aún → el botón abre `mailto:` al correo de soporte
  (acción real, no `disabled`).

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md` (tokens, shadcn, i18n, next/image).
- `docs/technical/DESIGN.md` (paleta, radios, tipografía).
- `docs/technical/prompts-stitch.md` §2.2.
- Componentes actuales: `src/components/layout/{AppShell,AppSidebar,AppHeader,UserMenu,StatusBadge}.tsx`.

### Seguridad

- Sin superficie nueva. `mailto:` es estático. El avatar se sirve con `next/image`; el host
  de avatares de Google (`lh3.googleusercontent.com`) debe estar permitido en
  `next.config.ts` (`images.remotePatterns`) y en la CSP `img-src` — **verificar y añadir
  si falta** (si no, fallback a iniciales). Sin secretos, sin RLS afectada.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios.

### Frontend

Componentes a tocar (chrome-only, ~6 ficheros):

- **`AppSidebar`**
  - Ítem de nav: soporta prop opcional `badge?: number` → **pill** a la derecha
    (`ml-auto`, `rounded-full`, tono terracota suave, tabular-nums), oculto si
    `undefined`/`0`. Estructura de `NAV` extendida para admitir badge por clave (valor
    desde props, no hardcode).
  - **Ítem activo**: pill salvia/menta claro — `bg-tertiary/12 text-tertiary font-semibold`
    (ajuste fino contra el mockup), hover no-activo `hover:bg-accent`.
  - **Botón "Contactar soporte"**: `<a href="mailto:...">` estilo **teal sólido**
    (`bg-secondary text-secondary-foreground`), full-width, icono LifeBuoy. Correo de
    soporte desde `NEXT_PUBLIC_SUPPORT_EMAIL` con fallback literal.
- **`AppShell`**
  - Panel sidebar con **más contraste**: mantener `bg-card` + `border-r`, añadir sombra
    sutil (`shadow-sm`) y separación del contenido. Marca sin cambios funcionales.
  - Pasar props de conteo (hoy `undefined`) a `AppSidebar`/`AppHeader` para dejar el cable
    listo.
- **`AppHeader`**
  - **Campana**: envolver en contenedor `relative`; punto de notificación
    (`absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-background`)
    visible solo con prop `hasNotifications` (default `false`). Quitar el `opacity-50`
    mortecino: icono con color legible (`text-muted-foreground hover:text-primary`),
    manteniendo `title=comingSoon` mientras no haya feature.
  - **Ayuda**: mismo tratamiento de color (dejar de verse "muerto").
- **`UserMenu`**
  - Si `user.user_metadata.avatar_url` → `next/image` redondo (`size-9`, `rounded-full`);
    si no, iniciales actuales. `alt` i18n. Fallback a iniciales si la imagen falla.
- **`messages/es.json`** (`shell`): nuevas claves — `userAvatar` (alt), `notificationsNew`
  (aria del punto). Reusar `support` para el botón.

Responsive: sin regresiones — drawer móvil sigue igual; badges/pill/avatar caben en 64/72.

### Tareas TDD

<!-- Bolt: todas completadas (TDD rojo→verde). -->

1. **`AppSidebar` — badge**: test "renderiza pill con el número cuando `badge>0` y lo oculta
   cuando `undefined`/`0`" → implementar prop + pill.
2. **`AppSidebar` — ítem activo y botón soporte**: test "el ítem activo lleva clases de pill
   salvia" + "soporte es un enlace `mailto:` (no `disabled`)" → implementar.
3. **`AppHeader` — punto de campana**: test "muestra el punto solo con `hasNotifications`;
   oculto por defecto" → implementar indicador.
4. **`UserMenu` — avatar**: test "con `avatar_url` renderiza `<img>` con alt i18n; sin él,
   iniciales" → implementar con next/image + fallback.
5. **`AppShell`**: test "pasa props de conteo/notificaciones a sidebar y header" +
   snapshot/clase de contraste del panel → implementar cableado (valores `undefined`/`false`).
6. **i18n + config**: añadir claves a `es.json`; verificar/añadir host de avatar en
   `next.config.ts` (remotePatterns + CSP). Verificación manual (`verify`) del panel de
   protectora: sidebar, cabecera, avatar real, botón soporte, hover/activo.

### Dependencias

- **[[FEATURE-018]]** (`hecho`) — aporta el shell base.
- Alimentación real de badges/campana: **[[FEATURE-007]]** (solicitudes) y
  **[[FEATURE-004]]** (dashboard) — no bloquean este item; solo consumirán el mecanismo.

## Criterios de aceptación / Casuística a cubrir

- [ ] Ítem de nav muestra badge (pill) cuando recibe `badge>0`; sin badge si `undefined`/`0`.
- [ ] "Contactar soporte" es un enlace `mailto:` con estilo teal sólido; foco/hover
      accesibles (AA), target ≥44px.
- [ ] Ítem activo se distingue con pill salvia/menta; hover de no-activos correcto.
- [ ] Panel sidebar lee como superficie diferenciada del fondo crema (contraste + borde/sombra).
- [ ] Campana muestra punto de notificación **solo** con `hasNotifications`; oculto por
      defecto (sin datos falsos). Iconos de cabecera legibles (no "apagados").
- [ ] Avatar: foto redonda con `avatar_url`; iniciales como fallback (incl. si la imagen falla).
- [ ] Sin textos hardcodeados (next-intl); coherente con tokens de `DESIGN.md`.
- [ ] Responsive: sin regresiones en drawer móvil ni en la cabecera a <640px.
- [ ] No se cablean datos reales de conteo/dashboard (fuera de alcance); el mecanismo queda
      listo para [[FEATURE-007]]/[[FEATURE-004]].

---
id: FEATURE-021
tipo: feature
titulo: Rediseño de la cabecera superior con menú de usuario por rol
estado: desarrollo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-14
actualizado: 2026-07-14
---

# FEATURE-021 — Rediseño de la cabecera superior con menú de usuario por rol

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Hoy la cabecera superior de usuario logueado solo ofrece **"Mi cuenta"** y
**"Cerrar sesión"** en el menú del avatar. Una **protectora** no tiene ningún
acceso visible al **panel de protectora** desde la cabecera: no queda claro
cómo llega a su panel de gestión.

Se quiere **rediseñar la barra superior** manteniendo el estilo actual (una
sola barra horizontal: logo + enlaces de navegación + buscador + CTA pill +
favoritos + avatar) y adaptar sus contenidos **según el rol** del usuario:

- **Usuario normal (adoptante):** enlaces de navegación y menú del avatar
  orientados a explorar/adoptar (Mi cuenta, Mis favoritos, Mis solicitudes,
  Mis citas, Cerrar sesión). Sin acceso a panel de protectora.
- **Protectora:** enlaces de navegación en modo gestión y, en el menú del
  avatar, una **nueva opción destacada "Panel de protectora"** que lleve al
  panel de gestión, además del nombre de la protectora y un chip de estado
  (Verificada / Pendiente) en la barra.

Incluir además una **fila de breadcrumbs** bajo la barra.

Existe un prompt de Stitch (`stitch-prompt.txt`, temporal) que describe ambas
variantes con el design system "Warm Earth & Tail" — usarlo como referencia
visual al planificar el frontend.

## Contexto / impacto

- **A quién afecta:** protectoras (no encuentran su panel) y adoptantes
  (navegación poco clara). Es un problema de descubribilidad detectado en uso
  real, no un bug funcional: el panel existe pero no hay acceso directo.
- **Qué pasa si no se hace:** las protectoras tienen que conocer/recordar la
  URL del panel a mano; mala experiencia de onboarding y de gestión diaria.
- **Componentes actuales implicados:** `src/components/layout/Header.tsx`,
  `AppHeader.tsx`, `UserMenu.tsx` y los textos en `messages/es.json`.
- **Clave técnica pendiente de diseño:** detectar si el usuario gestiona una
  protectora (consulta a la tabla de protectoras/miembros con RLS) para
  renderizar el menú y los enlaces condicionalmente.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

### Hallazgos de arquitectura (contexto real)

- La app **ya tiene shells por rol**: `(adopter)`, `(shelter)` y `(admin)`
  usan [`AppShell`](../../../src/components/layout/AppShell.tsx) (sidebar
  `AppSidebar` + `AppHeader` + breadcrumbs vía
  [`crumbsFromPathname`](../../../src/lib/breadcrumbs.ts)). El grupo
  `(public)` usa el `Header` simple
  ([`Header.tsx`](../../../src/components/layout/Header.tsx)) — la barra del
  pantallazo del usuario.
- **El menú del avatar es compartido** por ambos:
  [`UserMenu.tsx`](../../../src/components/layout/UserMenu.tsx) hoy solo
  ofrece "Mi cuenta" + "Cerrar sesión", sin rol. Ahí está el problema: una
  protectora que navega por páginas públicas no tiene acceso a `/panel`.
- **Rol canónico = `profiles.role`** (`adopter|shelter|admin`), como usa el
  [`middleware`](../../../src/middleware.ts) para proteger `/panel`
  (role `shelter`). La condición de protectora también se ve en
  `shelters.owner_id == user.id`, pero la fuente de verdad es `profiles.role`.
- El **gate de acceso real a `/panel` ya lo hace el middleware** — mostrar u
  ocultar el enlace es solo UX/descubribilidad, no seguridad.
- `Header.tsx` **es Server Component** → puede leer el rol en servidor con el
  cliente Supabase SSR y pasarlo a `UserMenu` como prop (sin round-trip
  cliente, sin exponer lógica extra). `AppShell` ya conoce el rol por
  layout → se hilará hasta `UserMenu` para menú consistente en todos lados.

### Documentación a consultar

- Skills: `adoptia-frontend` (Header/UserMenu, Tailwind, i18n),
  `adoptia-backend` (Supabase SSR server client), `adoptia-security` (lectura
  de rol, no filtración), `adoptia-testing` (Vitest + Testing Library).
- `docs/technical/DESIGN.md` (tokens "Warm Earth & Tail").
- `stitch-prompt.txt` (temporal, en raíz): referencia visual de las dos
  variantes de barra + menú.

### Seguridad

- **Sin cambios de RLS.** El rol se lee con el cliente SSR autenticado
  (`profiles` where `id = auth.uid()`, política de lectura de propio perfil ya
  existente). Verificar en Bolt que la policy de `profiles` permite al usuario
  leer su propia fila; si no, es bug aparte (no lo asumimos).
- La visibilidad del enlace "Panel de protectora" es cosmética; la
  autorización sigue en el middleware. No se muestra a un adoptante.
- No se expone a terceros que un usuario gestiona una protectora (el rol solo
  se lee para el propio usuario logueado).

### Modelo de datos

- Sin cambios.

### API

- Sin cambios (no hay Route Handlers nuevos; el rol se lee en el Server
  Component `Header` y en los layouts existentes).

### Frontend

- **`UserMenu.tsx`**: aceptar prop `role?: "adopter" | "shelter" | "admin" | null`.
  - `shelter` → añade arriba, destacada, **"Panel de protectora"** (`/panel`,
    icono edificio/tienda) + "Ajustes de la protectora" (`/panel/perfil` o la
    ruta real de ajustes) → separador → "Mi cuenta" → "Cerrar sesión".
  - `adopter` (o sin rol logueado normal) → "Mi cuenta", "Mis favoritos"
    (`/mi-cuenta/favoritos`), "Mis solicitudes" (`/mi-cuenta/solicitudes`),
    "Mis citas" (`/mi-cuenta/citas`) → separador → "Cerrar sesión".
  - `admin` → "Panel de administración" (`/admin`) + "Mi cuenta" + logout.
- **`Header.tsx`** (público, server): leer `user` y `profiles.role`; pasar
  `role` a `UserMenu`. Rediseñar la barra según Stitch: logo, enlaces de nav
  (activo en terracota), buscador pill "Buscar raza…", CTA pill e icono de
  favoritos. Enlaces de nav idénticos para todos en público (Adoptar,
  Protectoras, Mapa, Perdidos, Sobre nosotros) — la diferenciación por rol
  vive en el **menú del avatar**, no en los enlaces públicos.
- **Breadcrumbs en público**: nuevo componente cliente ligero que use
  `usePathname` + `crumbsFromPathname` + `Breadcrumbs`, en una fila bajo la
  barra. Reutiliza la lib existente; añadir a `ETIQUETAS` los segmentos
  públicos que falten (animales, mapa, perdidos-encontrados, guias…).
- **`AppShell`/`AppHeader`**: hilar `role` (ya conocido en cada layout) hasta
  `UserMenu` para que el menú sea coherente dentro del panel/mi-cuenta.
- **Responsive**: en móvil los enlaces de nav del `Header` colapsan en
  hamburguesa (drawer) y el buscador se reduce a icono de lupa.
- **i18n**: nueva clave `shell.navShelterPanel` = "Panel de protectora" (y
  `shell.navAdminPanel` si se añade el acceso admin). Reutilizar
  `shell.navAccount|navFavorites|navMyRequests|navMyAppointments`.

### Tareas TDD

**Fase 1 — núcleo funcional (menú por rol). HECHA.**

1. [x] **i18n**: claves `shell.navShelterPanel` y `shell.navAdminPanel`.
2. [x] **UserMenu · protectora**: `role="shelter"` → "Panel de protectora"
   (`/panel`), sin accesos de adoptante.
3. [x] **UserMenu · adoptante**: `role="adopter"` → favoritos/solicitudes/citas,
   sin "Panel de protectora".
4. [x] **UserMenu · admin**: `role="admin"` → "Panel de administración"
   (`/admin/protectoras`).
5. [x] **UserMenu · sin sesión**: sigue mostrando "Iniciar sesión" (regresión).
6. [x] **getUserRole**: helper `src/lib/user-role.ts` (lee `profiles.role` del
   propio usuario) con sus tests.
7. [x] **Header lee rol**: `Header` pasa a Server Component async, lee el rol
   y lo pasa a `UserMenu`.
8. [x] **AppHeader coherente**: `role` hilado `AppShell → AppHeader → UserMenu`.

**Fase 2 — rediseño visual del top bar público. HECHA (con DESIGN.md, sin Stitch).**

9. [x] Restyle de la barra pública con tokens de DESIGN: marca con huella,
   enlaces con estado activo (terracota), buscador tipo pill. Nav extraída a
   `PublicNav` (cliente).
10. [x] Fila de breadcrumbs bajo la barra (`PublicBreadcrumbs` cliente con
   `usePathname` + `crumbsFromPathname`; `ETIQUETAS` y claves i18n de crumbs
   públicos ampliadas).
11. [x] Menú móvil (hamburguesa + drawer con foco/Escape) y buscador dentro
   del drawer.

**Desviación consciente (buscador):** `animals_search` NO tiene búsqueda por
texto/raza (solo filtros: especie/tamaño/sexo/edad). Un buscador de texto real
exigiría un parámetro nuevo en el RPC = cambio de arquitectura fuera del plan.
El buscador se implementa como **enlace** a `/animales` con la estética del
mockup ("Buscar raza…"). El buscador de texto real queda como follow-up
(nuevo item: parámetro de texto en `animals_search`).

### Dependencias

- Ninguna. (Trabaja sobre componentes existentes; no requiere otros items.)

## Criterios de aceptación / Casuística a cubrir

- [ ] Una **protectora** logueada ve "Panel de protectora" en el menú del
      avatar (en páginas públicas Y dentro del panel) y al pulsarlo llega a
      `/panel`.
- [ ] Un **adoptante** ve sus accesos (Mi cuenta, Favoritos, Solicitudes,
      Citas) y **NO** ve "Panel de protectora".
- [ ] Un **admin** ve acceso a `/admin` en su menú.
- [ ] La detección de rol usa `profiles.role` leído en servidor; no se
      consulta ni expone el rol de otros usuarios.
- [ ] El **acceso real** a `/panel` sigue protegido por el middleware aunque
      se manipule el DOM (el enlace es solo UX).
- [ ] **Sin sesión**: la barra muestra "Iniciar sesión" y funciona como hoy.
- [ ] **Breadcrumbs** visibles bajo la barra en público, derivados del
      pathname y traducidos.
- [ ] Textos en `messages/es.json` (next-intl); nada hardcodeado.
- [ ] **Responsive**: enlaces colapsan en hamburguesa y buscador en lupa en
      móvil; foco y Escape gestionados en el drawer.
- [ ] Contraste WCAG AA y touch targets ≥44px (tokens de DESIGN).
- [ ] Tests verdes, `npm run lint` y `npx tsc --noEmit` limpios.

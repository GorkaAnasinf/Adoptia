---
id: FEATURE-018
tipo: feature
titulo: App shell autenticado — cabecera común, navegación por rol y breadcrumbs
estado: desarrollo
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-06
actualizado: 2026-07-06
---

# FEATURE-018 — App shell autenticado (cabecera, navegación por rol, breadcrumbs)

## Descripción

Todas las pantallas logueadas (`(shelter)`, `(admin)`, `(adopter)`) comparten hoy un marco inexistente: son páginas desnudas sin cabecera, navegación ni contexto. Se crea un **app shell** común: cabecera con marca, breadcrumbs, badge de estado, notificaciones y menú de usuario; **navegación lateral** (sidebar) con los ítems según rol/estado; y footer. Es la base visual de toda la app autenticada. (Ref: wireframe **APP**)

## Contexto / impacto

Unifica el sistema de diseño dentro de la app, mejora orientación (breadcrumbs), da acceso a la navegación del panel (Stitch §2.2) y homogeneiza la experiencia entre protectora, admin y adoptante. Sin esto, cada pantalla nueva reinventa su marco.

## Referencia de diseño

- **Wireframe base:** `assets/wireframes/app/` (`screen.png`, `code.html`, `DESIGN.md` — sistema "Warm Earth & Tail", idéntico a [DESIGN](../../technical/DESIGN.md)).
- Reutilizar/segregar de los componentes existentes `src/components/layout/Header.tsx` y `UserMenu.tsx` (hoy de la cabecera pública).

## Plan de desarrollo

### Frontend

- **Layout de shell** aplicable a los grupos autenticados. Estructura (desktop): sidebar fijo a la izquierda + columna de contenido con cabecera arriba, contenido en medio y footer abajo. Contenedor `max-w` cómodo; fondo `surface` crema.
- **Cabecera común:**
  - Izquierda: marca "Adoptia" + subtítulo con el nombre de la entidad (p. ej. "Huellas de Esperanza").
  - Centro: **breadcrumbs** data-driven (p. ej. `Panel › Inicio`, `Panel › Alta de protectora › Ubicación`).
  - Derecha: **badge de estado** (protectora: "Verificada" verde / "En revisión" ámbar / "Suspendida" rojo), icono de ayuda, campana de notificaciones (con punto), y **menú de usuario** (avatar circular → dropdown Perfil/Ajustes/Salir).
- **Sidebar por rol/estado:**
  - Protectora **verificada**: Inicio, Mis animales (con contador), Solicitudes (badge), Citas, Agenda, Perfil público, Estadísticas + botón "Contactar soporte" abajo. (Muchos ítems apuntarán a pantallas de items futuros — dejar enlaces preparados o deshabilitados según exista la ruta.)
  - Protectora **en onboarding** (sin alta enviada): el sidebar se muestra por consistencia, pero con los ítems **deshabilitados/atenuados** salvo el alta (el panel está bloqueado hasta completar). — *Decisión de diseño acordada con el usuario: reusar cabecera + sidebar también en el wizard.*
  - **Admin**: navegación propia (Protectoras, Moderación… según vayan existiendo).
  - **Adoptante**: shell más ligero (cabecera + navegación mínima).
- **Breadcrumbs**: componente reutilizable que recibe la ruta/segmentos (o se deriva del pathname + un mapa de títulos). Textos en `messages/es.json`.
- **Footer** autenticado: `© Adoptia`, hint "Guardado automáticamente" cuando aplique, enlaces Ayuda/Términos/Privacidad.
- **Responsive (mobile-first):** el sidebar colapsa a un **drawer** con botón hamburguesa en la cabecera; breadcrumbs se recortan; targets ≥44px.
- **Componentes nuevos** en `src/components/layout/`: `AppShell`, `AppSidebar`, `AppHeader` (o extensión de `Header`), `Breadcrumbs`, `StatusBadge`. Reutilizar `UserMenu`.

### Backend / datos

- El shell necesita: rol del usuario, nombre y estado de la protectora (para el badge). Se leen en el layout server (una query a `profiles`/`shelters`, similar al gate). Sin endpoints nuevos.

### Seguridad

- Sin cambios de RLS. El shell no expone datos que el usuario no pueda ver (nombre/estado propios). Los contadores (solicitudes, etc.) respetan RLS.

### Tareas TDD

1. `Breadcrumbs` — test: dado un pathname/segmentos, renderiza las migas correctas con el último activo sin enlace.
2. `StatusBadge` — test: mapea `verified/pending/suspended` a etiqueta y color correctos (i18n).
3. `AppSidebar` — test: ítems según rol; en onboarding (sin alta) los ítems del panel salen deshabilitados; el activo se marca.
4. `AppHeader` — test: muestra marca, breadcrumbs, badge y `UserMenu`; botón de menú móvil abre el drawer.
5. `AppShell` (integración ligera) — test: compone header+sidebar+contenido; el layout server pasa rol/estado.
6. Aplicar el shell a `(shelter)` y `(admin)` (y adoptante si procede) sin romper las páginas existentes (ajustar sus tests).

### Dependencias

- Ninguna dura. Habilita [[IMPROVEMENT-002]] (rediseño del wizard, que consume este shell).

## Criterios de aceptación / Casuística a cubrir

- [x] Toda pantalla autenticada muestra la cabecera común (marca, breadcrumbs, badge de estado, menú de usuario) y, según rol, el sidebar.
- [x] Breadcrumbs correctos por ruta; el segmento actual no es enlace.
- [x] Badge de estado de la protectora correcto (verificada/en revisión/suspendida) con color e i18n.
- [x] Sidebar por rol; en onboarding los ítems del panel están deshabilitados salvo el alta.
- [x] Responsive: en móvil el sidebar es un drawer accesible (abrir/cerrar, focus, ≥44px).
- [x] Menú de usuario con Salir funcional; sin textos hardcodeados (todo en `messages/es.json`).
- [x] Las páginas existentes (`/panel`, `/admin/protectoras`, `/mi-cuenta`) siguen funcionando dentro del shell.

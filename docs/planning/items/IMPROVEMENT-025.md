---
id: IMPROVEMENT-025
tipo: improvement
titulo: Acogidas visibles en la navegación del usuario
estado: desarrollo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# IMPROVEMENT-025 — Acogidas visibles en la navegación del usuario

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Hoy la página `/acogida` (alta y gestión de casas de acogida, FEATURE-016) solo está enlazada en el footer y el sitemap: un usuario que quiere acoger no la encuentra. Se pide:

1. Entrada «Acogidas» en el menú de usuario / sidebar que lleve a `/acogida`.
2. Si el usuario ya está registrado como acogedor: acceso directo a gestionar (editar condiciones, pausar, darse de baja) con su estado visible («Disponible para acoger» / «Pausado»). La gestión ya existe en `/acogida`; el problema es de descubribilidad, no de funcionalidad.
3. Si no está registrado: CTA «Hazte casa de acogida».

Solo UI + i18n; sin cambios de BD ni API.

## Contexto / impacto

Las casas de acogida son una necesidad constante de las protectoras, pero el registro de acogedores apenas recibe altas porque la puerta de entrada está escondida. Afecta a adoptantes/usuarios (no encuentran cómo ofrecerse) y a protectoras (menos acogedores disponibles en su zona).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- Skills `adoptia-frontend` y `adoptia-testing`.
- FEATURE-016 (cierre) — la gestión completa ya vive en `AcogidaForm`.

### Seguridad

- Sin superficie nueva: la página nueva vive bajo `/mi-cuenta` (middleware + layout de adoptante ya la protegen) y reutiliza `AcogidaForm`, cuya escritura ya está limitada por RLS de `foster_homes` (solo el dueño). Sin cambios de RLS.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios.

### Frontend

- **Página nueva `/mi-cuenta/acogida`** (`src/app/(adopter)/mi-cuenta/acogida/page.tsx`): server component espejo de `(public)/acogida/page.tsx` — auth (redirect a `/login` si no hay sesión), carga de la fila `foster_homes` del usuario y render de `AcogidaForm`. Reutiliza los textos del namespace `acogida` (título/subtítulo/privacidad).
- **Sidebar de adoptante** (`AppSidebar.tsx`, bloque `adopter`): entrada `navFosterCare` → `/mi-cuenta/acogida`, icono `HeartHandshake`. El estado (Disponible/Pausado) se ve al aterrizar — la barra de `AcogidaForm` ya lo muestra; los badges del sidebar son numéricos y no encajan para esto.
- **Menú de usuario** (`UserMenu.tsx`, `ACCESOS.adopter`): misma entrada, para que también sea visible desde la navegación pública.
- **i18n**: clave nueva `shell.navFosterCare` = «Acogidas» en `messages/es.json`.
- La página pública `/acogida` se mantiene tal cual (landing SEO + footer + usuarios anónimos); el formulario es el mismo componente.

### Tareas TDD

1. Test `AppSidebar.test.tsx`: el rol `adopter` muestra «Acogidas» apuntando a `/mi-cuenta/acogida` → añadir item al bloque `adopter`.
2. Test `UserMenu.test.tsx`: el menú del adoptante incluye «Acogidas» → añadir a `ACCESOS.adopter`.
3. Test de página `mi-cuenta/acogida/page.test.tsx` (patrón del test de `panel/acogida`): sin sesión redirige a `/login`; con sesión renderiza `AcogidaForm` con el registro existente (o alta si no hay).
4. Suite completa + lint + `tsc --noEmit`.

### Dependencias

- Ninguna (FEATURE-016 ya `hecho`).

## Criterios de aceptación / Casuística a cubrir

- [ ] Adoptante autenticado ve «Acogidas» en el sidebar de `/mi-cuenta` y en el menú del avatar; un clic lleva a `/mi-cuenta/acogida`.
- [ ] Con registro de acogedor: la página muestra el estado (Disponible/Pausado) y permite editar / pausar / darse de baja (funcionalidad existente de `AcogidaForm`).
- [ ] Sin registro: la página muestra el formulario de alta con consentimiento.
- [ ] Sin sesión: `/mi-cuenta/acogida` redirige a `/login`.
- [ ] La página pública `/acogida` sigue funcionando igual (footer y sitemap intactos).
- [ ] Textos nuevos en `messages/es.json`; suite completa verde, lint y `tsc` limpios.

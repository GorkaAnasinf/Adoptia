---
id: IMPROVEMENT-004
tipo: improvement
titulo: Pulido del chrome (sidebar arena, cabecera) y estado vacío de Mi cuenta
estado: hecho
prioridad: media
hito: "0.2"
duplicado_de: null
creado: 2026-07-07
actualizado: 2026-07-07
---

# IMPROVEMENT-004 — Pulido del chrome + estado vacío de Mi cuenta

## Descripción

Continuación de [[IMPROVEMENT-003]] tras feedback visual del usuario. Cambios de chrome
y un estado vacío cuidado en `/mi-cuenta` (hoy un `<p>` suelto). Sin datos reales aún.

## Contexto / impacto

El sidebar blanco desentona con el fondo crema; los botones de ayuda/notificaciones se ven
como controles muertos (perpetuamente `disabled`); el menú de usuario solo muestra el email;
y `/mi-cuenta` es un placeholder pobre. Todo transversal al panel → mejora percibida alta.

## Plan de desarrollo

### Frontend

- **Sidebar arena**: `AppShell` — `aside` y drawer pasan de `bg-card` (blanco) a **`bg-muted`**
  (#f3ede4), separado del fondo por el `border`. Se retira el `shadow-sm` (el tinte ya
  diferencia). Drawer conserva `shadow-xl` (flota sobre overlay).
- **Ocultar botones muertos**: `AppHeader` — se **retiran** los botones de ayuda y campana
  mientras no exista su feature (mejor que mostrarlos `disabled`). Se conserva el prop
  `hasNotifications` latente en la firma para reactivar la campana sin fricción cuando
  llegue notificaciones. El `import` de iconos sin uso se limpia.
- **Nombre real en el menú**: `UserMenu` — la cabecera del desplegable muestra
  `user_metadata.full_name` (si existe) y el email debajo en tono atenuado; fallback: solo
  email. Las iniciales ya usan `full_name`.
- **Skip-to-content** (accesibilidad WCAG): `AppShell` — enlace `sr-only` que se hace visible
  al foco, salta a `#contenido` (id en `<main>`). Nueva clave i18n.
- **Estado vacío de Mi cuenta**: `/mi-cuenta` — sustituir el `<p>` por un empty state
  cuidado (tarjeta centrada, icono Heart, título + texto amable, CTA "Explorar animales").
  El CTA enlaza a `/` de momento (la búsqueda pública es [[FEATURE-005]], aún sin ruta);
  se retargetea a `/animales` cuando exista. Claves i18n en `account`.

### Seguridad

- Sin superficie nueva. Sin cambios de auth/RLS.

### Modelo de datos / API

- Sin cambios.

### Tareas TDD

1. **`AppHeader`**: test "no renderiza los botones de ayuda ni de notificaciones (pendientes
   de feature)" → retirar botones; ajustar tests de IMPROVEMENT-003 del punto de campana.
2. **`UserMenu`**: test "muestra el nombre completo cuando existe `full_name`" → implementar.
3. **`AppShell`**: test "expone un enlace de saltar al contenido que apunta a #contenido" →
   implementar skip link + `id` en main.
4. **Mi cuenta**: test "muestra estado vacío con CTA de explorar animales" → implementar
   empty state.
5. Sidebar arena: cambio de clase (verificación visual con `verify`; sin test de clase).

### Dependencias

- [[IMPROVEMENT-003]] (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Sidebar (desktop y drawer) con fondo arena `bg-muted`, diferenciado del fondo por el borde.
- [x] Cabecera sin botones muertos: ayuda y campana retiradas hasta tener feature; prop
      `hasNotifications` conservado para reactivación futura.
- [x] Menú de usuario muestra nombre real (fallback a email).
- [x] Enlace "saltar al contenido" accesible (visible al foco) que lleva al `<main>`.
- [x] `/mi-cuenta` muestra un estado vacío cuidado con CTA (no un `<p>` suelto).
- [x] Sin textos hardcodeados; coherente con tokens de `DESIGN.md`.
- [x] Responsive sin regresiones en el drawer.

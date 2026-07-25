---
id: IMPROVEMENT-035
tipo: improvement
titulo: Añadir capturas de pantalla al manual de usuario
estado: hecho
prioridad: baja
hito: "0.5"
duplicado_de: null
creado: 2026-07-25
actualizado: 2026-07-25
---

# IMPROVEMENT-035 — Capturas de pantalla en el manual

## Descripción

El manual de usuario (`docs/manual/MANUAL_USUARIO.md`) está completo y al día en
texto, pero **sin capturas de pantalla**. Añadir imágenes reales de las pantallas
clave hace el manual mucho más útil para presentar la plataforma a personas no
técnicas.

## Contexto

Detectado en la auditoría de cierre (2026-07-25). Requiere **levantar la app en
local** con datos sembrados y sesión iniciada por cada rol (adoptante, protectora,
admin) para capturar las vistas; parte del flujo (login) usa Turnstile, así que la
captura conviene hacerla con el dev server local y una sesión asistida (ver
`memory` de auditoría de prod y `docs/meta/TESTING.md`).

## Pantallas a capturar (mínimo)

- Home (hero + recién llegados + historias felices).
- Buscador de animales con filtros; ficha de animal.
- Mapa de protectoras; perfil público de protectora.
- Cuestionario de adopción; **Mi cuenta** (solicitudes, citas, favoritos, alertas).
- Panel de la protectora: dashboard, animales, solicitudes, **agenda (vistas
  Mes/Año/Día)**, estadísticas.
- Casas de acogida (registro) y Necesidades (tablón).
- Admin: verificación y moderación.

## Cierre (2026-07-25)

- **24 capturas** incrustadas en `docs/manual/MANUAL_USUARIO.md`, guardadas en
  `docs/manual/img/` (dentro del árbol de MkDocs, se sirven solas): home (escritorio
  y móvil), listado, ficha, protectoras, mapa, perfil de protectora, guías, artículo
  de guía, acogida, necesidades, perdidos, Mi cuenta (dashboard, favoritos,
  solicitudes, citas, alertas) y panel de la protectora (dashboard, animales,
  solicitudes, agenda, estadísticas, acogida, necesidades).
- Tomadas con **Playwright** sobre el stack local (`npx supabase db reset` +
  `supabase/seed.sql` + un pequeño enriquecimiento demo), captcha desactivado por
  el `webServer`, sesión con los usuarios demo del seed (`AdoptiaDemo1!`).
- Scripts de regeneración: `e2e/_capturas.spec.ts` (públicas) y
  `e2e/_capturas-auth.spec.ts` (privadas). **Se saltan en CI/e2e normal**; para
  regenerarlas: `CAPTURAS=1 npx playwright test e2e/_capturas.spec.ts --project=chromium --workers=1`.
- Admin (verificación/moderación) queda **sin captura** por ahora (el seed no trae
  usuario admin); pendiente menor si se quiere completar esa sección.

## Criterios de aceptación

- El manual incluye capturas actualizadas de las pantallas clave, con texto
  alternativo, en `docs/manual/img/`, y se ven en el sitio de MkDocs. ✓

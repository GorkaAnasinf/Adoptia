---
id: FEATURE-047
tipo: feature
titulo: Solicitudes recientes clicables + badge de estado legible sobre foto
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

> **Cierre (2026-07-22):** hecho en `feature/FEATURE-047-panel-solicitudes-link-badge-contraste`.
> Dos ajustes sobre el panel de la protectora (FEATURE-046). (1) Cada fila de
> «Solicitudes recientes» **enlaza a `/panel/solicitudes`**, igual que las filas de
> «Próximas citas» enlazan a su calendario; la tabla pasa a rejilla clicable
> (cabeceras Adoptante · Mascota · Fecha · Estado + fila `<Link>`). (2) `AnimalStatusBadge`
> gana la prop **`onImage`**: sobre foto usa fondo **sólido** del color de estado +
> texto blanco + sombra, para que el estado no se pierda contra el fondo de la imagen
> (antes usaba tintes translúcidos casi invisibles sobre fotos oscuras). Se aplica en
> la rejilla «Tus animales». Default `onImage=false`, así el resto de usos del badge no
> cambian. Sin cambios de modelo/RLS. QA: suite 1048 verde, typecheck y lint limpios.
> **Pendiente:** despliegue.

# FEATURE-047 — Filas de solicitudes clicables + contraste del badge de estado

## Descripción

Tras ver el panel a 2 columnas (FEATURE-046), dos correcciones pedidas: las filas de
«Solicitudes recientes» no eran clicables (las de citas sí), y el badge de estado
sobre la foto del animal se confundía con el fondo en fotos oscuras.

## Contexto / impacto

Afecta a la protectora. Coherencia de interacción (todas las filas del dashboard
llevan a su detalle) y legibilidad del estado del animal en la rejilla.

## Plan de desarrollo

### Seguridad / Modelo / API

- **Sin cambios.** Solo presentación e interacción.

### Frontend

- **Solicitudes recientes**: la tabla pasa a rejilla CSS (`grid-cols-[…]`) con cabecera
  y una fila `<Link href="/panel/solicitudes">` por solicitud, para que toda la fila sea
  clicable (patrón de las citas).
- **`AnimalStatusBadge`**: nueva prop opcional `onImage`. Con `onImage`, variante de
  fondo sólido del color de estado + texto blanco + `shadow-sm`. Sin la prop, el estilo
  actual (tinte translúcido + borde) se mantiene. Se usa `onImage` en la rejilla «Tus
  animales» del panel.

### Tareas TDD

1. `panel/page.test.tsx`: la fila de solicitud enlaza a `/panel/solicitudes` y se
   muestran las cabeceras de columna.
2. Verificación: suite del panel + `tsc` + lint + suite completa.

## Criterios de aceptación / Casuística a cubrir

- [x] Cada fila de solicitudes recientes enlaza a `/panel/solicitudes`.
- [x] Cabeceras de columna Adoptante · Mascota · Fecha · Estado visibles.
- [x] Badge de estado legible sobre foto (fondo sólido) en la rejilla del panel.
- [x] El resto de usos de `AnimalStatusBadge` no cambian. Sin cambios de modelo/RLS.

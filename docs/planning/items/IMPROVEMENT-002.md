---
id: IMPROVEMENT-002
tipo: improvement
titulo: Rediseño UX del wizard de alta de protectora (+ fix del mapa gris)
estado: hecho
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-06
actualizado: 2026-07-06
---

# IMPROVEMENT-002 — Rediseño UX del wizard de alta de protectora

## Descripción

El wizard de alta actual (`/panel/alta`, de [[FEATURE-002]]) es funcional pero visualmente pobre: centrado, sin cabecera ni contexto, sin jerarquía. Se rediseña siguiendo el wireframe **prot-wizard**, montándolo **dentro del app shell** ([[FEATURE-018]]): reusa cabecera + sidebar, y el contenido adopta el nuevo layout (stepper mejorado, tarjeta de datos, panel lateral de Consejo/Resumen, footer sticky con autoguardado). Además se **arregla el mapa**, que se ve en gris.

## Contexto / impacto

Es la primera experiencia real de una protectora en la plataforma; una UX cuidada sube la conversión de altas y transmite confianza. El mapa gris rompe el paso de ubicación (bug actual en producción).

## Referencia de diseño

- **Wireframe:** `assets/wireframes/prot-wizard/` (`screen.png`, `code.html`, `DESIGN.md`).
- **Shell:** cabecera + sidebar de [[FEATURE-018]] (wireframe `app`).

## Plan de desarrollo

### Frontend

- **Montar el wizard dentro del app shell**: reusar `AppHeader` + `AppSidebar` (sidebar en modo onboarding: ítems del panel deshabilitados). Breadcrumbs `Panel › Alta de protectora › <paso>`.
- **Layout del contenido** (según wireframe):
  - Título "Completa el alta de tu protectora" + subtítulo contextual por paso.
  - **Stepper horizontal** con estados: paso hecho (check verde/teal), activo (círculo terracota con número), pendiente (gris). Etiquetas Entidad / Ubicación / Perfil público y línea de conexión.
  - **Tarjeta de datos** del paso con icono (p. ej. pin en Ubicación), campos con labels arriba, foco `border-2` sage, radios 8px.
  - **Columna lateral derecha** (desktop): tarjeta "Consejo" (tono sage) + tarjeta "Resumen" (entidad, CIF, "Datos fiscales verificados"). En móvil se colapsa bajo el formulario.
  - **Footer sticky** dentro del contenido: hint "Guardado automáticamente" con icono a la izquierda; a la derecha "Atrás" (ghost) y "Siguiente"/"Enviar a revisión" (primary, grande).
- Mantener la lógica ya existente: validación por paso (Zod), persistencia de borrador (upsert), geocode, subida de logo, editor de horarios. Solo cambia la presentación.
- **Responsive**: mobile-first; una columna, panel lateral debajo, footer sticky abajo.

### Fix del mapa (se ve en gris) — CAUSA CONFIRMADA

**La CSP de `next.config.ts` bloquea las tiles de OpenStreetMap.** El `img-src` actual es
`'self' data: blob: https://*.supabase.co` — las tiles se cargan como `<img>` desde
`https://{a,b,c}.tile.openstreetmap.org` y quedan bloqueadas → mapa gris. Los iconos de
marcador (hoy desde `unpkg.com`) también se bloquean.

Fix:
1. **CSP (principal):** añadir `https://*.tile.openstreetmap.org` a `img-src` en
   `next.config.ts`. (Es el arreglo que quita el gris.)
2. **Iconos de marcador:** en vez de depender de `unpkg.com` (otra excepción CSP), **servir
   los assets de Leaflet localmente** (copiar `marker-icon.png`, `marker-icon-2x.png`,
   `marker-shadow.png` a `public/leaflet/` e importarlos), coherente con el "coste 0 / sin CDNs".
3. **`invalidateSize()`:** por si el contenedor tiene tamaño 0 al montar (dynamic import /
   step recién montado), llamar `map.invalidateSize()` tras montar. Verificar altura efectiva
   de `.leaflet-container`.
4. Confirmar que la CSS de Leaflet se carga (`leaflet/dist/leaflet.css`).

Verificación manual (skill `verify`) del mapa con tiles reales y pin arrastrable, y repaso
de que la CSP no rompe nada más.

### Tareas TDD

1. Rediseño de `WizardAlta` sobre el shell — ajustar/mantener tests existentes (navegación de pasos, upsert de borrador, submit, aviso de duplicado) con la nueva estructura.
2. `Stepper` — test de estados hecho/activo/pendiente (si cambia respecto al actual).
3. Panel lateral "Resumen" — test: refleja los datos ya introducidos (entidad, CIF).
4. Fix del mapa — test/prueba de que el contenedor tiene altura y se llama a `invalidateSize`; verificación manual de tiles + pin.

### Dependencias

- **[[FEATURE-018]]** (app shell) — debe estar `hecho` antes (aporta cabecera + sidebar).
- [[FEATURE-002]] (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] El wizard se muestra dentro del app shell (cabecera + sidebar en modo onboarding + breadcrumbs).
- [x] Layout según wireframe: stepper con estados, tarjeta de datos, panel lateral Consejo/Resumen, footer sticky con autoguardado.
- [x] La lógica previa sigue intacta: validación por paso, borrador recuperable, geocode, logo, horarios, envío a revisión.
- [x] **El mapa se ve correctamente** (tiles cargadas, no gris) con el pin arrastrable; funciona tras cambiar de paso y en móvil.
- [x] Responsive: en móvil, una columna, panel lateral debajo, footer accesible.
- [x] Sin textos hardcodeados; consistente con los tokens de `DESIGN.md`.

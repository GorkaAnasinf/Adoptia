---
id: IMPROVEMENT-002
tipo: improvement
titulo: Rediseño UX del wizard de alta de protectora (+ fix del mapa gris)
estado: recibido
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

### Fix del mapa (se ve en gris)

Diagnosticar y corregir `MapPinPicker`/`MapPinPickerInner`. Causas probables (verificar en este orden):
1. **`invalidateSize()`**: el contenedor puede tener tamaño 0 al inicializar Leaflet (dynamic import / step recién montado) → tiles grises. Llamar `map.invalidateSize()` tras montar (o con un `ResizeObserver`).
2. **Altura del contenedor**: asegurar que `.leaflet-container` tiene altura efectiva (no depender solo de la clase si el padre colapsa).
3. **Iconos por CDN (unpkg)**: si hay CSP que bloquea `unpkg.com`, el pin no carga (aunque no explica el gris de tiles) → servir los assets de marcador localmente desde `leaflet` en `public/` o vía import.
4. **Tiles de OSM bloqueadas por CSP/red**: revisar cabeceras `Content-Security-Policy` (`img-src`/`connect-src` deben permitir `*.tile.openstreetmap.org`). Ajustar si el proyecto tiene CSP.
5. Confirmar que la CSS de Leaflet se carga (`leaflet/dist/leaflet.css`).

Añadir verificación manual (skill `verify`) del mapa renderizando con tiles reales y pin arrastrable.

### Tareas TDD

1. Rediseño de `WizardAlta` sobre el shell — ajustar/mantener tests existentes (navegación de pasos, upsert de borrador, submit, aviso de duplicado) con la nueva estructura.
2. `Stepper` — test de estados hecho/activo/pendiente (si cambia respecto al actual).
3. Panel lateral "Resumen" — test: refleja los datos ya introducidos (entidad, CIF).
4. Fix del mapa — test/prueba de que el contenedor tiene altura y se llama a `invalidateSize`; verificación manual de tiles + pin.

### Dependencias

- **[[FEATURE-018]]** (app shell) — debe estar `hecho` antes (aporta cabecera + sidebar).
- [[FEATURE-002]] (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [ ] El wizard se muestra dentro del app shell (cabecera + sidebar en modo onboarding + breadcrumbs).
- [ ] Layout según wireframe: stepper con estados, tarjeta de datos, panel lateral Consejo/Resumen, footer sticky con autoguardado.
- [ ] La lógica previa sigue intacta: validación por paso, borrador recuperable, geocode, logo, horarios, envío a revisión.
- [ ] **El mapa se ve correctamente** (tiles cargadas, no gris) con el pin arrastrable; funciona tras cambiar de paso y en móvil.
- [ ] Responsive: en móvil, una columna, panel lateral debajo, footer accesible.
- [ ] Sin textos hardcodeados; consistente con los tokens de `DESIGN.md`.

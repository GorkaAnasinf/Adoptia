---
id: FEATURE-044
tipo: feature
titulo: Rediseño de "Mis donaciones" (patrón base) + edición con un solo formulario
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-21
actualizado: 2026-07-21
---

> **Cierre (2026-07-21):** hecho en `feature/FEATURE-044-donaciones-base`. Nuevo
> `MisDonacionesCliente` con dos pestañas (patrón de acogida): «Publicar donación»
> (un **único** `DonacionForm` reutilizado alta↔edición) y «Mis donaciones» (lista).
> **Editar** en una fila deja de montar un segundo formulario: llama a `onEditar`, que
> carga la oferta en ese mismo formulario y cambia de pestaña. `DonacionForm` rediseñado
> con `FormSection` + `ChipGroup` (categoría con icono, distancia con presets + valor
> actual). `DonacionRow` sin edición inline, botones homogéneos, tarjeta de la tanda.
> Ancho a `max-w-6xl`. Reutiliza los primitivos de FEATURE-043. Sin cambios de modelo/RLS.
> QA: suite verde, typecheck y lint limpios. **Pendiente:** despliegue.

# FEATURE-044 — Mis donaciones con el patrón base + edición sin formulario duplicado

## Descripción

Aplicar a `/mi-cuenta/donaciones` el mismo lenguaje que a acogida (FEATURE-043):
formulario en tarjeta por secciones con chips/segmented, ancho coherente y botones
homogéneos. Y **corregir la edición**: hoy, al pulsar «Editar» en una oferta
publicada, `DonacionRow` renderiza **un segundo `DonacionForm` completo inline**,
idéntico al de alta que ya está arriba. Hay que **reaprovechar un único formulario**
en pantalla en vez de duplicarlo.

## Contexto / impacto

Afecta al donante. Dos formularios idénticos (el de alta arriba + el de edición
inline) confunden y ocupan. Un solo formulario reutilizado (alta ↔ edición) es más
claro y consistente con el patrón que acabamos de asentar.

## Plan de desarrollo

### Seguridad / Modelo / API

- **Sin cambios.** Misma escritura en `donation_offers` bajo RLS (insert/update/delete
  por dueño). Es presentación + reorganización de estado en cliente.

### Frontend

- **Nuevo client component** `MisDonacionesCliente` que posee el estado de edición y
  divide en dos pestañas (patrón de acogida):
  - **«Publicar donación»** — un **único** `DonacionForm`. En modo alta por defecto;
    cuando se edita una oferta, el mismo formulario carga sus datos (título «Editar
    donación», botón «Guardar» + «Cancelar»). Al guardar/cancelar, vuelve a modo alta.
  - **«Mis donaciones»** — la lista de `DonacionRow`.
  - **Pestaña por defecto:** con ofertas → «Mis donaciones»; sin ofertas → «Publicar».
  - **Editar** en una fila ya **no** monta otro formulario: llama a `onEditar(oferta)`,
    que cambia a la pestaña «Publicar» con el formulario en modo edición (reutilizado).
- **`DonacionForm` rediseñado** con el patrón base: `FormSection` (icono + título +
  ayuda), **categoría como `ChipGroup`** (con icono por categoría), **distancia como
  `ChipGroup`** (presets + el valor actual si difiere, para no pisar radios existentes),
  ciudad y descripción con labels arriba, mapa, botones coherentes (primario granate).
- **`DonacionRow`**: quita la rama de edición inline; conserva entregar/renovar/borrar,
  botones homogéneos (mismo alto/forma). Restyle a tarjeta de la tanda.
- **Página**: ancho a `max-w-6xl`; envuelve todo en `MisDonacionesCliente`.
- Textos nuevos a `messages/es.json` (`donaciones.*`): pestañas, título «Editar
  donación», secciones.

### Tareas TDD

1. `MisDonacionesCliente.test.tsx`: sin ofertas arranca en «Publicar»; con ofertas en
   «Mis donaciones»; «Editar» en una fila cambia a «Publicar» con los datos cargados y
   **sin** un segundo formulario; guardar/cancelar vuelve a alta.
2. Adaptar `DonacionForm.test.tsx` al rediseño (chips de categoría/distancia)
   manteniendo validaciones (falta descripción/ciudad/pin), alta, edición y tope.
3. Adaptar `donaciones/page.test.tsx` al árbol de pestañas.
4. Tests de los primitivos ya existen (FEATURE-043).
5. Verificación visual + `tsc` + lint + suite.

### Dependencias

- Reutiliza `FormSection`/`ChipGroup`/`SegmentedControl` de FEATURE-043.

## Criterios de aceptación / Casuística a cubrir

- [ ] Un solo formulario en pantalla; editar reutiliza ese formulario (sin duplicado).
- [ ] Formulario en secciones con chips (categoría, distancia), coherente con acogida.
- [ ] Ancho `max-w-6xl`; botones de fila homogéneos.
- [ ] Alta, edición (sin pisar zona), entregar, renovar, borrar y tope de 5 siguen bien.
- [ ] Sin sesión: redirige a /login. Sin cambios de modelo/RLS.

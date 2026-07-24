---
id: IMPROVEMENT-034
tipo: improvement
titulo: Rediseño de la vista pública de Casas de acogida
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-24
actualizado: 2026-07-24
---

# IMPROVEMENT-034 — Rediseño de la vista de Casas de acogida

## Descripción

La página pública `/acogida` (registro de casa de acogida) se había quedado
fuera de la tanda de rediseño: contenedor estrecho (`max-w-2xl`), cabecera plana
y sin el lenguaje por secciones del resto de vistas. Ponerla en orden, por
secciones, con coherencia visual y al **mismo ancho que las vistas del panel de
la protectora** (`max-w-6xl`).

## Contexto / impacto

Continúa la tanda de rediseño de pantallas. Solo frontend + i18n; sin BD/RLS ni
migraciones. El `AcogidaForm` ya usaba `FormSection`/`ChipGroup`, así que el
trabajo es de **envoltura de página**, no de lógica del formulario.

## Cierre (2026-07-24)

Layout elegido: **bandas full-width + formulario centrado** (coherente con la home).

- Contenedor `max-w-2xl` → **`max-w-6xl`** (ancho del panel).
- **Cabecera con acento** (banda `surface-container-low`, icono `Home`, título +
  subtítulo), patrón de Guías/legales.
- Banda **«Cómo funciona la acogida»**: 3 tarjetas con `Reveal` (Te registras →
  Las protectoras de tu zona te ven → Te proponen por email). Claves i18n nuevas
  (`comoFuncionaTitle`, `paso{1,2,3}Title/Text`).
- **Garantía de privacidad** como bloque destacado (banda teal + icono candado).
- **Propuestas recibidas** (registrados) y **formulario** como secciones con
  cabecera de acento (barra `bg-primary`). El formulario va en columna legible
  centrada (`max-w-3xl`) dentro del 6xl; nueva clave `formTitulo`.
- Estado sin sesión: card CTA mejorada.
- `AcogidaForm` intacto (sin cambios de lógica). Tests del formulario (6) verdes;
  suite completa verde.

## Criterios de aceptación

- `/acogida` al ancho del panel, por secciones y coherente con el resto. Lint y
  suite verdes; textos en `es.json`.

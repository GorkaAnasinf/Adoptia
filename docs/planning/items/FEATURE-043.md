---
id: FEATURE-043
tipo: feature
titulo: Rediseño del formulario de alta (patrón base) + ajustes de mis acogidas
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-21
actualizado: 2026-07-21
---

> **Cierre (2026-07-21):** hecho en `feature/FEATURE-043-form-alta-base`. (1) Ancho
> de `/mi-cuenta/acogida` a `max-w-6xl` como el resto. (2) Pestañas reordenadas:
> Mi registro primero, Propuestas después. (3) Botones de propuesta coherentes:
> «Necesito relevo» outline granate + «Contactar refugio» filled granate, mismo alto.
> (4) `AcogidaForm` rediseñado en **tarjeta por secciones** (`FormSection` con icono +
> título + ayuda, divisores), opciones como **chips/segmented**: especies `ChipGroup`
> múltiple, vivienda `SegmentedControl`, distancia `ChipGroup` simple. Se extraen tres
> **primitivos reutilizables** en `src/components/ui/` (`FormSection`, `ChipGroup`,
> `SegmentedControl`) como base para futuros formularios de alta. Sin cambios de modelo
> ni RLS. QA: suite verde, typecheck y lint limpios. **Pendiente:** despliegue.

# FEATURE-043 — Formulario de alta bonito (patrón base) + ajustes de mis acogidas

## Descripción

Retoques sobre FEATURE-042 (mis acogidas) + un rediseño de fondo del formulario de
registro de acogida que servirá de **patrón base para todos los formularios de alta
de datos** de la aplicación.

1. **Ancho**: `/mi-cuenta/acogida` usa `max-w-3xl`; el resto de vistas del área de
   usuario usan `max-w-6xl`. Igualarlo.
2. **Orden de pestañas**: primero **Mi registro de acogida**, después
   **Propuestas recibidas**.
3. **Botones de las propuestas**: «Necesito relevo» y «Contactar refugio» deben ser
   dos botones coherentes (mismo alto/forma), como el mockup: relevo **outline
   granate**, contactar **filled granate**.
4. **Rediseño del formulario de registro** (`AcogidaForm`): hoy es funcional pero
   plano. Reorganizarlo en secciones con jerarquía, chips/segmented para las
   opciones enumeradas, y un acabado cuidado que sirva de plantilla reutilizable.

## Contexto / impacto

El formulario de acogida es el primero de varios formularios de alta (perfil,
protectora, etc.). Definir aquí un patrón visual bonito y reutilizable eleva toda la
familia de altas. Afecta al adoptante que se registra como acogida.

## Plan de desarrollo

### Seguridad / Modelo / API

- **Sin cambios.** Mismos campos y escritura en `foster_homes` bajo RLS. Es puramente
  presentación/estructura.

### Frontend

- **Ajustes rápidos**: contenedor a `max-w-6xl`; swap del orden de pestañas en
  `MisAcogidasCliente`; clases compartidas de botón (outline/filled granate,
  `min-h-11 rounded-full`) para relevo + contactar en `PropuestasRecibidas` (y en
  `RelevoAcogidaButton`, que hoy usa una píldora `text-xs`).
- **Rediseño de `AcogidaForm`** (dirección a confirmar con el usuario):
  - Secciones con encabezado + icono + ayuda: «¿Qué puedes acoger?», «Tu vivienda»,
    «Convivencia y disponibilidad», «Tu zona», consentimiento.
  - Opciones enumeradas como **chips/segmented** (especies con icono, vivienda
    Piso/Casa segmentado, jardín como toggle, distancia como chips o select).
  - Inputs con label arriba, radio 8px, foco visible; grid 2-col en desktop.
  - Banner de estado (registrado) con **interruptor** Activa/Pausada (patrón de
    `AlertaCard`) y baja.
  - Extraer un par de primitivos reutilizables (p. ej. `FormSection`, `ChipGroup`,
    `SegmentedControl`) en `src/components/ui/` como base para futuros formularios.

### Tareas TDD

1. Adaptar `AcogidaForm.test.tsx` / `MisAcogidasCliente.test.tsx` a la nueva
   estructura (chips/segmented, orden de pestañas) manteniendo la cobertura de
   guardar/pausar/baja/consent.
2. Test de los botones de propuesta (relevo + contactar coherentes).
3. Tests de los primitivos nuevos (`FormSection`/`ChipGroup`/`SegmentedControl`).
4. Verificación visual + `tsc` + lint + suite.

### Dependencias

- Consolida FEATURE-042.

## Criterios de aceptación / Casuística a cubrir

- [ ] Ancho igual al resto de vistas de usuario (`max-w-6xl`).
- [ ] Pestañas: Mi registro primero, Propuestas después.
- [ ] Relevo y Contactar como botones coherentes (mockup).
- [ ] Formulario reorganizado en secciones con chips/segmented, coherente con la tanda.
- [ ] Primitivos reutilizables extraídos para futuros formularios de alta.
- [ ] Guardar/pausar/baja/consent siguen funcionando; sin cambios de modelo.

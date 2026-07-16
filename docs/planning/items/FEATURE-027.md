---
id: FEATURE-027
tipo: feature
titulo: Rediseño del alta de aviso en tarjetas de sección (mockup nuevo)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-16
actualizado: 2026-07-16
---

# FEATURE-027 — Rediseño del alta de aviso en tarjetas de sección

## Descripción

Mockup nuevo para `/perdidos-encontrados/nuevo`. El formulario actual es una columna plana de campos; el mockup lo organiza en **tarjetas de sección** con título e icono:

1. **«¿Qué quieres reportar?»** — dos tarjetas grandes seleccionables (Perdí mi mascota / Encontré una mascota) con icono, en vez de los radios actuales.
2. **«Información del animal»** — nombre, especie, raza, sexo, edad/señas… (los campos existentes reagrupados).
3. **«Fotos»** — dropzone (clic **y arrastrar**) + miniaturas con quitar/portada (ya existen de FEATURE-024).
4. **«Ubicación»** — campo de zona + mapa con «Marca el punto exacto».
5. **«Descripción y detalles»** — textarea.
6. **«Información de contacto»** — nombre/teléfono + nota de visibilidad.
7. Pie con **«Cancelar y volver»** + **«Publicar aviso»** destacado.

Tanda de 3 rediseños con FEATURE-025 y FEATURE-026 (misma rama, suite al final).

## Contexto / impacto

El alta debe caber en <2 min desde el móvil (criterio histórico). Agrupar en tarjetas guía el ojo y reduce la sensación de formulario infinito sin añadir pasos.

## Plan de desarrollo

### Alcance (decidido con el usuario)

- **Dentro**: reorganización visual + dropzone drag&drop + pie con cancelar. **Mismos campos, mismas validaciones, mismo insert** (posts + media).
- **Fuera**: campo «Edad aproximada» del mockup (no existe en BD — candidato a item si se pide), campo «Tu nombre» en contacto (no se guarda hoy; el contacto es teléfono opt-in + mensajería interna), stepper multipaso.

### Documentación a consultar

- [DESIGN](../../technical/DESIGN.md), skill `adoptia-frontend` (formularios), `adoptia-testing`. Lección FEATURE-022: sin `max` nativo en la fecha.

### Seguridad

- Sin superficie nueva: mismas validaciones cliente + RLS/checks de BD. El drag&drop filtra por `esImagen` igual que el input.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios.

### Frontend

- `NuevoAvisoForm.tsx`: reagrupar los fieldsets en tarjetas (`rounded-2xl border bg-card p-5` + título con icono); tarjetas grandes de tipo con icono (lupa / mano); dropzone con `onDrop`/`onDragOver` que reutiliza el mismo handler del input; pie con enlace «Cancelar y volver» a `/perdidos-encontrados` + submit.
- `nuevo/page.tsx`: título centrado según mockup.
- Textos en `messages/es.json` (`perdidos.fSeccion*`, `perdidos.fCancelar`, `perdidos.fFotosArrastra`).

### Tareas TDD

1. `NuevoAvisoForm.test.tsx`: soltar ficheros en la dropzone añade fotos (filtra no-imágenes y respeta el límite de 6), equivalente al input.
2. Selector de tipo como tarjetas: sigue siendo radiogroup accesible y publica el `type` correcto.
3. «Cancelar y volver» lleva al listado sin publicar.
4. Los 15 tests actuales del alta siguen en verde (validaciones, multi-foto, errores, no publicar a medias).

### Dependencias

- FEATURE-024 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Todas las secciones del mockup presentes como tarjetas, en el orden del mockup.
- [x] El alta sigue completándose en <2 min: cero campos nuevos obligatorios.
- [x] Dropzone: clic y arrastrar funcionan; no-imágenes se ignoran; límite 6 se respeta.
- [x] Radios de tipo accesibles (teclado + lector) aunque se pinten como tarjetas.
- [x] Validaciones y mensajes de error idénticos a hoy (teléfono, fecha futura, pin, descripción).
- [x] «Cancelar y volver» no publica nada.
- [x] Cero literales.

## Cierre (2026-07-16)

- Formulario reagrupado en tarjetas: «¿Qué quieres reportar?» (tarjetas grandes con icono y subtítulo; los radios siguen siendo accesibles vía `aria-labelledby`/`aria-describedby` para que el nombre accesible no arrastre el subtítulo), «Información del animal» (incluye las señas de FEATURE-023 — el fieldset «¿Cómo es?» desaparece y su clave `comoEs` se retira), «Fotos» (dropzone clic + arrastre con `agregarFotos` compartido con el input: mismo filtro `esImagen` y límite 6), «Ubicación» (ciudad + pin), «Descripción y detalles» (descripción + fecha del suceso) y «Información de contacto». Pie con «Cancelar y volver» + «Publicar aviso».
- Ninguna validación ni campo cambió: los 15 tests previos del alta pasaron sin tocarlos; 3 nuevos (dropzone, cancelar, radios accesibles).
- Fuera, según alcance: «Edad aproximada» y «Tu nombre» del mockup (no existen en BD ni en el flujo de contacto).

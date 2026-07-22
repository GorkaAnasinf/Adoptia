# Rediseño de "Solicitudes recibidas" — Diseño

**Fecha:** 2026-07-22
**Ficheros:** `src/components/panel/SolicitudesPanel.tsx`, `src/app/(shelter)/panel/solicitudes/page.tsx`, `messages/es.json`, tests.
**Guías aplicadas:** `FormSection` (icono+título+ayuda), cards `rounded-2xl … shadow-soft`, `AnimalStatusBadge`, `Reveal`, chips de estado, `max-w-6xl`, hover.

## Objetivo

Mejorar la vista maestra/detalle de solicitudes de adopción del panel siguiendo el
lenguaje de diseño ya asentado: lista con miniatura del animal y avatar de iniciales,
cuestionario en secciones con valores **humanizados**, mensaje y notas en tarjetas,
acciones destacadas, y efectos (`Reveal`, hover). Sin cambios de modelo/RLS.

## Componentes

### Página `solicitudes/page.tsx`

- Igual salvo: la query admin de `adoption_requests` añade la **portada** del animal
  (`animals(..., animal_media(url,is_cover,sort_order))`), y `SolicitudRow.animal` gana
  `cover: string | null`. El resto (bypass admin acotado, mapeo de nombres) sin cambios.

### `SolicitudesPanel.tsx` (client)

**Maestra (izquierda, `20rem`):**
- Agrupada por animal (se mantiene). Cada grupo es una **tarjeta** con **miniatura** del
  animal + nombre + nº de solicitudes.
- Filas: **avatar de iniciales** del adoptante + nombre + fecha + chip de estado; hover;
  fila **seleccionada** resaltada (`aria-current`).
- La `<ul>` conserva `aria-label={t("title")}` (el test la localiza por /solicitudes/i).
- Cada grupo envuelto en `Reveal` (escalonado).

**Detalle (derecha):**
- **Cabecera**: nombre del adoptante + "Enviada el…" + chip de estado + referencia al
  animal (miniatura + nombre).
- **Cuestionario** en 3 secciones `FormSection` (en vez de la tabla `dl`):
  - 🏠 Vivienda: `vivienda`, `regimen`, `permiten_animales`.
  - 👪 Convivencia: `convivientes`, `ninos_edades`, `otros_animales`, `todos_de_acuerdo`.
  - 🎓 Experiencia y disponibilidad: `experiencia`, `horas_solo`.
  - Cada campo: etiqueta (mudo) + valor (fuerte). **Valores humanizados**: `vivienda`→
    `solicitud.viviendaPiso/CasaJardin/Otro`; `regimen`→`solicitud.regimenPropiedad/Alquiler`;
    booleanos→`yes/no`; arrays vacíos/"" → "—"; números y texto tal cual.
- **Mensaje** del adoptante: tarjeta cita (se mantiene el estilo `bg-primary/5`).
- **Notas internas**: textarea + botón "Guardar notas"; feedback "Guardado" tras éxito.
- **Acciones**: aprobar / rechazar (con motivo) / completar — **misma lógica y mismos
  textos de botón** (`approve`, `reject`, `confirmReject`, `complete`, etc.), reestilados
  como botones destacados. Se conserva `fetch(/api/solicitudes/[id])` + `router.refresh()`.
- **Estado vacío** (sin selección): placeholder cuidado con icono; conserva el texto
  `selectPrompt` (el test lo localiza por /selecciona una solicitud/i).

## i18n

- Reutiliza `solicitud.viviendaPiso/viviendaCasaJardin/viviendaOtro`,
  `solicitud.regimenPropiedad/regimenAlquiler` para humanizar.
- Nuevas claves en `solicitudesPanel`: `sectionVivienda` ("Vivienda"),
  `sectionConvivencia` ("Convivencia"), `sectionExperiencia` ("Experiencia y
  disponibilidad"). Se mantienen las `q*`, `status*`, `approve`, etc.

## Invariantes de test a preservar

- La `<ul>` maestra tiene nombre accesible que casa con /solicitudes/i.
- Se ven los nombres de animal y de adoptantes en la lista.
- Sin selección: texto que casa con /selecciona una solicitud/i.
- Al seleccionar: se ven el mensaje y el valor de `experiencia` como texto.
- Botones aprobar/rechazar/confirmar rechazo/guardar notas con los mismos textos y
  la misma lógica (`approve` / `reject`+motivo / `note`+nota / `complete`).

## Tests

- `SolicitudesPanel.test.tsx`: se mantienen los casos actuales (deben seguir verdes con
  el rediseño). Añadir: al seleccionar, el valor humanizado de vivienda aparece
  ("Piso"), y las secciones del cuestionario se renderizan (títulos de sección).

## Fuera de alcance

- Cambios de modelo, RLS o del flujo de acciones (aprobar/rechazar/completar).
- Avatares reales de `profiles` (se usan iniciales, sin foto).
- Paginación / búsqueda de solicitudes.

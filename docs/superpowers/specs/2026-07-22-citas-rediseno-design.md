# Rediseño de "Citas" de la protectora — Diseño

**Fecha:** 2026-07-22
**Fuente:** wireframe `assets/wireframes/protectorascitas/` (Stitch).
**Base de coherencia:** panel ya rediseñado (cards, Reveal, hover, chips, FormSection).
**Ficheros:** `src/app/(shelter)/panel/citas/page.tsx`, nuevos
`src/components/citas/CitasCliente.tsx`, `src/components/citas/CalendarioCitas.tsx`,
`messages/es.json`, tests.

## Objetivo

Rediseñar `/panel/citas` según el wireframe (tarjetas con foto, pestañas Próximas/Pasadas
y lateral con calendario + resumen), respetando el flujo y las acciones reales. Sin
cambios de modelo/RLS.

## Realidad vs wireframe (decidido)

- **Acciones reales** de la protectora sobre una cita activa: **Realizada · No-show ·
  Cancelar** (`CitaAccionesPanel` + `CancelarCitaButton`, ya existentes). Se **descartan**
  del wireframe "Editar cita" (no hay reprogramación) y "Ver perfil adoptante" (no hay
  vista de adoptante para la protectora).
- Las citas las crea el **adoptante**, no la protectora → el botón "Nueva Cita" se
  sustituye por **"Gestionar disponibilidad"** → `/panel/agenda` (reutiliza
  `disponibilidadTitle`).
- **Sin modalidad** ("Visita al refugio"/"Videollamada"): no hay campo en `appointments`.
- **Calendario**: sí, versión **estática** (mes actual, hoy resaltado, punto en los días
  con citas; sin navegación de meses ni filtrado al pulsar).

## Componentes

### Página `citas/page.tsx` (server)

- Carga las citas de la protectora (como ahora) **añadiendo la portada del animal**:
  `adoption_requests(animals(name, slug, animal_media(url, is_cover, sort_order)))`.
  `adopterName` vía el bypass admin acotado ya existente.
- Deriva:
  - `proximas` = activas (pending/confirmed) con `starts_at >= ahora`, ascendente.
  - `pasadas` = el resto (canceladas/realizadas/no-show o ya pasadas), descendente.
  - **Resumen semanal**: `citasEstaSemana` (activas con `starts_at` en la semana ISO
    actual, Europe/Madrid), `nuevasSolicitudes` (count de `adoption_requests` `pending`),
    `tasaAsistencia` = `done / (done + no_show)` en % (null si no hay historial).
  - **Calendario**: año/mes actuales, día de hoy y `Set<number>` de días del mes actual
    con alguna cita (Europe/Madrid).
- Estado vacío (sin citas): tarjeta con CTA (se mantiene `agendaEmpty`).
- Renderiza `<CitasCliente proximas pasadas />` + lateral (`<CalendarioCitas …/>`,
  Resumen Semanal, tarjeta de consejo con "Ver Recursos" → `/guias`).
- Layout `max-w-6xl` con `lg:grid-cols-[1fr_20rem]` (contenido + lateral).

### `CitasCliente.tsx` (client)

- **Pestañas** Próximas / Pasadas (estado local; por defecto Próximas).
- **Tarjeta de cita** (horizontal en `sm+`, apilada en móvil): foto del animal
  (`aspect` con placeholder `PawPrint`), título **"Cita para conocer a {animal}"**, chip
  de estado, "Con: {adoptante}" con **avatar de iniciales**, línea de fecha/hora
  (**Hoy/Mañana** o fecha corta + hora, iconos `Clock`), y acciones:
  - Próximas (activas): `CitaAccionesPanel` (Realizada/No-show/Cancelar).
  - Pasadas: solo lectura (chip de estado + `cancel_reason` si existe).
- El nombre del animal enlaza a su ficha pública (`/animales/[slug]`).
- `Reveal` escalonado + hover en las tarjetas.
- Vacío por pestaña: mensaje (`dashboardEmpty` para próximas; `sinPasadas` para pasadas).

### `CalendarioCitas.tsx` (presentacional, server-compatible)

- Rejilla del mes actual (L–D), cabecera "MES AAAA", **hoy** con círculo primario,
  **punto** bajo los días con citas. Sin navegación ni interacción. Nombres de mes/día
  vía `Intl.DateTimeFormat("es-ES", …)`.

## i18n (nuevas claves en `citas`)

- `pasadas` ("Pasadas"), `sinPasadas` ("No hay citas pasadas."),
  `cardTitle` ("Cita para conocer a {nombre}"), `hoy` ("Hoy"), `manana` ("Mañana").
- `resumenTitle` ("Resumen semanal"), `resumenSemana` ("Citas esta semana"),
  `resumenSolicitudes` ("Nuevas solicitudes"), `resumenAsistencia` ("Tasa de asistencia").
- `consejoTexto` (texto del consejo), `verRecursos` ("Ver recursos").
- Reutiliza: `agendaTitle`, `agendaSubtitle`, `agendaEmpty`, `proximas`, `conQuien`,
  `estado*`, `marcarRealizada`, `marcarNoShow`, `disponibilidadTitle`, `dashboardEmpty`.

## Invariantes de test a preservar / actualizar

- Enlace "Gestionar disponibilidad" → `/panel/agenda` (nombre `disponibilidadTitle`).
- Estado vacío con `agendaEmpty`.
- El test de página actual se **reescribe** para la estructura de pestañas: comprueba
  cabecera, enlace de disponibilidad, que la pestaña Próximas muestra la cita activa con
  el botón `marcarRealizada`, y el resumen semanal. El cambio de pestaña Pasadas y su
  contenido se prueba en `CitasCliente.test.tsx` (con `userEvent`).

## Tests

- `CitasCliente.test.tsx`: pestaña Próximas muestra la cita activa + acciones; al cambiar
  a Pasadas se ve la cita pasada con su chip; el título usa "Cita para conocer a {animal}".
- `CalendarioCitas.test.tsx`: marca hoy y pinta punto en los días con citas.
- `citas/page.test.tsx`: reescrito (cabecera, disponibilidad, cita próxima con acción,
  resumen semanal, estado vacío).

## Fuera de alcance

- Reprogramar/editar citas; vista de perfil/contacto del adoptante; creación de citas
  por la protectora; modalidad; navegación de meses en el calendario; paginación real
  ("Cargar más").

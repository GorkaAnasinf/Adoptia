---
id: FEATURE-051
tipo: feature
titulo: Rediseño de "Citas" de la protectora (wireframe Stitch)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

> **Cierre (2026-07-22):** hecho en `feature/FEATURE-051-citas-rediseno`. La agenda de
> citas del panel (`/panel/citas`) se rehace según el wireframe de Stitch, con el flujo y
> las acciones reales. **Pestañas Próximas/Pasadas** con **tarjetas** (foto del animal,
> título «Cita para conocer a {animal}», chip de estado, adoptante con avatar de
> iniciales, fecha/hora Hoy/Mañana). En las próximas, las **acciones reales**
> (Realizada/No-show/Cancelar vía `CitaAccionesPanel`); las pasadas, solo lectura.
> **Lateral** con **mini-calendario** del mes (hoy resaltado + punto en los días con
> citas), **Resumen semanal** (citas esta semana, nuevas solicitudes, tasa de asistencia)
> y una **tarjeta de consejo** con «Ver recursos» → `/guias`. Se descartan del wireframe
> «Nueva cita» (las crea el adoptante; el botón lleva a la agenda de disponibilidad),
> «Editar cita» y «Ver perfil adoptante» (sin soporte) y la modalidad (sin campo). `Reveal`
> + hover; fechas y semana en Europe/Madrid. Sin cambios de modelo/RLS. QA: suite 1067
> verde, typecheck y lint limpios. **Pendiente:** despliegue.

# FEATURE-051 — Rediseño de "Citas" de la protectora

## Descripción

Rediseñar `/panel/citas` según el wireframe (`assets/wireframes/protectorascitas/`):
tarjetas con foto, pestañas Próximas/Pasadas y lateral con calendario + resumen, con las
acciones reales de la protectora.

## Contexto / impacto

Afecta a la protectora. La agenda era una lista fría; el rediseño la hace visual y
coherente con el panel, y da contexto (calendario, resumen semanal).

## Plan de desarrollo

### Frontend

- **`CalendarioCitas`** (presentacional): mes actual, hoy resaltado, punto en días con
  citas.
- **`CitasCliente`** (client): pestañas Próximas/Pasadas; tarjeta con foto + estado +
  adoptante (iniciales) + Hoy/Mañana + acciones reales (`CitaAccionesPanel`) en activas;
  `Reveal` + hover.
- **`citas/page.tsx`**: deriva próximas/pasadas, resumen semanal (semana ISO Madrid),
  días con citas del mes; añade la portada del animal a la query; lateral con calendario,
  resumen y consejo (→ `/guias`). Botón de cabecera → agenda de disponibilidad.

### Seguridad / Modelo

- **Sin cambios.** Mismo bypass admin acotado para nombres; cuenta de solicitudes
  pendientes con el cliente de sesión.

### Descartado del wireframe

- «Nueva cita» (las crea el adoptante), «Editar cita»/«Ver perfil adoptante» (sin
  soporte), modalidad (sin campo), navegación de meses y «Cargar más».

### Tareas TDD

1. `CalendarioCitas.test.tsx`: hoy resaltado + puntos en días con citas.
2. `CitasCliente.test.tsx`: Próximas con acciones; cambio a Pasadas sin acciones.
3. `citas/page.test.tsx`: reescrito (cabecera, disponibilidad, cita próxima + resumen,
   vacío).

## Criterios de aceptación / Casuística a cubrir

- [x] Pestañas Próximas/Pasadas con tarjetas (foto, estado, adoptante, hora).
- [x] Acciones reales en próximas; pasadas de solo lectura.
- [x] Lateral con calendario del mes, resumen semanal y consejo.
- [x] Botón de cabecera a la agenda de disponibilidad. Sin cambios de modelo/RLS.

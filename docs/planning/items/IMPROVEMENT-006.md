---
id: IMPROVEMENT-006
tipo: improvement
titulo: Completar el sidebar del adoptante con sus secciones (deshabilitadas)
estado: hecho
prioridad: baja
hito: "0.2"
duplicado_de: null
creado: 2026-07-07
actualizado: 2026-07-07
---

# IMPROVEMENT-006 — Sidebar del adoptante completo

## Descripción

El sidebar del adoptante solo tenía "Mi cuenta". Se añaden las secciones de su área personal
(Stitch §1.6) **deshabilitadas** hasta que se desarrollen, para reflejar la arquitectura de
información completa desde ya (igual que el de protectora, que ya se enciende por `exists`).

## Plan de desarrollo

### Frontend

- `AppSidebar` — `NAV.adopter` pasa de 1 a 5 ítems: Mi cuenta (activo) + Mis solicitudes,
  Favoritos, Mis citas, Mis alertas (sin `exists` → deshabilitados hasta [[FEATURE-010]]).
- i18n: `navMyRequests`, `navFavorites`, `navMyAppointments`, `navMyAlerts`.

### Tareas TDD

1. `AppSidebar` (adopter): Mi cuenta enlazado; las 4 secciones futuras presentes y
   `aria-disabled`. ✅

### Dependencias

- Las secciones se **encienden** con [[FEATURE-010]] (área personal del adoptante).

## Criterios de aceptación

- [x] El adoptante ve las 5 entradas; solo "Mi cuenta" es navegable.
- [x] Las secciones futuras salen deshabilitadas (sin enlace), no ocultas.
- [x] Sin textos hardcodeados.

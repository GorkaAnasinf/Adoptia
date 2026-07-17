---
id: IMPROVEMENT-024
tipo: improvement
titulo: Pulido menor del perfil público de protectora (fallbacks del hero y de las tarjetas)
estado: hecho
prioridad: baja
hito: "0.5"
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# IMPROVEMENT-024 — Pulido menor del perfil público de protectora

<!-- ============ PLANO 1: CAPTURA (QA de FEATURE-028) ============ -->

## Descripción

Dos notas MENORES que Scooby aceptó al aprobar FEATURE-028:

1. El fallback del avatar del hero (icono de huella cuando la protectora no tiene logo) no tiene test directo que lo ejercite.
2. Las tarjetas del grid usan el fallback estándar de `AnimalCard` («Sin foto» en texto); el mockup pedía una huella. Decidir si se cambia `AnimalCard` (afectaría también a la búsqueda) o se da por bueno el estándar.

## Contexto / impacto

Cosmético y de robustez de tests. No bloquea nada; afecta solo a perfiles sin logo y animales sin foto.

## Plan de desarrollo

### Documentación a consultar

- Skills `adoptia-frontend` y `adoptia-testing` (ya cargadas en la sesión de FEATURE-028).

### Seguridad / Modelo de datos / API

- Sin cambios.

### Frontend

- **Decisión**: unificar con **huella** (`PawPrint`) también en `AnimalCard` — es lo que pedía el mockup y afecta en positivo al listado de búsqueda (icono en vez de texto suelto). El contenedor del fallback pasa a `role="img"` con `aria-label` («Sin foto»), que además lo hace testeable de forma accesible.
- El fallback del avatar del hero (`ShelterPublicProfile`) gana `role="img"` + `aria-label` con el nombre de la protectora, y con ello su test directo.

### Tareas TDD

1. Test: sin logo, el hero expone la huella como imagen accesible con el nombre → implementación (`role="img"` en el span del fallback).
2. Test: sin foto, la tarjeta expone huella accesible «Sin foto» (se actualiza el test que buscaba el texto) → implementación en `AnimalCard`.
3. Suite completa + lint + tsc.

### Dependencias

- FEATURE-028 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Hero sin logo: huella visible y accesible (`role="img"`, nombre de la protectora); con logo, se muestra el logo como hasta ahora.
- [x] Tarjeta sin foto: huella accesible «Sin foto» (en el perfil de protectora y en la búsqueda, que comparten `AnimalCard`); con foto válida, la foto.
- [x] Suite completa verde (976/976, RLS incluidos), lint y `tsc` limpios; sin textos hardcodeados (el `aria-label` sale de `es.json`).

## Cierre (2026-07-17)

- Decisión tomada: huella también en `AnimalCard` (mockup manda; mejora también el listado de búsqueda). El texto «Sin foto» pasa de visible a `aria-label`, así que no se pierde para lectores de pantalla.
- QA: 3/3 criterios con test. Cobertura estable (82,0 % / 96,7 % `src/lib`).

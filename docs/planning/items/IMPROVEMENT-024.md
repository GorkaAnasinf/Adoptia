---
id: IMPROVEMENT-024
tipo: improvement
titulo: Pulido menor del perfil público de protectora (fallbacks del hero y de las tarjetas)
estado: recibido
prioridad: baja
hito: null
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

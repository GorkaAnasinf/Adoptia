---
id: FEATURE-013
tipo: feature
titulo: Apadrinamiento y donaciones
estado: hecho
prioridad: baja
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-11
---

# FEATURE-013 — Apadrinamiento y donaciones

## Descripción

Los animales difíciles de adoptar (mayores, enfermedades crónicas) pueden apadrinarse con aportación mensual; las protectoras pueden recibir donaciones puntuales. Primera iteración con enlaces externos (Stripe Payment Link / Teaming) — sin pasarela integrada. (Ref: U13)

## Contexto / impacto

Vía de sostenibilidad para las protectoras (y futura para la plataforma). El apadrinamiento da salida digna a animales que nunca aparecerán en búsquedas de adopción.

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`sponsorships`), [DECISIONS](../../technical/DECISIONS.md) (coste 0: sin Stripe integrado aún)

### Seguridad

- Los enlaces de pago son de la protectora (validar dominio permitido: stripe.com, teaming.net); Adoptia NO procesa dinero — dejarlo claro legalmente.

### Modelo de datos

- Activar `sponsorships` (registro informativo, no transaccional).

### API

- Sin pasarela; solo registro de intención para métricas.

### Frontend

- Badge "Apadrinable" en ficha + sección con historia y botón al enlace externo; bloque de donaciones en perfil de protectora.

### Tareas TDD

1. Test validación de dominios de enlaces de pago.
2. Test: solo protectora marca animal como apadrinable con enlace.
3. Test aviso legal visible antes de salir a enlace externo.

### Dependencias

- FEATURE-003, FEATURE-004.

## Criterios de aceptación / Casuística a cubrir

- [x] Enlace de pago con dominio no permitido → rechazado al guardar (triple capa: zod en formularios, `es_enlace_pago_valido` como CHECK en BD probado por RLS test; dominios: buy/checkout.stripe.com, teaming.net, paypal.com/paypal.me, solo https).
- [x] Al pulsar "Apadrinar" (y "Donar"): aviso claro de que el pago es directo con la protectora ANTES de abrir el enlace (componente `EnlaceExternoPago`, probado).
- [x] Animales apadrinables destacados en la ficha de la protectora (ordenados primero + badge "Apadrinable"; badge y sección con historia también en la ficha del animal).

## Cierre (2026-07-11)

- **BD**: `animals.sponsorable/sponsor_link/sponsor_note` y `shelters.donation_link` con CHECK de dominio; apadrinable exige enlace; tabla `sponsorships` (registro informativo de clics, sin datos personales, legible solo por la protectora dueña y admin).
- **Formularios**: sección "Apadrinamiento" en la ficha del panel (checkbox + enlace + historia) y "Enlace de donaciones" en el editor de perfil, ambos con validación y ayuda de dominios.
- **Público**: sección de apadrinamiento en la ficha del animal y bloque de donaciones en el perfil de la protectora, siempre con el aviso legal previo; la intención de apadrinar se registra vía `POST /api/apadrinar/[animalId]` (best-effort, no bloquea).
- **Sin pasarela integrada** (coste 0): primera iteración con enlaces externos, tal y como pedía el item.
- **Tests**: 5 RLS (constraints + visibilidad de sponsorships), 12 de validación de dominios, 3 del aviso previo. Suite: 624.

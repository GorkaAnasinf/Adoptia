---
id: FEATURE-013
tipo: feature
titulo: Apadrinamiento y donaciones
estado: listo
prioridad: baja
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
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

- [ ] Enlace de pago con dominio no permitido → rechazado al guardar.
- [ ] Al pulsar "Apadrinar": aviso claro de que el pago es directo con la protectora.
- [ ] Animales apadrinables destacados en la ficha de la protectora.

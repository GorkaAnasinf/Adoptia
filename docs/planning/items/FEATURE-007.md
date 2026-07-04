---
id: FEATURE-007
tipo: feature
titulo: Solicitud "Me interesa" con cuestionario y bandeja de la protectora
estado: listo
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
---

# FEATURE-007 — Solicitud "Me interesa": cuestionario y bandeja

## Descripción

Un adoptante interesado rellena un cuestionario de pre-adopción en 4 pasos (vivienda, hogar, experiencia, motivación) y envía la solicitud; la protectora la recibe por email y la gestiona en su bandeja (ver respuestas, aprobar/rechazar con motivo, notas internas, marcar adoptado). (Ref: U7, P5 + cuestionario §4.4 de la biblia)

## Contexto / impacto

Corazón del producto: es el ahorro de trabajo real para las protectoras (el filtro que hoy hacen a mano) y el inicio de toda adopción.

## Plan de desarrollo

### Documentación a consultar

- [API_CONTRACTS](../../technical/API_CONTRACTS.md) (contrato POST /api/solicitudes), biblia §4.4 (preguntas), prompts Stitch §1.5 y §2.5, skills `adoptia-backend`, `adoptia-security`

### Seguridad

- Handler valida con Zod TODO el cuestionario en servidor; unique (animal, adoptante) → 409.
- RLS: solicitud visible solo para su adoptante y la protectora del animal.
- Anti-spam: rate limit por usuario, honeypot; no se aceptan solicitudes sobre animales no disponibles.
- El email a la protectora no incluye datos de contacto del adoptante hasta aprobar (minimización).

### Modelo de datos

- `adoption_requests` de baseline. Sin cambios.

### API

- `POST /api/solicitudes` y `PATCH /api/solicitudes/[id]` según contrato.

### Frontend

- Stepper 4 pasos (Stitch 1.5) con progreso, validación por paso, resumen final, consentimiento RGPD y pantalla de éxito.
- Bandeja dos paneles (Stitch 2.5): lista agrupada por animal, detalle con Q&A del cuestionario, mensaje destacado, notas internas, acciones.
- Emails react-email: "solicitud recibida" (protectora) y "solicitud aprobada/rechazada" (adoptante).

### Tareas TDD

1. Test Zod cuestionario: casos límite (alquiler sin permiso del casero → aviso, horas_solo 0-24).
2. Test handler: 201, 409 duplicada, 422 inválida, 403 animal no disponible.
3. Test RLS: otro adoptante no lee la solicitud; otra protectora tampoco.
4. Test PATCH: solo protectora dueña; rechazo exige motivo; email enviado (mock Resend).
5. Test "marcar adoptado": solicitudes restantes pasan a rechazadas con email amable.
6. E2E: flujo completo me-interesa → cuestionario → bandeja → aprobar.

### Dependencias

- FEATURE-001, FEATURE-003, FEATURE-005.

## Criterios de aceptación / Casuística a cubrir

- [ ] Stepper completable en móvil en <3 min; progreso no se pierde al retroceder.
- [ ] Sin sesión: "Me interesa" → login → vuelve al cuestionario del mismo animal.
- [ ] Segunda solicitud al mismo animal: aviso "ya la enviaste" con enlace a su estado.
- [ ] Animal reservado/adoptado durante el proceso: mensaje al enviar, sin crear solicitud.
- [ ] Protectora ve el cuestionario completo en formato pregunta/respuesta legible.
- [ ] Rechazo siempre con motivo; el adoptante recibe email respetuoso con sugerencias.
- [ ] Al marcar adoptado: todas las solicitudes pendientes se cierran con email + animales similares.
- [ ] Notas internas jamás visibles para el adoptante (RLS por columna o vista).

---
id: IMPROVEMENT-026
tipo: improvement
titulo: Sincronizar el estado del animal con su propuesta de acogida
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# IMPROVEMENT-026 — Sincronizar el estado del animal con su propuesta de acogida

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Marcar una propuesta de acogida como `aceptada` (FEATURE-029) no cambia el estado del animal: sigue «En adopción» aunque esté acogido, y el badge «En acogida» (que existe y funciona) nunca llega a mostrarse. Detectado por el usuario probando el flujo en real.

1. Propuesta con animal marcada `aceptada` → el animal pasa a `fostered`.
2. Propuesta que deja de estar `aceptada` (`finalizada` o `rechazada`) → el animal vuelve a `available` si sigue `fostered`.
3. Baja del acogedor con acogida aceptada (la propuesta cae en cascada) → el animal también vuelve a `available`.
4. Sin efecto si la propuesta no tiene animal o si el animal está en otro estado (`reserved`/`adopted` no se tocan).

## Contexto / impacto

Sin esto, la trazabilidad de FEATURE-029 queda coja: el panel dice «aceptada» pero el catálogo sigue ofreciendo al animal como disponible. Afecta a protectoras (estado incoherente) y adoptantes (pueden solicitar un animal que está acogido).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- Migración `20260717150000_feature029_foster_proposals.sql`; `ESTADOS` y transiciones en `src/lib/schemas/animal.ts` (`available→fostered` y `fostered→available` ya son válidas); skills `adoptia-database` y `adoptia-testing`.

### Seguridad

- **Trigger en BD, no en cliente** («la UI oculta, la BD garantiza»): función `security definer` que solo mueve `available→fostered` y `fostered→available`; imposible usarla para tocar animales ajenos porque solo la disparan cambios de la propia propuesta (cuyo update ya exige protectora dueña vía RLS).

### Modelo de datos

- Migración nueva: función + triggers `AFTER UPDATE` (status `aceptada` → animal a `fostered`; salir de `aceptada` → animal `fostered` a `available`) y `AFTER DELETE` (propuesta `aceptada` borrada — p. ej. baja del acogedor en cascada — → animal `fostered` a `available`) sobre `foster_proposals`.

### API / Frontend

- Sin cambios: el badge, el panel y la ficha ya muestran `fostered`.

### Tareas TDD

1. Test RLS/BD: aceptar propuesta con animal → animal `fostered`; finalizar → vuelve a `available`.
2. Test BD: borrar la propuesta aceptada (cascada de la baja del acogedor) → animal vuelve a `available`.
3. Test BD: animal `reserved` no se toca al aceptar; propuesta sin animal no rompe; rechazar desde `enviada` no altera nada.
4. Suite completa + lint + `tsc`.

### Dependencias

- FEATURE-029 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Aceptar propuesta con animal disponible → animal «En acogida» (badge visible en ficha y panel).
- [x] Finalizar (o rechazar tras aceptar) → animal vuelve a «En adopción» solo si seguía `fostered`.
- [x] Baja del acogedor con acogida aceptada → animal vuelve a `available` (trigger de delete).
- [x] Animal `reserved`/`adopted` o propuesta sin animal: sin efecto alguno.
- [x] Todo probado contra Postgres real (tests RLS); suite completa verde, lint y `tsc` limpios.

## Cierre (2026-07-17)

- Migración `20260717180000`: función `sync_animal_estado_acogida` (security definer, sin execute para roles de cliente) + trigger `AFTER UPDATE OF status OR DELETE` en `foster_proposals`. Solo mueve `available↔fostered`, así que reservados/adoptados jamás se pisan y las transiciones siguen el mapa de `ESTADOS` del esquema.
- 4 tests contra Postgres real. Lección de higiene: la BD local persiste entre ejecuciones — las fixtures van en Zaragoza (lejos del cluster de Bilbao de FEATURE-016) y se limpian en `afterAll`, porque un acogedor zombi rompía 3 tests de `acogida.test.ts`.
- QA Scooby 5/5. Suite 1013/1013 con RLS, lint y `tsc` limpios, cobertura 82,4 % / 96,7 % `src/lib`. Sin cambios de UI: el badge «En acogida» ya existía; ahora por fin se enciende solo.
- **Producción (2026-07-17)**: migración aplicada con dry-run previo y confirmada (`migration list --linked`); release `334f210` desplegado en Vercel (READY).

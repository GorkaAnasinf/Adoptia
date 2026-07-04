---
id: FEATURE-016
tipo: feature
titulo: Registro de casas de acogida
estado: listo
prioridad: baja
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
---

# FEATURE-016 — Registro de casas de acogida

## Descripción

Personas dispuestas a acoger temporalmente se registran indicando su zona y condiciones (tipo de vivienda, especies, disponibilidad). Cada protectora ve los acogedores interesados de su zona y puede contactarlos. (Ref: P11)

## Contexto / impacto

Las casas de acogida son una necesidad constante de las protectoras (cachorros, postoperatorios, saturación). Hoy se buscan a gritos en redes.

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md), FEATURE-006 (patrones de proximidad), skill `adoptia-database`

### Seguridad

- Datos del acogedor visibles SOLO para protectoras verificadas de su zona (RLS con distancia); contacto inicial vía plataforma, no email expuesto.
- Consentimiento explícito del acogedor para ser contactado.

### Modelo de datos

- Nueva `foster_homes`: user_id, location (redondeada en lecturas), radius_km, condiciones jsonb, active.

### API

- RPC `foster_homes_nearby(shelter_id)`; handler de primer contacto con notificación.

### Frontend

- Formulario "Quiero acoger" (público, requiere cuenta); lista de acogedores en panel de protectora con filtros.

### Tareas TDD

1. Test RLS: solo protectoras verificadas ven acogedores, y solo de su radio.
2. Test contacto: acogedor recibe notificación con datos de la protectora, no al revés.
3. Test baja del acogedor: desaparece de todas las listas.

### Dependencias

- FEATURE-006, FEATURE-011.

## Criterios de aceptación / Casuística a cubrir

- [ ] Alta de acogedor en <2 min con consentimiento explícito.
- [ ] La protectora ve zona aproximada y condiciones, nunca dirección exacta.
- [ ] Acogedor puede pausarse (vacaciones) y darse de baja con supresión de datos.

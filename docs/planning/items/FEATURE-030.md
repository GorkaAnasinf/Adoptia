---
id: FEATURE-030
tipo: feature
titulo: Relevo de acogida (emergencias del acogedor)
estado: recibido
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# FEATURE-030 — Relevo de acogida (emergencias del acogedor)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Una casa de acogida con animales acogidos puede necesitar dejar de acogerlos temporalmente (inundación, obras en casa, hospitalización…). El animal es de la protectora: el acogedor no lo recoloca por su cuenta, **avisa** y la protectora gestiona el relevo.

1. El acogedor con acogida activa marca «Necesito relevo» desde `/acogida`, indicando motivo y fecha límite.
2. La protectora recibe el aviso; en su panel la acogida pasa a estado `relevo_pedido`.
3. La protectora propone la acogida a otros acogedores de la zona reutilizando el flujo de propuestas (FEATURE-029).
4. Al aceptarse el relevo, la acogida original pasa a `finalizada` y se abre la nueva: el historial refleja la cadena completa.

## Contexto / impacto

Sin este mecanismo, el acogedor en apuros resuelve por WhatsApp o abandona la acogida sin rastro, y la protectora pierde el control del animal justo en el peor momento. Da red de seguridad al acogedor (acoger no es una trampa) y trazabilidad continua a la protectora.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_(pendiente de promover — lo completa Snoopy)_

## Criterios de aceptación / Casuística a cubrir

- [ ] Acogedor con acogida activa puede pedir relevo (motivo + fecha límite); sin acogida activa, la opción no existe.
- [ ] La protectora recibe aviso (email + estado visible en su panel) y puede lanzar propuestas de relevo a otros acogedores de su zona.
- [ ] Cerrado el relevo, la acogida original queda `finalizada` y la nueva `aceptada`; el historial conserva la cadena.
- [ ] Cancelación: el acogedor puede retirar la petición de relevo si su situación se resuelve.
- [ ] RLS: solo protectora y acogedor implicados ven la petición.

### Dependencias

- FEATURE-029 (propuestas de acogida con trazabilidad) debe estar `hecho`.

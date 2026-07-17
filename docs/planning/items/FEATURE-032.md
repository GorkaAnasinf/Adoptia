---
id: FEATURE-032
tipo: feature
titulo: Ofertas de donación de particulares (material para protectoras)
estado: recibido
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# FEATURE-032 — Ofertas de donación de particulares

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Caso típico: a una persona se le muere su animal y quiere donar sus cosas (comida sin abrir, transportín, camas, juguetes) a una protectora. Se pide:

1. El usuario publica una oferta de donación: categoría, descripción, ciudad + pin redondeado y radio — espejo del patrón de privacidad de `foster_homes` (FEATURE-016).
2. Las protectoras verificadas de la zona ven las ofertas en su panel (RPC de proximidad tipo `foster_homes_nearby`) y contactan → el email va AL DONANTE con los datos de la protectora, nunca al revés.
3. La oferta se marca `entregada` al concretarse, y caduca automáticamente pasado un plazo (evitar tablón zombie).

## Contexto / impacto

Momento emocionalmente delicado (duelo) con voluntad real de ayudar que hoy se pierde o acaba en la basura. Complementa a FEATURE-031: allí la protectora pide, aquí el particular ofrece. Reutiliza en bloque los patrones de privacidad, proximidad y contacto ya probados en acogidas.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_(pendiente de promover — lo completa Snoopy)_

## Criterios de aceptación / Casuística a cubrir

- [ ] Alta de oferta con cuenta: categoría, descripción, zona con pin redondeado (~200 m) y radio; sin exponer dirección exacta jamás.
- [ ] Solo protectoras verificadas de la zona ven la oferta (RPC con radio; probado permitido/denegado como en acogidas).
- [ ] Contacto: email al donante con datos de la protectora, nunca al revés; rate-limit por protectora.
- [ ] Donante puede editar, marcar `entregada` o borrar su oferta (borrado real).
- [ ] Caducidad automática pasado el plazo (definir en plan técnico) con posibilidad de renovar.
- [ ] RLS probada: dueño gestiona lo suyo; protectoras solo leen vía RPC; terceros nada.

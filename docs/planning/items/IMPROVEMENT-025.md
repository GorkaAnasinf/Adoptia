---
id: IMPROVEMENT-025
tipo: improvement
titulo: Acogidas visibles en la navegación del usuario
estado: recibido
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# IMPROVEMENT-025 — Acogidas visibles en la navegación del usuario

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Hoy la página `/acogida` (alta y gestión de casas de acogida, FEATURE-016) solo está enlazada en el footer y el sitemap: un usuario que quiere acoger no la encuentra. Se pide:

1. Entrada «Acogidas» en el menú de usuario / sidebar que lleve a `/acogida`.
2. Si el usuario ya está registrado como acogedor: acceso directo a gestionar (editar condiciones, pausar, darse de baja) con su estado visible («Disponible para acoger» / «Pausado»). La gestión ya existe en `/acogida`; el problema es de descubribilidad, no de funcionalidad.
3. Si no está registrado: CTA «Hazte casa de acogida».

Solo UI + i18n; sin cambios de BD ni API.

## Contexto / impacto

Las casas de acogida son una necesidad constante de las protectoras, pero el registro de acogedores apenas recibe altas porque la puerta de entrada está escondida. Afecta a adoptantes/usuarios (no encuentran cómo ofrecerse) y a protectoras (menos acogedores disponibles en su zona).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_(pendiente de promover — lo completa Snoopy)_

## Criterios de aceptación / Casuística a cubrir

- [ ] Usuario autenticado ve la entrada «Acogidas» en su navegación (menú de usuario / sidebar) y llega a `/acogida` en un clic.
- [ ] Con registro de acogedor activo o pausado, la entrada refleja el estado y da acceso a editar / pausar / baja.
- [ ] Sin registro, la entrada muestra el CTA de alta.
- [ ] Textos en `messages/es.json`; sin hardcodeos.

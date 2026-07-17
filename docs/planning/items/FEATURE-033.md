---
id: FEATURE-033
tipo: feature
titulo: Alertas de búsqueda guardada (avisos de nuevos animales)
estado: recibido
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# FEATURE-033 — Alertas de búsqueda guardada

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Un adoptante busca hoy y no encuentra; vuelve (o no) dentro de un mes. Se pide:

1. El usuario guarda su búsqueda (especie, tamaño, edad, zona/radio…) con un nombre.
2. Cuando una protectora publica un animal que encaja, el usuario recibe un email con el animal y enlace a la ficha.
3. Gestión de alertas: listar, editar, desactivar, borrar; baja de avisos en un clic desde el propio email.

## Contexto / impacto

Motor de retención: convierte visitas puntuales en usuarios recurrentes y acerca a las protectoras adoptantes ya filtrados por sus preferencias. Reduce el tiempo de estancia de los animales publicados. Coste 0 (emails vía Resend ya integrado; evaluación de matching en publicación o cron existente).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_(pendiente de promover — lo completa Snoopy)_

## Criterios de aceptación / Casuística a cubrir

- [ ] Usuario autenticado guarda/edita/desactiva/borra alertas; límite de alertas por usuario (anti-abuso).
- [ ] Animal nuevo que encaja dispara email (agrupado si hay varios; sin duplicados por animal+alerta).
- [ ] Baja en un clic desde el email (enlace firmado, sin login).
- [ ] Animal despublicado o adoptado no dispara ni aparece en emails pendientes.
- [ ] RLS probada: cada usuario solo ve/gestiona sus alertas.
- [ ] Textos en `messages/es.json`; email con plantilla propia.

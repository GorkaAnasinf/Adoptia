---
id: IMPROVEMENT-001
tipo: improvement
titulo: De-duplicar el slug de protectora (nombres repetidos)
estado: recibido
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-06
actualizado: 2026-07-06
---

# IMPROVEMENT-001 — De-duplicar el slug de protectora (nombres repetidos)

## Descripción

El `slug` de una protectora se deriva de su nombre (`slugify(name)`) y la columna `shelters.slug` tiene una restricción `unique` global. Dos protectoras con el mismo nombre (p. ej. dos "Refugio Esperanza") chocan con `unique_violation` al guardar el alta, aunque su CIF y email de entidad sean distintos y válidos. Hoy el wizard muestra el aviso de "CIF o email ya registrado" (mensaje engañoso: el conflicto real es el nombre/slug).

## Contexto / impacto

Detectado durante el QA de [[FEATURE-002]] (al hacer el E2E determinista salió el choque de slug). No es un fallo de FEATURE-002 —sus criterios solo exigen CIF/email únicos— pero es una fricción real: nombres de protectora repetidos son plausibles en España, y el alta se bloquea con un mensaje que no corresponde. Afecta a la conversión de altas de protectora.

## Propuesta (a afinar por Snoopy)

- Generar el slug con **sufijo incremental** cuando ya exista: `refugio-esperanza`, `refugio-esperanza-2`, `refugio-esperanza-3`… (o sufijo corto aleatorio).
- Decidir dónde: en el cliente al construir el `row`, o —mejor— de forma atómica en servidor/BD para evitar carreras (dos altas simultáneas con el mismo nombre).
- Diferenciar en el wizard el error de slug del error de CIF/email para no mostrar un aviso engañoso si aún así colisiona.

## Criterios de aceptación / Casuística a cubrir

- [ ] Dos protectoras con el mismo nombre pueden completar el alta; sus slugs son distintos y estables.
- [ ] La generación de slug es resistente a carreras (dos altas concurrentes con el mismo nombre no fallan ni colisionan).
- [ ] El slug resultante sigue siendo válido para URL (sin acentos, minúsculas, guiones).
- [ ] Si por cualquier motivo persiste un choque, el aviso al usuario es específico (no "CIF/email duplicado").

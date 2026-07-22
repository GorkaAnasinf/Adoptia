---
id: FEATURE-052
tipo: mejora
titulo: Botón "Ver recursos" con el estilo primario relleno
estado: hecho
prioridad: baja
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

> **Cierre (2026-07-22):** hecho en `feature/FEATURE-052-ver-recursos-boton`. El botón
> «Ver recursos» de la tarjeta de consejo (agenda de citas) pasa del estilo teal
> (`bg-tertiary`) al **primario relleno** (granate `bg-primary`, texto blanco,
> `rounded-xl`), igual que los botones de acción principal del panel («Nueva ficha»). Solo
> estilo; sin cambios de lógica. QA: tsc, lint y test de la página verdes.

# FEATURE-052 — Botón "Ver recursos" con estilo primario

## Descripción

Ajuste visual pedido: que el botón «Ver recursos» de la vista de citas use el estilo del
botón primario relleno del panel (granate + blanco + esquinas redondeadas), como
«Nueva ficha».

## Criterios de aceptación

- [x] «Ver recursos» usa `bg-primary` + `text-primary-foreground` + `rounded-xl`.
- [x] Sin cambios de lógica ni de datos.

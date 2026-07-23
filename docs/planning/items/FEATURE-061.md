---
id: FEATURE-061
tipo: feature
titulo: Buscador global en la cabecera del área privada
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-23
actualizado: 2026-07-23
---

# FEATURE-061 — Buscador global en la cabecera del área privada

## Descripción

Añadir un buscador global en la cabecera del área privada (paneles de protectora
y `/mi-cuenta`) que permita saltar rápido a un animal, una solicitud, una cita o
una sección sin navegar por el menú. Resultados agrupados por tipo, con teclado
(atajo para abrir, flechas para navegar) y respetando RLS (cada usuario solo ve
lo suyo).

## Contexto / impacto

Detectado en FEATURE-039 al revisar el área privada. A medida que crecen los
datos de una protectora (animales, solicitudes, citas), el menú se queda corto;
un buscador reduce la fricción de encontrar algo concreto. Alcance a acotar en el
plan: qué entidades entran en el índice y si la búsqueda es cliente o servidor.

## Cierre (2026-07-23)

Alcance elegido por el usuario: **secciones + entidades por rol** (sin bypass).

- **Palette** (`CommandPalette`) en la cabecera (`AppHeader`): botón + atajo global
  **⌘K/Ctrl+K**, teclado (↑/↓ + Enter, Esc), resultados agrupados por tipo,
  overlay accesible (`role=dialog`).
- **Secciones** (cliente, `src/lib/command-sections.ts`): rutas del menú por rol,
  filtradas por label sin sensibilidad a acentos/mayúsculas.
- **Entidades** (`GET /api/buscar`, role-aware, **RLS** con el cliente del propio
  usuario): protectora → sus animales por nombre → ficha de edición; adoptante →
  sus solicitudes y favoritos por nombre del animal. Mínimo 2 caracteres,
  debounce 220 ms, `LIKE` escapado, `!inner` para filtrar por el nombre embebido.
- i18n `shell.search*`. Sin cambios de BD ni RLS nueva.
- **Recorte consciente**: sin citas ni búsqueda por nombre del adoptante (evita
  bypass admin); queda para ampliar si se pide.

## Criterios de aceptación

- El buscador abre con ⌘K/Ctrl+K y botón; navega por teclado; agrupa por tipo.
- Cada usuario solo ve lo suyo (RLS). Suite y lint verdes; textos en es.json.

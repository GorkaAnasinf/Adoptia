---
id: IMPROVEMENT-023
tipo: improvement
titulo: Subir CI y el runtime a Node 22+ (hoy el job de la app va en Node 20, ya deprecado)
estado: recibido
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-15
actualizado: 2026-07-15
---

# IMPROVEMENT-023 — Subir CI y el runtime a Node 22+

## Descripción

El job principal de `ci.yml` (lint, typecheck, tests, build) corre en **Node 20**, y eso ya da problemas:

- `supabase-js` avisa por stderr en cada ejecución: *«Node.js 20 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 22 or later»*. En BUG-007 no fue un aviso sino un fallo duro: con Node 20 los tests de RLS revientan con `Node.js detected but native WebSocket not found`, porque el WebSocket nativo llega en Node 22. Por eso el job `rls` ya va en 22 y el de la app se quedó en 20 — una inconsistencia que conviene no dejar fija.
- GitHub avisa además de que las actions que apuntan a Node 20 se fuerzan a Node 24: *«Node.js 20 is deprecated… actions/checkout@v4, actions/setup-python@v5»*.

## Contexto / impacto

Hoy no rompe nada visible: el job de la app pasa. Pero el proyecto está construyendo y midiendo cobertura sobre una versión de Node distinta a la del job de RLS y, previsiblemente, distinta de la que usa el runtime de producción. Cuanto más se tarde, más probable es que aparezca un fallo que solo se dé en un sitio — exactamente lo que pasó en BUG-007.

## Plan de desarrollo

_Pendiente de planificar (Snoopy)._

Notas de partida:

1. Comprobar **qué versión de Node usa el proyecto en Vercel** y alinear CI con ella, no al revés. Vercel ha ido moviendo su default (24 LTS en las versiones recientes); conviene mirarlo en el dashboard antes de decidir el número.
2. Subir `node-version` del job de la app y unificar con el de `rls`; sopesar `engines` en `package.json` y `.nvmrc` para que local, CI y Vercel no puedan divergir en silencio.
3. Revisar las actions ancladas a Node 20 (`actions/checkout@v4`, `actions/setup-python@v5`): ver si hay versiones mayores.
4. Verificar que `npm run build` y la suite siguen verdes en la versión nueva antes de mergear.

## Criterios de aceptación / Casuística a cubrir

- [ ] Pendiente de planificar.

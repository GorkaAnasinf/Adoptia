---
id: IMPROVEMENT-023
tipo: improvement
titulo: Subir CI y el runtime a Node 22+ (hoy el job de la app va en Node 20, ya deprecado)
estado: hecho
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

### Configuración

- `.nvmrc` con `24` como **única fuente de verdad**, y los dos jobs de `ci.yml` leyéndolo con `node-version-file: .nvmrc` en vez de llevar el número escrito a mano (que es como se separaron).
- `engines.node: ">=22"` en `package.json`: documenta el **suelo real** (el que exige `supabase-js` y que rompió BUG-007), sin romper a quien desarrolle en 22.

### Tareas

1. Consultar la versión de Node del proyecto en Vercel y alinear CI con ella, no al revés.
2. `.nvmrc` + `node-version-file` en ambos jobs + `engines`.
3. Verificar `npm run build` en local y **toda la CI en la versión nueva** antes de mergear.

### Dependencias

- BUG-007 (`hecho`) — de ahí salió el parche de Node 22 que este item unifica.

## Criterios de aceptación / Casuística a cubrir

- [x] CI corre en la **misma versión que producción**: Vercel usa `24.x` (consultado en el proyecto `prj_aUy74MR…`, no supuesto) y CI ahora también (`node: v24.18.0` en el run `29436624460`).
- [x] La versión vive en un solo sitio: `.nvmrc`. Ningún job la lleva escrita a mano, así que no pueden volver a divergir en silencio.
- [x] Los cuatro jobs en verde en Node 24, incluidos build y los 123 tests de RLS.
- [x] Desaparecen los avisos de deprecación de `supabase-js` (`Node.js 20 and below are deprecated`): **0 apariciones** en el run, frente a una por fichero antes.
- [x] `npm run build` sigue verde en local (Node 22.19), coherente con `engines: >=22`.

## Cierre (2026-07-15)

- **El dato que cambió el item**: se supuso «CI en 20, deprecado». La realidad al consultar Vercel era peor — **producción en 24, CI en 20, desarrollo en 22.19**: tres versiones, y la que decide si algo se despliega era la más lejana de producción. Por eso el item pedía mirar el dashboard antes de elegir número; hacerlo cambió el destino de 22 a 24.
- **Arreglo**: `.nvmrc` (24) + `node-version-file` en ambos jobs + `engines: >=22`. Se retira el parche de Node 22 que BUG-007 puso en el job `rls`: ahora ambos jobs leen del mismo sitio.
- **Por qué `engines` es `>=22` y no `>=24`**: 22 es el suelo técnico real (lo que exige `supabase-js`), y forzar 24 obligaría a actualizar el entorno local sin necesidad. `.nvmrc` recomienda 24 (lo de producción); `engines` impide bajar del suelo. Si se quiere que local sea exactamente 24, es cambiar una línea.
- **Verificación**: run `29436624460`, los cuatro jobs verdes en `v24.18.0`.
- **Revisado y descartado del alcance**: las actions ancladas a Node 20 (`actions/checkout@v4`, `actions/setup-python@v5`) siguen avisando de que se fuerzan a Node 24. Es un aviso de GitHub sobre el runtime de las *actions*, no del proyecto, y se resuelve cuando esas actions saquen versión mayor. No se toca.

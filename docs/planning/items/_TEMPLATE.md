---
id: TIPO-NNN
tipo: feature # feature | bug | improvement
titulo: Título corto en lenguaje de negocio
estado: recibido # recibido|analisis|diseno|listo|desarrollo|bloqueado|hecho|descartado
prioridad: media # alta | media | baja
hito: null # null hasta promover; luego "0.1", "0.2"...
duplicado_de: null # ID del original si se descarta por duplicado
creado: YYYY-MM-DD
actualizado: YYYY-MM-DD
---

# TIPO-NNN — Título

<!-- ============ PLANO 1: CAPTURA (ChatGPT / analista) ============ -->

## Descripción

Qué se necesita, en lenguaje de negocio. Sin jerga técnica.

## Contexto / impacto

Por qué importa, a quién afecta (adoptantes/protectoras/admin), qué pasa si no se hace.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

### Documentación a consultar

- Enlaces a docs/technical/* y skills relevantes.

### Seguridad

- RLS afectada, validaciones, superficie de ataque del cambio.

### Modelo de datos

- Tablas/migraciones nuevas o modificadas (o "sin cambios").

### API

- Endpoints/Route Handlers nuevos o modificados (o "sin cambios").

### Frontend

- Pantallas/componentes, referencia a prompts Stitch si existe.

### Tareas TDD

1. Test que falla → implementación → refactor. Lista ordenada de pasos.

### Dependencias

- Items que deben estar `hecho` antes (o "ninguna").

## Criterios de aceptación / Casuística a cubrir

- [ ] Toda la casuística funcional Y de seguridad, no solo el happy path.
- [ ] Estados vacíos, errores, permisos denegados, datos límite.

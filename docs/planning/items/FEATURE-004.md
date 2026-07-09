---
id: FEATURE-004
tipo: feature
titulo: Panel de protectora — dashboard y perfil público
estado: hecho
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-09
---

# FEATURE-004 — Panel de protectora: dashboard y perfil público

## Descripción

Al entrar a su panel, la protectora ve un resumen (animales publicados, solicitudes pendientes, próximas citas, adopciones del año) con accesos rápidos. Además edita su perfil público (portada, descripción, fotos de instalaciones, horarios, opciones de colaboración) con vista previa "como visitante". (Ref: P2, P6)

## Contexto / impacto

El dashboard es la home diaria de la protectora; el perfil público es su escaparate y donde capta voluntarios/acogidas/donaciones.

## Plan de desarrollo

### Documentación a consultar

- Prompts Stitch §2.2 y §2.7, [DESIGN](../../technical/DESIGN.md), skill `adoptia-frontend`

### Seguridad

- RLS ya cubre lecturas; contadores vía vistas SQL o queries agregadas con filtro de dueño.
- Fotos de instalaciones: mismas políticas de Storage que FEATURE-003 (`shelter_media`).

### Modelo de datos

- `shelter_media` de baseline. Sin cambios.

### API

- Sin cambios.

### Frontend

- Layout de panel con sidebar colapsable (Stitch 2.2): Inicio, Mis animales, Solicitudes, Citas, Agenda, Perfil, Estadísticas (los no implementados, ocultos).
- Dashboard: 4 stat tiles + listas de solicitudes recientes y próximas citas + CTA "+ Añadir animal".
- Editor de perfil (Stitch 2.7) con toggle de vista previa.

### Tareas TDD

1. Test contadores del dashboard con datos seed (0 y N).
2. Test: sidebar solo muestra secciones existentes.
3. Test editor perfil: guardar y ver reflejado en página pública.
4. Test vista previa = página pública real (mismo componente).

### Dependencias

- FEATURE-003 (datos que resumir).

## Criterios de aceptación / Casuística a cubrir

- [x] Dashboard con contadores correctos (una consulta por dueño; probado 0 y N).
- [x] Estado vacío cuidado: protectora nueva ve guía de primeros pasos, no ceros pelados.
- [x] Perfil editado se refleja en la página pública inmediatamente (ruta dinámica).
- [x] Vista previa idéntica a lo que ve un visitante anónimo (mismo componente `ShelterPublicProfile`).
- [x] Horarios con formato flexible (franjas mañana/tarde, cerrado).
- [x] Usable en móvil (rejillas responsivas, targets ≥44 px).
- Nota: "próximas citas" se pospone a FEATURE-009 (requiere `appointments`).

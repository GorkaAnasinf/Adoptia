---
id: FEATURE-014
tipo: feature
titulo: Estadísticas para protectoras y difusión en redes
estado: listo
prioridad: baja
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
---

# FEATURE-014 — Estadísticas para protectoras y difusión en redes

## Descripción

La protectora ve métricas de sus fichas (visitas, solicitudes, tiempo medio hasta adopción) para mejorar sus publicaciones, y puede generar con un clic una imagen lista para compartir en redes con la foto y datos del animal. (Ref: P9, P10)

## Contexto / impacto

Las estadísticas fidelizan a las protectoras; la difusión automática multiplica el alcance de cada ficha sin trabajo extra (hoy maquetan posts a mano).

## Plan de desarrollo

### Documentación a consultar

- Skill `adoptia-backend`, FEATURE-008 (infraestructura og-image reutilizable)

### Seguridad

- Contadores de visitas sin identificar al visitante (agregados anónimos, RGPD-friendly).

### Modelo de datos

- Tabla `page_views` agregada por día+ficha (o eventos Umami vía API si el free tier lo permite — decidir en diseño).

### API

- `GET /api/og/social/[slug]` — plantilla de imagen social (foto + nombre + datos + QR/URL).

### Frontend

- Sección Estadísticas del panel: gráficas simples por animal y globales; botón "Generar imagen para redes" con preview y descarga.

### Tareas TDD

1. Test agregación de visitas (sin PII).
2. Test tiempo-hasta-adopción con datos seed.
3. Test imagen social generada con datos correctos del animal.

### Dependencias

- FEATURE-008.

## Criterios de aceptación / Casuística a cubrir

- [ ] Visitas por ficha y por periodo; sin datos personales de visitantes.
- [ ] Imagen social descargable (1080×1080 y 1080×1920) con marca Adoptia.
- [ ] Protectora sin datos aún: estados vacíos explicativos, no gráficas rotas.

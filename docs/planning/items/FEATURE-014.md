---
id: FEATURE-014
tipo: feature
titulo: Estadísticas para protectoras y difusión en redes
estado: hecho
prioridad: baja
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-11
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

- [x] Visitas por ficha y por periodo; sin datos personales de visitantes (tabla `page_views` = animal+día+contador, nada más; probado que la fila no tiene otras columnas y que nadie escribe directo).
- [x] Imagen social descargable (1080×1080 y `?f=story` 1080×1920) con marca Adoptia, generada por `/api/og/social/[slug]` con preview y descarga desde el panel.
- [x] Protectora sin datos aún: estados vacíos explicativos (sin animales, sin visitas, sin adopciones), no gráficas rotas (probado).

## Cierre (2026-07-11)

- **BD**: `page_views` agregada por (animal, día); incremento solo vía RPC `registrar_visita` (security definer) que ignora fichas no públicas — no sirve para sondear borradores. Lectura solo protectora dueña/admin.
- **Registro**: la ficha pública incrementa la visita en el render (best-effort, no bloquea).
- **Panel** `/panel/estadisticas`: resumen (visitas 30d, solicitudes, días-hasta-adopción medios), gráfica de barras CSS de 30 días y tabla por animal con generador de imagen social (preview + descarga en ambos formatos). Nav del panel completo.
- **Aproximación documentada**: sin columna `adopted_at`, el tiempo hasta adopción usa `updated_at` del animal adoptado (su último cambio de estado); si algún día se edita un adoptado, la métrica se desvía — se reevaluará si duele.
- **Umami descartado** para visitas (plan lo dejaba a decidir): el agregado propio en BD cumple el criterio sin depender de un servicio externo ni de su API free.
- **Tests**: 3 RLS (agregación sin PII, borradores fuera, escritura bloqueada), 3 de la imagen social, 5 del util + página. Suite: 639.

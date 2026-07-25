---
id: FEATURE-064
tipo: feature
titulo: Jornadas de adopción F3 — cierre con métricas hacia estadísticas e historias
estado: hecho
prioridad: baja
hito: "0.5"
duplicado_de: null
creado: 2026-07-25
actualizado: 2026-07-25
---

# FEATURE-064 — Jornadas de adopción F3 (métricas)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Tercera fase de las **jornadas de adopción** (sobre FEATURE-062/063). Cierra el ciclo: cuando la jornada termina, la protectora la marca como **finalizada** y registra un resultado (nº de adopciones cerradas, animales presentados, personas que asistieron). Esos datos:

- alimentan las **estadísticas de la protectora** (FEATURE-014),
- pueden convertirse en **historias felices / social proof** ("En la jornada del parque, 4 animales encontraron casa"), enlazando con FEATURE-035/059.

## Contexto / impacto

Afecta a **protectoras** (miden el retorno de organizar jornadas) y al **público** (ve el impacto real, refuerza confianza). Sin esto, la jornada no deja rastro de resultado y se pierde una fuente natural de prueba social y de métricas. Es la fase de menor prioridad: aporta valor pero no es imprescindible para operar jornadas.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- FEATURE-062 (modelo `events`).
- Estadísticas de protectora (FEATURE-014) e historias felices (FEATURE-035/059): cómo se agregan y se muestran hoy.
- Skills: `adoptia-database` (migración/RLS/agregados), `adoptia-frontend` (tarjetas de stats, patrón de historias), `adoptia-testing`.

### Seguridad

- Solo la **dueña** de la protectora (o admin) cierra su jornada y edita el resultado (RLS de `events` ya lo cubre en escritura).
- El resumen público no expone datos personales de asistentes: solo agregados (nº adopciones/asistentes).

### Modelo de datos

Migración `supabase/migrations/20260725xxxxxx_feature064_event_outcome.sql`:

- Ampliar `events` con el resultado: `adoptions_count int`, `attended_count int` (nullable), y uso del estado `finished` del enum ya creado en F1.
- (Opcional) vincular adopciones reales si existe una entidad de adopción cerrada; si no, `adoptions_count` es un dato declarado por la protectora al cerrar.
- Vista/RPC de agregados por protectora para las estadísticas (suma de adopciones de jornadas finalizadas).

### API

- Sin endpoints nuevos: cierre por acceso directo amparado por RLS (mismo patrón que el resto del CRUD de jornadas).

### Frontend

- **Panel protectora**: acción "Finalizar jornada" (disponible cuando `ends_at` ya pasó) con un formulario breve de resultado (por secciones, patrón base): adopciones, asistentes, nota. Estado `finished`.
- **Estadísticas** de la protectora: nueva métrica/tarjeta "adopciones en jornadas" integrada en el patrón de stats existente.
- **Historias felices**: opción de generar una entrada de social proof a partir de una jornada finalizada con resultado positivo (reutiliza el patrón de FEATURE-035/059), con moderación.
- i18n de los textos nuevos.

### Tareas TDD

1. **Migración + agregado** — RLS de escritura del resultado (solo dueña/admin); RPC/vista de suma por protectora.
2. **Finalizar jornada** — solo tras `ends_at`; guarda `adoptions_count`/`attended_count` y estado `finished`.
3. **Estadística** — la métrica agrega correctamente solo jornadas `finished`.
4. **Historia feliz desde jornada** — genera la entrada con moderación; agregados sin datos personales.
5. i18n + `tsc` + lint + cobertura.

### Dependencias

- **FEATURE-062 (F1) `hecho`.** F2 (FEATURE-063) recomendable pero no bloqueante.

## Documentación a alinear (al cerrar — Hachiko)

- **Alinear con el `git diff`:** `docs/technical/DATA_MODEL.md` (campos de resultado, agregado), `docs/technical/DECISIONS.md` (adopciones declaradas vs vinculadas), catálogo (`render_planning.py`), CHANGELOG.
- **Manual de usuario (`docs/manual/`): actualizar SOLO cuando F3 esté implementada y probada** — cómo cierra la protectora una jornada, dónde ve la métrica y cómo se publica como historia feliz.

## Criterios de aceptación / Casuística a cubrir

- [x] La protectora finaliza una jornada pasada (botón "Finalizar" solo si `ends_at` ya pasó) y registra adopciones/asistentes; estado `finished`.
- [x] La estadística de la protectora agrega **solo** jornadas `finished` (tarjeta "Jornadas de adopción" con celebradas/adopciones/asistentes).
- [x] Social proof **sin datos personales**: banner en el perfil público de la protectora ("en nuestras jornadas, N animales encontraron familia"), como **agregado público** en vez de forzarlo en `adoption_stories` (Decisión #57).
- [x] Seguridad RLS: solo la dueña/admin cierra y edita el resultado; los contadores son públicos (agregados, sin PII). Test RLS 3/3.
- [x] Textos en `messages/es.json`; `tsc` y lint limpios.
- [ ] Documentación y manual alineados al cerrar — **a cargo de Hachiko**.

## Estado de implementación (Bolt · 2026-07-25)

Rama `feature/FEATURE-064-jornadas-metricas` (desde `main`). Migración `20260726100000_feature064_event_outcome` (columnas `adoptions_count`/`attended_count` con checks). Panel: "Finalizar" en `JornadaRow` con formulario de resultado. Estadísticas: tarjeta de jornadas. Perfil público: banner de social proof.

**Desviación vs plan (justificada):** la "historia feliz desde jornada" se implementa como **agregado público** en el perfil de la protectora, no como entrada en `adoption_stories` — ese modelo es un **testimonio del adoptante sobre un animal concreto con consentimiento** (FEATURE-035/059), que no encaja con un recuento de jornada (Decisión #57). Verificación: RLS eventos 13/13, unit 28/28, `tsc` y lint limpios. **Pendiente de despliegue:** `supabase db push` a prod. Con F3, **la línea Jornadas (F1+F2+F3) queda completa.**

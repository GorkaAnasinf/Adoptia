---
id: FEATURE-035
tipo: feature
titulo: Historias felices — social proof de adopciones en la home
estado: hecho
prioridad: baja
hito: "0.5"
duplicado_de: null
creado: 2026-07-18
actualizado: 2026-07-23
---

# FEATURE-035 — Historias felices (social proof de adopciones)

## Descripción

La home vende el proceso (busca → conoce → cita) pero no muestra resultados: animales que YA encontraron casa. Es el argumento emocional más fuerte para el visitante dudoso. Dos niveles incrementales:

- **Nivel 1 (barato)**: sección «Ya están en casa» con los últimos animales `status: adopted` — foto + nombre + protectora + fecha aproximada. Los datos ya existen en BD; solo lectura (RPC pequeño o filtro del existente). Sin RGPD nuevo: datos del animal, no del adoptante.
- **Nivel 2 (feature completa)**: testimonios reales del adoptante semanas después (foto nueva + frase). Requiere: tabla nueva con RLS, **consentimiento explícito** (RGPD: foto y texto del adoptante son datos personales), moderación antes de publicar (encaja con FEATURE-011) y opcionalmente email de invitación X días tras la adopción (cron existente).

## ⚠️ Sección demo ya en producción

Desde IMPROVEMENT-027 (2026-07-18) la home muestra la sección «Historias felices» con **3 historias inventadas** (fotos locales `public/images/story-*.jpg`, textos `home.stories*` en `messages/es.json`) para previsualizar la home completa. **Al desarrollar este item hay que sustituir esa sección por datos reales** (y borrar los textos/fotos de demo).

## Contexto / impacto

Capturada el 2026-07-18 al revisar mejoras de la home tras FEATURE-034. Condición para el nivel 1: esperar a que haya adopciones reales con buenas fotos (hoy las adopciones en producción son mayormente datos de prueba `@masivo.adoptia.es`). El nivel 2 tiene sentido cuando la plataforma ruede con protectoras reales.

<!-- ============ PLANO 2: PLAN TÉCNICO ============ -->

## Plan de desarrollo (Nivel 1 — hecho 2026-07-23)

### Seguridad

- Sin RGPD nuevo (datos del animal, no del adoptante). Los adoptados conservan
  `published_at`, así que la policy pública `animals_public_read` ya deja leerlos.
- RPC `adopted_animals_recent` **security invoker**: la RLS aplica igual que en
  `animals_search`. Grant a `anon, authenticated`.

### Modelo de datos

- **Sin columna nueva.** No existe fecha de adopción → se usa `updated_at` como
  aproximación (mostrada como mes/año). Decisión del usuario 2026-07-23.
- Migración `20260723100000_feature035_adopted_recent.sql`: RPC
  `adopted_animals_recent(p_limit)` → últimos `status='adopted'` de protectoras
  verificadas, con portada de `animal_media` (solo fotos) y solo si tienen foto.

### Frontend

- `page.tsx` de la home: `cargarAdoptados()` + sección «Ya están en casa» con
  cards (foto + badge + nombre + protectora + fecha), `Reveal` + hover-lift,
  enlace a la ficha. Se oculta si no hay adopciones con foto.
- Eliminada la demo de IMPROVEMENT-027: textos `home.stories[123]*` y fotos
  `public/images/story-*.jpg`. Nuevas keys `home.storiesDate/Via/Alt`.

### Nivel 2 (pendiente, fuera de este item)

- Testimonios del adoptante: tabla nueva + RLS, consentimiento RGPD, moderación
  (FEATURE-011) y email de invitación X días tras la adopción. Abrir item propio
  cuando haya protectoras reales.

## Criterios de aceptación

- La home muestra adopciones reales con foto/nombre/protectora/fecha; sin datos,
  la sección desaparece. Demo eliminada. Suite y lint verdes.

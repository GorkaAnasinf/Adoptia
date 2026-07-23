---
id: FEATURE-059
tipo: feature
titulo: Historias felices Nivel 2 — testimonios reales del adoptante
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-23
actualizado: 2026-07-23
---

# FEATURE-059 — Historias felices Nivel 2 (testimonios del adoptante)

## Descripción

Segundo nivel de las historias felices, sobre el Nivel 1 ya en producción
(FEATURE-035, sección «Ya están en casa» con adopciones reales). Recoger
testimonios reales del adoptante semanas después de la adopción: foto nueva del
animal en su hogar + frase, y mostrarlos en la home en lugar de (o además de) la
ficha del animal adoptado.

Requiere:
- **Tabla nueva** (p. ej. `adoption_stories`) con **RLS**.
- **Consentimiento explícito** del adoptante (RGPD: la foto y el texto son datos
  personales suyos, no del animal).
- **Moderación** antes de publicar (encaja con FEATURE-011).
- Opcional: **email de invitación** X días tras la adopción usando el cron
  existente.

## Contexto / impacto

Es el argumento emocional más fuerte para el visitante dudoso. El Nivel 1 muestra
el resultado (animal en casa); el Nivel 2 le pone voz humana. Tiene sentido
cuando la plataforma ruede con protectoras y adopciones reales — hoy las
adopciones en producción son mayormente datos de prueba. Separado de FEATURE-035
por su coste (RGPD + moderación + tabla) frente al Nivel 1, que era solo lectura.

## Plan de desarrollo (decisiones del usuario 2026-07-23)

Modera **la protectora dueña** del animal; el adoptante envía **desde /mi-cuenta**;
la **foto es opcional** (cae a la portada del animal); **sin email** de invitación
(item aparte si se quiere).

### Seguridad / RGPD

- Consentimiento explícito obligatorio (`consent` = true, check en BD). Foto y
  texto del adoptante son datos personales suyos.
- RLS `adoption_stories`: insert solo del propio adoptante y solo si tiene una
  `adoption_requests` **completed** para ese animal; el adoptante lee/edita/borra
  las suyas mientras estén `pending`; la protectora dueña lee y modera (aprobar/
  rechazar) las de su `shelter_id`; público lee solo `approved`.
- Bucket `story-media` (público en lectura) con RLS de escritura por carpeta del
  adoptante (mismo patrón que `animal-media`).

### Modelo de datos

- Migración `feature059_adoption_stories`: tabla `adoption_stories` (adopter_id,
  animal_id, shelter_id, quote, photo_url null, consent, status
  pending|approved|rejected, shelter_note null, timestamps, published_at), único
  (adopter_id, animal_id), trigger `set_updated_at`, RLS + bucket.

### API / Frontend

- Zod `historia.ts` + `POST /api/historias` (auth, valida propiedad de la
  adopción, consentimiento, 409 si ya existe).
- Adoptante: `CompartirHistoriaDialog` en `/mi-cuenta/solicitudes` para las
  solicitudes `completed` sin historia (frase + foto opcional + consentimiento).
- Protectora: `/panel/historias` (cola de pendientes + recientes) con
  `HistoriaModeracionActions` (aprobar/rechazar vía update, RLS guarda) + item de
  nav `navStories`.
- Home: la sección «Historias felices» muestra testimonios `approved` (foto de la
  historia o portada del animal + frase); si no hay, cae al Nivel 1 (adoptados).

### Tests

- RLS (insert propio/denegado, público solo approved, moderación de la dueña).
- Handler (401/403/409/201). Componentes (diálogo, cola, home).

## Criterios de aceptación

- El adoptante comparte historia solo de animales que adoptó, con consentimiento.
- La protectora dueña aprueba/rechaza; solo las aprobadas salen en la home.
- Foto opcional con fallback a la portada. Suite y lint verdes; textos en es.json.

## Cierre (2026-07-23)

- **BD**: `adoption_stories` (RLS: insert propio solo con adopción `completed` +
  consent; lectura pública solo `approved`; el adoptante edita/borra las
  pendientes; la protectora dueña modera) + bucket `story-media`. Decisión #50.
- **API**: `POST /api/historias` (401/422/403/409/201). Schema `historia.ts`.
- **UI adoptante**: `CompartirHistoriaDialog` en `/mi-cuenta/solicitudes` (frase +
  foto opcional a `story-media` + consentimiento) sobre adopciones completadas.
- **UI protectora**: `/panel/historias` (pendientes/revisadas) +
  `HistoriaModeracionActions` (aprobar/rechazar vía update, RLS guarda) + nav
  `navStories`. Nombre del adoptante vía bypass admin acotado (solo nombre).
- **Home**: la sección «Historias felices» muestra testimonios `approved` (foto de
  la historia o portada del animal + frase); si no hay, cae al Nivel 1 (adoptados).
- **Recorte consciente**: no se muestra el nombre del adoptante en la home
  (privacidad + evita bypass admin en página pública ISR). Email de invitación
  fuera de alcance (item aparte si se quiere).
- **Tests**: RLS (5, `skipIf`), handler (5), home (testimonio + fallback), image.
  Suite 1193 verde.

---
id: FEATURE-059
tipo: feature
titulo: Historias felices Nivel 2 — testimonios reales del adoptante
estado: recibido
prioridad: media
hito: null
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

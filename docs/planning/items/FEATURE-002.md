---
id: FEATURE-002
tipo: feature
titulo: Onboarding de protectoras y verificación por admin
estado: listo
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
---

# FEATURE-002 — Onboarding de protectoras y verificación por admin

## Descripción

Una protectora recién registrada completa un asistente de 3 pasos (datos de entidad con CIF, ubicación geocodificada sobre mapa ajustable, perfil público con logo y descripción) y queda **pendiente de verificación**. Un admin revisa la documentación y la verifica o rechaza; solo las verificadas son públicas. (Ref: P1, A1)

## Contexto / impacto

La verificación es la base de la confianza de la plataforma y evita fraudes. Sin protectoras verificadas no hay contenido público.

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`shelters`), [API_CONTRACTS](../../technical/API_CONTRACTS.md) (geocode, verificar), prompts Stitch §2.1, skills `adoptia-backend`, `adoptia-database`

### Seguridad

- RLS: protectora solo edita su `shelter`; `status` solo lo cambia admin.
- Geocoding en servidor (`/api/protectoras/geocode`) — no exponer Nominatim desde cliente sin control; cachear resultado en BD.
- Subida de logo: validar tipo/tamaño en cliente y en política de Storage (bucket `logos`, solo dueño escribe).

### Modelo de datos

- `shelters` ya existe. Añadir si falta: campo para URL de documentación de verificación.

### API

- `POST /api/protectoras/geocode` (Nominatim + caché).
- `POST /api/admin/protectoras/[id]/verificar` (`verified`/`suspended` + motivo + email Resend).

### Frontend

- Wizard 3 pasos (Stitch 2.1) con mapa Leaflet de previsualización y pin ajustable; editor de horarios.
- Vista admin: cola de pendientes con datos y acciones verificar/rechazar.

### Tareas TDD

1. Test Zod del wizard (CIF formato, CP español) → formularios.
2. Test: al completar wizard, shelter queda `pending` y no aparece en listados públicos.
3. Test geocode: dirección → lat/lng persistida; segundo alta misma dirección usa caché.
4. Test verificación: solo admin puede; email enviado; shelter aparece en público.
5. E2E: registro protectora → wizard → admin verifica → perfil visible.

### Dependencias

- FEATURE-001.

## Criterios de aceptación / Casuística a cubrir

- [ ] Wizard completo con validación por paso y estado guardado si se abandona a medias.
- [ ] Dirección geocodificada con pin ajustable manualmente (Nominatim puede fallar ±100 m).
- [ ] Geocoding fallido (dirección no encontrada): mensaje claro + introducción manual del pin.
- [ ] Protectora `pending` NO visible en mapa/listados; ve banner "en revisión" en su panel.
- [ ] Verificar/rechazar solo desde admin; ambos envían email en español al gestor.
- [ ] Protectora `suspended` pierde visibilidad pública inmediatamente pero conserva acceso a sus datos.
- [ ] CIF y email de entidad únicos — segundo alta con mismo CIF se bloquea con aviso.

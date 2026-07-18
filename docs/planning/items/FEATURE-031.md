---
id: FEATURE-031
tipo: feature
titulo: Tablón de necesidades de protectoras (pedir ayuda material)
estado: desarrollo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# FEATURE-031 — Tablón de necesidades de protectoras

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Las protectoras piden ayuda material constantemente (comida, mantas/ropa, medicinas, transporte…) y hoy lo hacen a gritos en redes. Se pide:

1. La protectora publica necesidades: categoría (comida, mantas/ropa, medicinas, transporte, otros), descripción, urgencia y estado (`abierta` / `cubierta`).
2. Las necesidades se ven en su perfil público y en un tablón general filtrable por zona (reutiliza la búsqueda por proximidad existente).
3. Un usuario pulsa «Puedo ayudar» → contacto vía plataforma (patrón del contacto de acogida: sin exponer emails).
4. Solo protectoras verificadas publican (anti-spam).

## Contexto / impacto

Canaliza la voluntad de ayudar de gente que no puede adoptar ni acoger pero sí donar; da a las protectoras un canal propio y ordenado en vez de depender del alcance de sus redes. Refuerza el valor de la plataforma para ambos lados.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (patrón PostGIS/RPCs), [API_CONTRACTS](../../technical/API_CONTRACTS.md) (patrón relay de `perdidos/contactar`), FEATURE-006 (búsqueda por ciudad + geocode); skills `adoptia-database`, `adoptia-security`, `adoptia-backend`, `adoptia-frontend`, `adoptia-testing`.

### Seguridad

- RLS deny-by-default: escritura solo del dueño de protectora **verificada**; lectura pública (anon) solo de `abiertas` de verificadas; la dueña ve también sus `cubiertas` (historial); admin todo.
- Contacto «Puedo ayudar» = **relay puro** (patrón FEATURE-022): el email va A LA PROTECTORA con el mensaje del usuario y `Reply-To` del remitente (lo cede conscientemente, avisado en el formulario); mensaje escapado; rate limit 5/h por usuario; exige cuenta.

### Modelo de datos

- Migración `shelter_needs`: `id`, `shelter_id` fk (cascade), `categoria` check (`comida|mantas_ropa|medicinas|transporte|otros`), `descripcion` (1..500), `urgencia` check (`normal|urgente`), `status` check (`abierta|cubierta`) default `abierta`, timestamps + trigger `set_updated_at`. Índices por shelter y status.
- RPC `shelter_needs_nearby(p_lat, p_lng, p_radius_km)` (security definer, patrón `shelters_nearby`): abiertas de verificadas dentro del radio con nombre/slug/ciudad de la protectora y distancia; usable por anon.

### API

- `POST /api/necesidades/contactar`: `{ need_id, mensaje (10..1000) }` — auth requerida; 404 si la necesidad no está `abierta` (o RLS la oculta); email relay a la protectora. Documentar en API_CONTRACTS.
- CRUD de la protectora sin endpoints: supabase-js directo amparado por RLS (patrón `AcogidaForm`).

### Frontend

- **Panel** `/panel/necesidades` (+ entrada «Necesidades» en el sidebar de protectora): crear (categoría/descripción/urgencia), editar, marcar cubierta/reabrir; historial de cubiertas; estados vacíos.
- **Tablón público** `/necesidades`: lista de abiertas (urgentes primero) con filtros de categoría/urgencia y búsqueda por ciudad (geocode existente → RPC nearby); enlace en el footer y sitemap; botón «Puedo ayudar» (diálogo con mensaje; sin sesión → CTA de login).
- **Perfil público de protectora**: sección «Necesitamos» con sus abiertas + «Puedo ayudar».
- Textos en `es.json`; plantilla de email nueva.

### Tareas TDD

1. Test RLS: verificada crea/edita/cubre; pendiente no crea; anon lee solo abiertas de verificadas; dueña ve sus cubiertas; tercero no escribe.
2. Test RPC nearby: dentro/fuera del radio; no verificada excluida; `cubierta` excluida.
3. Test handler contactar: 401, 422, 404 (cubierta/inexistente), feliz (email a la protectora con mensaje y Reply-To), 429.
4. Test formulario de necesidad del panel (crear/editar/cubrir) + página del panel con estados vacíos.
5. Test tablón `/necesidades`: filtros, urgentes primero, «Puedo ayudar» (login CTA sin sesión), vacío.
6. Test sección del perfil público.
7. Suite completa (RLS incluidos) + lint + `tsc`.

### Dependencias

- Ninguna (FEATURE-006 y FEATURE-028 ya `hecho`).

## Criterios de aceptación / Casuística a cubrir

- [ ] Protectora verificada crea/edita/cierra necesidades; no verificada, no (RLS probado).
- [ ] Necesidades `abiertas` visibles en el perfil público de la protectora y en el tablón general con filtro por zona/categoría/urgencia (urgentes primero).
- [ ] «Puedo ayudar» exige cuenta y contacta vía plataforma (relay con Reply-To cedido conscientemente); rate-limit anti-spam.
- [ ] Necesidad `cubierta` desaparece del tablón y del perfil pero queda en el historial de la protectora (reabrible).
- [ ] Estados vacíos (protectora sin necesidades, tablón sin resultados en la zona) cuidados.
- [ ] RLS probada: escritura solo dueño verificado; lectura pública solo de `abiertas` de verificadas.

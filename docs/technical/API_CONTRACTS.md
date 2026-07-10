# Contratos de API — Adoptia

La mayor parte del acceso a datos va **directo a Supabase** (supabase-js + RLS). Los Route Handlers (`src/app/api/`) existen solo para lógica que no puede vivir en el cliente: envío de emails, operaciones multi-tabla, cron y validación server-side.

## Convenciones

- Validación de entrada con **Zod** en TODO handler; el esquema se comparte con el formulario cliente.
- Respuestas JSON: `{ data }` en éxito, `{ error: { code, message } }` en fallo. Códigos HTTP semánticos.
- Autenticación: sesión Supabase vía `@supabase/ssr`; el handler verifica rol antes de actuar.
- Rate limiting básico + honeypot en endpoints públicos de formulario.
- Endpoints cron protegidos con header `Authorization: Bearer ${CRON_SECRET}`.

## Endpoints previstos (fase 1)

| Método | Ruta | Qué hace | Auth |
|--------|------|----------|------|
| POST | `/api/solicitudes` | Crea `adoption_request` (valida cuestionario Zod, comprueba unique, email a protectora por SMTP) | adoptante |
| PATCH | `/api/solicitudes/[id]` | Aprobar/rechazar (con motivo); email al adoptante | protectora dueña |
| POST | `/api/protectoras/geocode` | Geocodifica dirección con Nominatim y devuelve lat/lng (cachea) | protectora |
| GET | `/api/geocode?q=` | Geocodifica ciudad/CP para el buscador del mapa público (cachea, rate limit por IP) | público |
| POST | `/api/admin/protectoras/[id]/verificar` | `pending → verified/suspended`; email de resultado | admin |
| GET | `/api/cron/keepalive` | Ping BD (evita pausa Supabase free) | CRON_SECRET |

Fase 2 añade: `/api/citas` (proponer/confirmar/cancelar + recordatorios), `/api/alertas/notificar` (cron que casa animales nuevos con `saved_searches`).

## Contrato de ejemplo — POST /api/solicitudes

```jsonc
// Request
{
  "animal_id": "uuid",
  "questionnaire": {
    "vivienda": "piso",            // piso | casa_jardin | otro
    "regimen": "alquiler",         // propiedad | alquiler
    "permiten_animales": true,     // requerido si alquiler
    "convivientes": 3,
    "ninos_edades": [5, 9],
    "otros_animales": "un gato",
    "experiencia": "he tenido perros 10 años",
    "horas_solo": 4,
    "todos_de_acuerdo": true,
    "asume_gastos": true
  },
  "message": "texto libre del adoptante"
}
// 201 → { "data": { "id": "uuid", "status": "pending" } }
// 401 → { "error": { "code": "unauthorized" } }          // sin sesión
// 403 → { "error": { "code": "not_available" } }         // animal no disponible (status !== "available")
// 404 → { "error": { "code": "not_found" } }              // animal inexistente
// 409 → { "error": { "code": "duplicate_request", "message": "Ya tienes una solicitud para este animal" } }
// 422 → { "error": { "code": "validation", "message": "...", "issues": [...] } }
// 429 → { "error": { "code": "rate_limited" } }           // límite por usuario superado
```

Anti-spam: honeypot (`website`, campo oculto — si viene relleno se responde 201
"falso" sin crear nada ni avisar) + rate limit en memoria por usuario
(10 peticiones/min). El email a la protectora es *best-effort*: si SMTP falla,
la solicitud se crea igualmente (nunca se pierde el envío del adoptante por un
fallo de correo).

## Contrato — PATCH /api/solicitudes/[id] *(FEATURE-007)*

Auth: protectora dueña del animal de la solicitud (verificado en el handler:
`animals.shelter_id → shelters.owner_id = auth.uid()`; RLS como red). Cuatro
acciones posibles, discriminadas por `accion`:

```jsonc
// Aprobar: la solicitud pasa a "approved" y el animal a "reserved"
// (transición validada con esTransicionValida). Email al adoptante.
{ "accion": "approve" }

// Rechazar: exige motivo. La solicitud pasa a "rejected". Email al
// adoptante con el motivo y sugerencia de seguir buscando.
{ "accion": "reject", "motivo": "No cumple los requisitos de vivienda" }

// Marcar adoptado: la solicitud pasa a "completed", el animal a "adopted"
// (si la transición es válida) y TODAS las demás solicitudes pendientes del
// mismo animal se cierran automáticamente a "rejected" con un email amable
// ("ya ha encontrado hogar").
{ "accion": "complete" }

// Notas internas: no cambia el estado ni envía email. Editable en cualquier
// momento (incluso con la solicitud ya resuelta).
{ "accion": "note", "nota": "Familia muy implicada, llamar para confirmar visita" }

// 200 → { "data": { "id": "uuid", "status": "approved" | "rejected" | "completed" } }
//        (accion "note" → { "data": { "id": "uuid", "shelter_notes": "..." } })
// 401 → { "error": { "code": "unauthorized" } }           // sin sesión
// 403 → { "error": { "code": "forbidden" } }              // no es la protectora dueña
// 404 → { "error": { "code": "not_found" } }              // solicitud inexistente
// 409 → { "error": { "code": "invalid_state" } }          // ya resuelta (no aplica a "note")
// 422 → { "error": { "code": "validation", "issues": [...] } }  // p. ej. reject sin motivo
```

Los emails de esta ruta (aprobación/rechazo/cierre por adopción) también son
*best-effort*: un fallo de SMTP se registra en logs pero no impide que el
cambio de estado, ya persistido en BD, se devuelva como éxito al cliente.

**Gap conocido (fuera de alcance de FEATURE-007):** la policy RLS de `update`
en `adoption_requests` es a nivel de fila, no de columna. El adoptante dueño
de la fila pasa el mismo `using`/`with check` que la protectora, así que en
teoría también podría escribir `shelter_notes` o `status` directamente contra
la API de Supabase (sin pasar por este handler). Está cubierto y documentado
en `src/test/rls/adoption-requests.test.ts` (test `[gap conocido]`); cerrarlo
requeriría una policy o vista específica por columna — se deja para un item
aparte.

## Contrato — POST /api/protectoras/geocode  *(FEATURE-002)*

Auth: protectora. Geocodifica una dirección con Nominatim y **cachea** el resultado en `geocode_cache` (segunda alta con la misma dirección no vuelve a llamar a Nominatim). **Nunca 500** por dirección inexistente: devuelve `lat/lng` a `null` para que el cliente coloque el pin a mano.

```jsonc
// Request
{ "address": "Calle Mayor 1", "city": "Bilbao", "province": "Bizkaia", "postalCode": "48001" }
// 200 → { "data": { "lat": 43.263, "lng": -2.935, "source": "cache" | "nominatim" } }
// 200 (no encontrada) → { "data": { "lat": null, "lng": null, "source": "nominatim" } }
// 401 → { "error": { "code": "unauthorized" } }        // sin sesión
// 403 → { "error": { "code": "forbidden" } }           // rol distinto de shelter
// 422 → { "error": { "code": "validation", "issues": [...] } }
```

## Contrato — GET /api/geocode?q=  *(FEATURE-006)*

Público, sin sesión. Geocodifica una ciudad/CP para el buscador del mapa de protectoras (`/mapa`). Cachea en `geocode_cache` (misma tabla que el endpoint de protectoras) y aplica rate limit en memoria por IP (20 peticiones/min) para no abusar de Nominatim. **Nunca 500** por ciudad inexistente.

```jsonc
// GET /api/geocode?q=Bilbao
// 200 → { "data": { "lat": 43.263, "lng": -2.935, "source": "cache" | "nominatim" } }
// 200 (no encontrada) → { "data": { "lat": null, "lng": null, "source": "nominatim" } }
// 422 → { "error": { "code": "validation", "issues": [...] } }  // falta q o está vacío
// 429 → { "error": { "code": "rate_limited" } }                  // límite por IP superado
```

## Contrato — POST /api/admin/protectoras/[id]/verificar  *(FEATURE-002)*

Auth: admin (rol comprobado en el handler + RLS como red). Cambia el `status` de la protectora y envía email en español al gestor (SMTP de Gmail, plantilla propia — Decisión #22). El rechazo **exige motivo**, que se guarda en `verification_note` y se muestra en el banner rojo del panel de la protectora.

```jsonc
// Request (verificar)
{ "accion": "verify" }
// Request (rechazar)
{ "accion": "reject", "motivo": "El CIF no coincide con el registro" }
// 200 → { "data": { "status": "verified" | "suspended" } }
// 400 → { "error": { "code": "validation" } }          // reject sin motivo
// 401 → { "error": { "code": "unauthorized" } }
// 403 → { "error": { "code": "forbidden" } }            // rol distinto de admin
// 404 → { "error": { "code": "not_found" } }
```

Este documento se amplía por item: cada FEATURE que añada endpoints los documenta aquí al cerrarse (lo verifica Hachiko).

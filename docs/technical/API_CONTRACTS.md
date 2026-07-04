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
| POST | `/api/solicitudes` | Crea `adoption_request` (valida cuestionario Zod, comprueba unique, email a protectora vía Resend) | adoptante |
| PATCH | `/api/solicitudes/[id]` | Aprobar/rechazar (con motivo); email al adoptante | protectora dueña |
| POST | `/api/protectoras/geocode` | Geocodifica dirección con Nominatim y devuelve lat/lng (cachea) | protectora |
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
// 409 → { "error": { "code": "duplicate_request", "message": "Ya tienes una solicitud para este animal" } }
// 422 → { "error": { "code": "validation", "message": "...", "issues": [...] } }
```

Este documento se amplía por item: cada FEATURE que añada endpoints los documenta aquí al cerrarse (lo verifica Hachiko).

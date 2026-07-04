---
description: Patrones de servidor de Adoptia — Route Handlers, Supabase SSR, emails Resend, cron, geocoding
---

# Skill: Backend Adoptia

No hay backend separado: la lógica de servidor vive en Route Handlers (`src/app/api/`) y Server Components. Contratos: `docs/technical/API_CONTRACTS.md`.

## Cuándo Route Handler vs supabase-js directo

- **Directo con RLS** (cliente o Server Component): lecturas, escrituras simples del propio usuario.
- **Route Handler**: emails, operaciones multi-tabla/transaccionales, terceros (Nominatim), cron, cualquier cosa con `service_role`.

## Anatomía de un handler

```ts
// src/app/api/solicitudes/route.ts
import { createClient } from "@/lib/supabase/server"; // @supabase/ssr, cookies
import { solicitudSchema } from "@/lib/schemas/solicitud"; // MISMO esquema que el form

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const parsed = solicitudSchema.safeParse(await req.json());
  if (!parsed.success)
    return json({ error: { code: "validation", message: "Datos inválidos", issues: parsed.error.issues } }, 422);

  // lógica... errores de negocio con código semántico (409 duplicate_request, 403 not_available)
  return json({ data }, 201);
}
```

Reglas: SIEMPRE validar con Zod aunque el cliente ya validó · respuesta `{ data } | { error: { code, message } }` · verificar rol/propiedad antes de actuar (RLS es la red, no la única puerta).

## Clientes Supabase

- `src/lib/supabase/client.ts` (browser) y `server.ts` (SSR con cookies) — los únicos puntos de creación.
- **`service_role` solo en `src/lib/supabase/admin.ts`**, importable únicamente desde handlers admin/cron. Si un fichero cliente lo importa, el build debe fallar (comprobación `server-only`).

## Emails (Resend + react-email)

- Plantillas en `src/emails/` (componentes React, español, tono cálido).
- Envío solo desde handlers; en tests SIEMPRE mockeado.
- Cuota free 100/día: agrupa notificaciones (1 email con N animales, no N emails).
- Textos definidos: solicitud recibida / aprobada / rechazada, cita confirmada, recordatorio 24 h.

## Cron (Vercel Cron / GitHub Actions → /api/cron/*)

```ts
if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
  return new Response("Unauthorized", { status: 401 });
```

Idempotentes SIEMPRE (correr dos veces no duplica emails/efectos — marca lo procesado).

## Geocoding (Nominatim)

- Solo en escritura (alta/edición de dirección), nunca en lectura.
- Proxy en handler con caché en BD + rate limit (política de uso de Nominatim: 1 req/s, User-Agent identificado).
- Resultado persistido en `shelters.location` (PostGIS).

## Anti-spam en formularios públicos

Honeypot (campo oculto) + rate limit por usuario/IP (upstash-style en memoria o tabla) + no aceptar acciones sobre recursos no disponibles.

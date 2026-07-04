# Seguridad — Adoptia

Principio rector: **security by design** — la seguridad vive en la base de datos (RLS) y en validación de servidor, no en ocultación de UI. Alineación con ISO 27001 en lo aplicable a un proyecto de este tamaño (control de acceso, gestión de secretos, registro de incidentes, minimización).

## Controles por capa

### Base de datos (Supabase/PostgreSQL)

- **RLS habilitada en TODAS las tablas** — deny by default; política explícita por operación. Detalle en [DATA_MODEL](../technical/DATA_MODEL.md#reglas-rls-pilar-de-seguridad).
- Roles de negocio en `profiles.role`, inmutables por el propio usuario.
- Storage con políticas por bucket y carpeta (`shelter_id/`); validación de MIME y tamaño.
- Migraciones versionadas — sin cambios manuales en producción.

### Aplicación (Next.js)

- Validación **Zod en servidor** en todo Route Handler (el mismo esquema del formulario cliente).
- `SUPABASE_SERVICE_ROLE_KEY` solo en código de servidor; prohibido el prefijo `NEXT_PUBLIC_` para secretos (lo vigila la skill `adoptia-security`).
- Sesiones vía cookies httpOnly (`@supabase/ssr`); nunca tokens en localStorage.
- Headers: CSP, `X-Frame-Options: DENY`, `Referrer-Policy` en `next.config.ts`.
- Anti-spam en formularios públicos: rate limiting + honeypot.
- Embeds externos (YouTube) solo con patrón validado y sandbox.

### Infraestructura

- Secretos: `.env.local` (git-ignored) / Vercel env / GitHub secrets. `detect-secrets` en pre-commit con baseline.
- `npm audit --audit-level=high` en CI.
- HTTPS forzado (Vercel). Endpoints cron con `CRON_SECRET`.

### Datos personales

- Minimización: el email del adoptante no se comparte con la protectora hasta aprobar la solicitud; ubicaciones de particulares redondeadas.
- Detalle RGPD completo en [PRIVACY](../meta/PRIVACY.md).

## Gestión de vulnerabilidades

- Reporte: ver [SECURITY.md raíz](../../SECURITY.md).
- Clave filtrada → [RB-03](RUNBOOKS.md#rb-03--clave-filtrada-anonservice_roleresend).
- Registro de incidentes: sección al final de este fichero (fecha, alcance, acción, lección).

## Registro de incidentes

_Sin incidentes registrados._

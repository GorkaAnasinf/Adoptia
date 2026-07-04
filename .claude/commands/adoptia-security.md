---
description: Patrones de seguridad de Adoptia — RLS, auth Supabase SSR, secretos, validación, OWASP aplicado
---

# Skill: Seguridad Adoptia

Política completa: `docs/operations/SECURITY.md`. Privacidad/RGPD: `docs/meta/PRIVACY.md`.

## Los 5 mandamientos

1. **RLS en toda tabla, deny by default.** La UI oculta; la BD **prohíbe**. Nunca confíes en que "esa pantalla no se ve".
2. **`SUPABASE_SERVICE_ROLE_KEY` jamás en cliente.** Solo `src/lib/supabase/admin.ts` con `import "server-only"`. Ningún secreto con prefijo `NEXT_PUBLIC_` (los únicos públicos por diseño: URL y anon key).
3. **Zod en servidor SIEMPRE**, aunque el formulario ya valide. El mismo esquema compartido (`src/lib/schemas/`).
4. **Sesión = cookies httpOnly** (`@supabase/ssr`). Nunca tokens en localStorage. En servidor usa `supabase.auth.getUser()` (verifica el JWT), NO `getSession()` a secas.
5. **Autorización explícita en handlers**: verifica rol Y propiedad del recurso antes de actuar; RLS es la segunda red.

## Auth y roles

- Roles en `profiles.role` (`adopter|shelter|admin`), fijado en registro, inmutable por el usuario (política RLS lo impide).
- Middleware de Next protege grupos de rutas por rol; el handler re-verifica (defensa en profundidad).
- Mensajes de auth genéricos — no revelar si un email existe.

## OWASP aplicado a este stack

| Riesgo | Defensa en Adoptia |
|--------|--------------------|
| Inyección SQL | supabase-js parametriza; en SQL propio (RPC) usar parámetros, nunca concatenar |
| XSS | React escapa por defecto; PROHIBIDO `dangerouslySetInnerHTML` con input de usuario; embeds YouTube con patrón validado + sandbox |
| Broken Access Control | RLS + verificación en handler + tests de política |
| CSRF | Cookies SameSite (Supabase SSR) + mutaciones solo vía POST/PATCH autenticados |
| SSRF | Único fetch saliente con input de usuario: Nominatim — URL construida con params codificados, host fijo |
| Subida de ficheros | MIME + tamaño en cliente Y política Storage; nunca servir con content-type del usuario |
| Clickjacking | `X-Frame-Options: DENY` en next.config |

## Datos personales (mínimos que recordar codificando)

- Contacto del adoptante invisible para la protectora hasta aprobar su solicitud.
- Geolocalización del navegador: solo en memoria de sesión, jamás persistida.
- Ubicaciones de particulares (perdidos/encontrados, acogidas): redondeadas ~200 m en lecturas públicas.
- Logs y Sentry sin PII (scrub en `beforeSend`).

## Checklist antes de cerrar cualquier tarea

- [ ] ¿Tabla nueva? → RLS + tests permitido/denegado.
- [ ] ¿Handler nuevo? → auth + Zod + códigos de error semánticos.
- [ ] ¿Formulario público? → honeypot + rate limit.
- [ ] ¿Secreto nuevo? → `.env.example` + `docs/operations/ENVIRONMENT.md`, sin `NEXT_PUBLIC_`.
- [ ] ¿`git diff` contiene alguna clave real? → detect-secrets debe estar en verde.

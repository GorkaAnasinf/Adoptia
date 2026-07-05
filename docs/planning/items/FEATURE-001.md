---
id: FEATURE-001
tipo: feature
titulo: Registro y login de adoptantes y protectoras
estado: hecho
prioridad: alta
hito: "0.2"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-05
---

# FEATURE-001 — Registro y login de adoptantes y protectoras

## Descripción

Cualquier persona puede crear cuenta con email+contraseña o con Google, como adoptante o como protectora. Recuperación de contraseña por email. (Ref. funcional: U6)

## Contexto / impacto

Puerta de entrada de todo: sin cuenta no hay solicitudes ni panel. La fricción aquí mata conversión — el registro debe ser mínimo (los datos de la protectora se piden después, en el onboarding FEATURE-002).

## Plan de desarrollo

### Documentación a consultar

- [ARCHITECTURE](../../technical/ARCHITECTURE.md) (capa auth), skill `adoptia-security` (patrones Supabase Auth + SSR)

### Seguridad

- Sesión gestionada por `@supabase/ssr` (cookies httpOnly); nunca tokens en localStorage.
- El rol se fija en registro (`adopter`/`shelter`) y NO es editable por el usuario (solo admin). Política RLS en `profiles.role`.
- Rate limiting en formularios de auth; mensajes de error que no revelan si el email existe.

### Modelo de datos

- Sin tablas nuevas (`profiles` viene de FEATURE-000). Trigger asigna rol desde metadata de registro.

### API

- Sin handlers propios: flujos de Supabase Auth (confirmación de email, reset password) con plantillas en español.

### Frontend

- Páginas: `/registro` (selector adoptante/protectora), `/login`, `/recuperar`. Google OAuth en ambos.
- Formularios RHF+Zod; estados de error accesibles.

### Tareas TDD

1. Test: registro adoptante crea profile con rol correcto → implementar.
2. Test: registro protectora → rol `shelter` y redirección a onboarding.
3. Test: login con credenciales malas muestra error genérico.
4. Test middleware: rutas protegidas por rol.
5. E2E Playwright: registro → confirmación → login → logout.

### Dependencias

- FEATURE-000.

## Criterios de aceptación / Casuística a cubrir

- [x] Registro con email+password y con Google, eligiendo tipo de cuenta. *(Google OAuth verificado en producción.)*
- [x] Email de confirmación en español; sin confirmar no se puede iniciar sesión. *(SMTP Gmail + plantillas HTML propias con el design system en `assets/emails/templates/`.)*
- [x] Recuperación de contraseña funciona extremo a extremo.
- [x] Un adoptante no puede acceder a `/panel` (protectora) ni a `/admin`; redirecciones correctas.
- [x] Un usuario no puede cambiarse el rol vía API directa a Supabase (RLS + trigger con whitelist adopter/shelter — test contra Postgres real).
- [x] Emails duplicados: mensaje neutro que guía a login/recuperar, sin revelar existencia de cuenta (anti-enumeración).
- [x] Consentimiento RGPD (checkbox política de privacidad) obligatorio en registro.

## Notas de cierre (2026-07-05)

Implementado y en producción (<https://adoptia-eight.vercel.app>):

- Pantallas partidas (imagen + formulario) con imágenes propias, login/registro consistentes y sin scroll.
- Seguridad OWASP: sin open redirect, roles a prueba de escalada (migración `20260705190000`), política de contraseña robusta (mayús/minús/dígito/símbolo) alineada cliente+servidor, CAPTCHA Cloudflare Turnstile en login/registro/recuperación.
- Config de producción hecha: Site/Redirect URLs, Google OAuth, política de contraseñas, rate limits (30/h), Turnstile.

**Mejora futura (no bloqueante):** el widget de Turnstile de Cloudflare aún no está localizado en español por defecto; revisar si se fuerza `language: es` (ya puesto) y monitorizar bloqueos legítimos.

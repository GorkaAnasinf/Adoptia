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

- [x] Registro con email+password y con Google, eligiendo tipo de cuenta. *(código y tests listos; activar proveedor Google en Supabase = config manual pendiente)*
- [x] Email de confirmación en español; sin confirmar no se puede iniciar sesión. *(rama cubierta en código; plantillas en español = config manual del dashboard)*
- [x] Recuperación de contraseña funciona extremo a extremo.
- [x] Un adoptante no puede acceder a `/panel` (protectora) ni a `/admin`; redirecciones correctas.
- [x] Un usuario no puede cambiarse el rol vía API directa a Supabase (RLS lo impide — test contra Postgres real).
- [x] Emails duplicados: mensaje genérico, sin revelar existencia de cuenta.
- [x] Consentimiento RGPD (checkbox política de privacidad) obligatorio en registro.

---
id: FEATURE-000
tipo: feature
titulo: Inicialización y andamiaje del proyecto
estado: hecho
prioridad: alta
hito: "0.1"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-05
---

# FEATURE-000 — Inicialización y andamiaje del proyecto

## Descripción

Poner en marcha el esqueleto técnico completo: aplicación Next.js funcionando, conectada a Supabase, con el esquema de base de datos de la fase 1 migrado, autenticación básica operativa, CI verde y desplegando previews en Vercel. Es el prerequisito de todos los demás items.

## Contexto / impacto

Sin andamiaje no hay proyecto. Define además los patrones (estructura de carpetas, clientes Supabase, validación, i18n) que todos los items posteriores copiarán.

## Plan de desarrollo

### Documentación a consultar

- [ARCHITECTURE](../../technical/ARCHITECTURE.md) (estructura de repo y capas)
- [DATA_MODEL](../../technical/DATA_MODEL.md) + [biblia §3](../../technical/analisis-tecnico.md) (esquema completo)
- [DESIGN](../../technical/DESIGN.md) (tokens para la config de Tailwind)
- Skills: `adoptia-frontend`, `adoptia-backend`, `adoptia-database`, `adoptia-security`

### Seguridad

- RLS habilitada en TODAS las tablas desde la migración baseline (deny by default).
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor; verificar que no se importa en código cliente.
- Headers de seguridad en `next.config.ts` (CSP báse, X-Frame-Options).

### Modelo de datos

- Migración baseline: `profiles`, `shelters`, `animals`, `animal_media`, `shelter_media`, `adoption_requests` + enums + extensión PostGIS + índice GiST en `shelters.location` + trigger de creación de `profiles` al registrarse.
- Políticas RLS según [DATA_MODEL](../../technical/DATA_MODEL.md).

### API

- Sin endpoints de negocio; solo `/api/cron/keepalive` protegido con `CRON_SECRET`.

### Frontend

- `create-next-app` (App Router, TS, Tailwind) + shadcn/ui init con tokens de DESIGN.md (terracota `#9f402d`, teal `#396662`, Montserrat/Open Sans, radios).
- next-intl configurado con `messages/es.json`.
- Layout base: header/footer públicos, página home placeholder.
- Grupos de rutas `(public)/(adopter)/(shelter)/(admin)` creados vacíos.

### Tareas TDD

1. ✅ Scaffold Next.js + Tailwind + shadcn/ui + tokens; test de humo de render de la home.
2. ✅ Clientes Supabase (browser + server con `@supabase/ssr`); test unitario de creación.
3. ✅ Migración baseline + RLS; test de políticas con supabase CLI local o test de integración (anon no lee borradores).
4. ✅ Auth: registro/login mínimo; test de middleware (ruta de panel redirige a login sin sesión).
5. ✅ next-intl; test de que la home no contiene textos hardcodeados fuera de messages.
6. ✅ Vitest + Testing Library + Playwright configurados; cobertura en CI.
7. ⏳ Deploy: proyecto Vercel enlazado, variables de entorno, preview desde `develop` — **manual: requiere cuentas Vercel/Supabase cloud del usuario**.

### Dependencias

- Ninguna.

## Criterios de aceptación / Casuística a cubrir

- [ ] `npm run dev` sirve la home con estilos del design system en <http://localhost:3000>.
- [ ] La home lee algo de Supabase (p. ej. contador de tablas) — conexión extremo a extremo probada.
- [ ] Migración baseline aplica limpia en proyecto nuevo (`supabase db push`); PostGIS activo.
- [ ] Con clave `anon`, un animal sin `published_at` NO es legible (RLS verificada por test).
- [ ] Usuario puede registrarse y al hacerlo existe su fila en `profiles` con rol `adopter`.
- [ ] Ruta de panel sin sesión → redirige a login; con sesión de adoptante → 403/redirección (no es protectora).
- [ ] CI verde: lint, typecheck, tests con cobertura, build, render de planificación.
- [ ] Push a `develop` genera preview en Vercel automáticamente.
- [ ] `.env.local` ausente produce error claro al arrancar, no fallo críptico.

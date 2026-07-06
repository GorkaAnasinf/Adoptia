# Changelog — Adoptia

Formato: [Keep a Changelog](https://keepachangelog.com/es/) adaptado. Versionado 0.x hasta el MVP.

## [0.0.7] — 2026-07-06

### Corregido

- **BUG-003 — Mapa del alta en gris**: la CSP (`img-src`) bloqueaba las tiles de OpenStreetMap; ahora se permite `*.tile.openstreetmap.org` y los iconos de marcador se sirven desde el propio dominio (`/leaflet/`, sin CDN). El mapa del paso de ubicación ya renderiza.
- **BUG-001 / BUG-002 — Onboarding tras confirmar el correo**: al verificar el email, la protectora ve una pantalla "¡Correo verificado!" (split con imagen) y continúa al panel, que la lleva al wizard. El callback ahora tolera el flujo por `token_hash` (`verifyOtp`), válido entre dispositivos.

## [0.0.6] — 2026-07-06

### Añadido

- **FEATURE-002 — Onboarding de protectoras y verificación por admin**: una protectora recién registrada entra a un asistente de 3 pasos (datos de entidad con CIF, ubicación geocodificada sobre mapa Leaflet con pin arrastrable, y perfil público con logo comprimido, descripción y horarios por día) y queda pendiente de verificación; el borrador se guarda paso a paso y se recupera si abandona. Un admin revisa la cola en `/admin/protectoras` y verifica o rechaza (motivo obligatorio), enviando email en español al gestor. Solo las protectoras verificadas son públicas.

### Seguridad

- **Cerrado un hueco de escalada de privilegios**: la política de actualización de `shelters` permitía al dueño cambiar su propio `status` (auto-verificarse). Un trigger `BEFORE UPDATE` ahora impide cambiar `status`/`verification_note` salvo a un admin (con test de RLS permitido/denegado).
- Bucket de Storage `logos` con políticas por dueño (solo escribe en su carpeta `{shelter_id}/`, verificado con tests de RLS reales); CIF y email de entidad únicos.

### Cambiado

- Email transaccional propio de la app por **SMTP de Gmail + plantillas HTML** (Decisión #22, en vez de Resend) — estrena `src/lib/email/`.
- El "gate" de onboarding vive en el middleware: una protectora sin alta enviada queda confinada al wizard hasta completarlo.

### Configuración de producción (pendiente al desplegar)

- Aplicar la migración `20260706100000_feature002_onboarding.sql` a la Supabase cloud y configurar las variables `SMTP_HOST/PORT/USER/PASS` y `MAIL_FROM` en Vercel (ver RB-08).

## [0.0.5] — 2026-07-05

### Añadido

- **CAPTCHA Cloudflare Turnstile** en login, registro y recuperación de contraseña (integración con Supabase; verificado en producción).
- Plantillas de correo HTML propias con el design system (confirmación, invitación, magic link, cambio de correo, reset y reautenticación) en `assets/emails/templates/`, enviadas vía SMTP de Gmail.

### Cambiado

- Rediseño de login y registro: layout partido con imagen, pantallas consistentes entre sí, sin fondos blancos, inputs del mismo tamaño y sin scroll.
- Política de contraseña elevada a mayúscula + minúscula + dígito + símbolo, alineada cliente y servidor (Supabase).
- `cursor-pointer` en botones e interactivos (Tailwind v4 los dejaba en `default`).

### Configuración de producción

- Google OAuth activo, Site/Redirect URLs, rate limits (30/h) y política de contraseñas configurados en Supabase.

## [0.0.4] — 2026-07-05

### Seguridad

- **Escalada de privilegios corregida**: el trigger de alta de usuarios aceptaba cualquier rol de la metadata del signup — un atacante podía crearse como admin llamando a la API directamente. Ahora solo admite adopter/shelter (migración `20260705190000`, aplicada en local y producción, con test de regresión).
- **Open redirect corregido** en el login (`?redirect=` solo acepta rutas internas).
- Política de contraseña reforzada en registro y reset: mínimo 8 caracteres con letras y números.

### Añadido / cambiado

- Pantallas de auth con imágenes reales en el panel lateral (login y registro con imagen propia).
- Email ya registrado: mensaje neutro que guía a iniciar sesión o recuperar contraseña sin revelar si la cuenta existe (anti-enumeración).
- Mensajes de validación específicos por campo (correo inválido, contraseña débil, nombre vacío) — mejor accesibilidad.
- Página dedicada `/confirma-correo` tras el registro con confirmación pendiente.
- Botones con altura mínima táctil de 44 px.

## [0.0.3] — 2026-07-05

### Añadido

- **FEATURE-001 — Registro y login**: cualquier persona puede crear cuenta como adoptante o protectora (selector visual según wireframe), con indicador de fuerza de contraseña, consentimiento RGPD obligatorio con páginas legales, recuperación de contraseña por email, botón "Continuar con Google" (callback PKCE con protección de open redirect) y cierre de sesión desde el header. Flujo completo verificado con E2E reales contra Supabase local. *Pendiente manual: activar proveedor Google y plantillas de email en español en el dashboard de Supabase.*

## [0.0.2] — 2026-07-05

### Añadido

- **FEATURE-000 — Inicialización y andamiaje**: la aplicación existe y funciona en local — Next.js 15 con design system propio (terracota/teal, Montserrat/Open Sans), home conectada a Supabase con contador de animales, registro/login de adoptantes, rutas de panel protegidas por rol, base de datos fase 1 migrada con RLS verificada por tests (10 casos permitido/denegado), i18n en español sin textos hardcodeados (test automático), suite Vitest+Playwright con cobertura 94 % y endpoint keepalive para el plan free de Supabase.
- **FEATURE-017 — Despliegue inicial**: la plataforma está en producción en <https://adoptia-eight.vercel.app> — proyecto Supabase cloud (eu-west-1) con la migración baseline aplicada y PostGIS activo, Vercel con previews automáticas desde `develop`, CI de GitHub Actions en verde con secrets configurados y keepalive del plan free funcionando dos veces por semana.

## [0.0.1] — 2026-07-04

### Añadido

- Inicialización completa del proyecto (esta base documental y de infraestructura):
  - **Documentación** por áreas en `docs/`: producto (PRODUCT_CONTEXT, PLAN, GLOSSARY), técnico (ARCHITECTURE, DATA_MODEL, API_CONTRACTS, DESIGN, DECISIONS + biblia técnica y prompts Stitch), planificación (BACKLOG, ROADMAP, CHATGPT_GATEWAY, items/), operación (SETUP, ENVIRONMENT, OPERATIONS, RUNBOOKS, SECURITY), meta (TESTING, PRIVACY, DOCUMENTATION).
  - **Sistema de items**: 17 items reales (FEATURE-000…016) en `docs/planning/items/` con plantilla `_TEMPLATE.md`; vistas renderizadas con `scripts/render_planning.py`.
  - **Infraestructura**: CI GitHub Actions (lint+typecheck+test+build, render check, docs), keepalive Supabase, pre-commit + detect-secrets, Makefile, MkDocs Material, plantillas de issues y commits.
  - **Manada SDD**: 6 agentes (Balto, Lassie, Snoopy, Bolt, Scooby, Hachiko) + skills de stack (frontend, backend, database, security, testing) en `.claude/commands/`.
  - Ficheros raíz: README, CLAUDE.md, AGENTS.md, CONTRIBUTING, SECURITY.
